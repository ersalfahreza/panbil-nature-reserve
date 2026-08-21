# Panbil Nature Reserve — Database Implementation Guide

## 1. Overview & Architecture Compliance

This document summarizes the database schema implementation, atomic RPC stored procedures, Row-Level Security (RLS) policies, and deployment steps for **Panbil Nature Reserve — Batam**.

---

## 2. Table Summary (21 PostgreSQL Tables)

| # | Table Name | Purpose | Primary Key | Critical Foreign Keys |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `users` | Auth link & system role assignment | `id` (UUID) | `auth.users(id)` |
| 2 | `customers` | Customer profile details | `id` (UUID) | `users(id)` |
| 3 | `activity_categories` | Activity categorization | `id` (UUID) | None |
| 4 | `activities` | Activity catalog | `id` (UUID) | `activity_categories(id)` |
| 5 | `activity_images` | Media assets for activities | `id` (UUID) | `activities(id)` |
| 6 | `activity_pricing` | Dynamic pricing models | `id` (UUID) | `activities(id)` |
| 7 | `activity_rules` | Data-driven activity rules | `id` (UUID) | `activities(id)` |
| 8 | `activity_schedules` | Date & timeslot slots & capacity | `id` (UUID) | `activities(id)` |
| 9 | `bookings` | Master customer transactions | `id` (UUID) | `customers(id)` |
| 10 | `booking_items` | Multi-activity line items | `id` (UUID) | `bookings(id)`, `activities(id)`, `activity_schedules(id)` |
| 11 | `booking_participants` | Participant list per line item | `id` (UUID) | `booking_items(id)` |
| 12 | `payments` | Payment transaction logs | `id` (UUID) | `bookings(id)` |
| 13 | `payment_events` | Idempotency log for webhooks | `id` (UUID) | `payments(id)` |
| 14 | `promo_codes` | Promotional discount codes | `id` (UUID) | None |
| 15 | `promo_redemptions` | Discount redemption records | `id` (UUID) | `promo_codes(id)`, `bookings(id)`, `customers(id)` |
| 16 | `tickets` | Issued e-tickets | `id` (UUID) | `booking_items(id)`, `booking_participants(id)` |
| 17 | `qr_codes` | Secure cryptographic tokens | `id` (UUID) | `tickets(id)` |
| 18 | `check_ins` | On-site scan validation log | `id` (UUID) | `tickets(id)`, `users(id)` |
| 19 | `notifications` | Customer notification messages | `id` (UUID) | `users(id)` |
| 20 | `audit_logs` | System security & admin audit log | `id` (UUID) | `users(id)` |
| 21 | `settings` | System-wide configuration options | `key` (VARCHAR) | None |

---

## 3. Atomic Database RPC Functions

### 3.1 `fn_create_booking_atomic`
- **Location**: [`supabase/migrations/20260821000001_atomic_functions.sql`](file:///c:/Users/Lenovo/Documents/panbil-nature-reserve/supabase/migrations/20260821000001_atomic_functions.sql#L4)
- **Role**: Atomically checks inventory availability with `SELECT FOR UPDATE` locks on `activity_schedules`, creates a `PENDING` booking with a 15-minute expiration timer, inserts `booking_items` with snapshot pricing, and registers `booking_participants`.
- **Race Condition Defense**: Prevents overbooking during concurrent checkout spikes.

### 3.2 `fn_perform_staff_checkin`
- **Location**: [`supabase/migrations/20260821000001_atomic_functions.sql`](file:///c:/Users/Lenovo/Documents/panbil-nature-reserve/supabase/migrations/20260821000001_atomic_functions.sql#L130)
- **Role**: Validates QR tokens, checks schedule dates, updates ticket status (`VALID` → `USED`), and logs scan attempts in `check_ins` with a `UNIQUE(ticket_id)` constraint.

### 3.3 `fn_release_booking_capacity` & Trigger `trigger_release_booking_capacity`
- **Location**: [`supabase/migrations/20260821000003_release_booking_capacity.sql`](file:///c:/Users/Lenovo/Documents/panbil-nature-reserve/supabase/migrations/20260821000003_release_booking_capacity.sql#L4)
- **Role**: Automatically releases reserved slot capacity on `activity_schedules` whenever a booking status updates from `PENDING` to `EXPIRED`, `CANCELLED`, or `REFUNDED`.
- **Why Capacity is Released**: Prevents Inventory Denial of Service (DoS) caused by abandoned checkouts permanently locking physical inventory.
- **Trigger Condition**: Fires `AFTER UPDATE ON bookings FOR EACH ROW WHEN (OLD.status = 'PENDING' AND NEW.status IN ('EXPIRED', 'CANCELLED', 'REFUNDED'))`.
- **Idempotency**: Trapped strictly on status transition (`OLD.status = 'PENDING'`). Duplicate status updates (e.g. `CANCELLED` -> `CANCELLED` or `CANCELLED` -> `REFUNDED`) will NOT fire the trigger or double-release capacity.
- **Concurrency & Locking**: Uses explicit `SELECT FOR UPDATE` row locks on `activity_schedules` to guarantee transaction-safe atomic decrement (`GREATEST(0, booked_capacity - quantity)`).
### 3.4 SECURITY DEFINER Search Path Hardening
- **Location**: [`supabase/migrations/20260821000004_harden_security_definer_search_path.sql`](file:///c:/Users/Lenovo/Documents/panbil-nature-reserve/supabase/migrations/20260821000004_harden_security_definer_search_path.sql#L1)
- **Hardened Functions**: `public.current_role()`, `public.is_admin()`, `public.is_staff()`, `public.fn_create_booking_atomic()`, `public.fn_perform_staff_checkin()`, `public.fn_release_booking_capacity()`.
- **Why Search Path is Pinned**: `SECURITY DEFINER` functions run with database owner privileges. Unpinned search paths create a PostgreSQL search-path hijacking vulnerability where temporary objects in `pg_temp` can hijack symbol lookups.
- **Pinned Search Path Configuration**: `SET search_path = public, pg_temp`.
- **Schema Qualification Strategy**: All target tables (`public.users`, `public.customers`, `public.bookings`, `public.booking_items`, `public.activity_schedules`, `public.tickets`, `public.qr_codes`, `public.check_ins`) are explicitly schema-qualified in DDL.
### 3.5 Item-Level Discount Snapshot & Targeted Activity Promo Engine
- **Location**: [`supabase/migrations/20260821000005_add_booking_item_discount_snapshot.sql`](file:///c:/Users/Lenovo/Documents/panbil-nature-reserve/supabase/migrations/20260821000005_add_booking_item_discount_snapshot.sql#L1) & [`20260821000006_add_targeted_activity_promo.sql`](file:///c:/Users/Lenovo/Documents/panbil-nature-reserve/supabase/migrations/20260821000006_add_targeted_activity_promo.sql#L1)
- **Purpose**: Records immutable item-level discount snapshots on `booking_items.discount_amount` during transaction creation, eliminating financial ambiguity in multi-activity bookings and enabling accurate partial refunds.
- **Targeted vs Cart-Wide Promo Allocation**:
  - **Targeted Activity Promos** (`promo_codes.activity_id IS NOT NULL`): Discount is applied exclusively to line items matching `activity_id = promo_codes.activity_id`. Non-matching items receive `discount_amount = 0`. (e.g. `ATV20` code targets ATV items only).
  - **Cart-Wide Promos** (`promo_codes.activity_id IS NULL`): Discount is distributed proportionally across all items in cart.
- **Gross vs Net Semantics**:
  - `gross_line_amount` = `quantity * unit_price`
  - `discount_amount` = item-level discount snapshot (`CHECK (discount_amount >= 0 AND discount_amount <= gross_line_amount)`)
  - `booking_items.subtotal` = net line amount = `gross_line_amount - discount_amount`
- **Server-Side Promo Calculation**: Promo codes (`p_promo_code`) passed to `fn_create_booking_atomic` are authoritatively validated against database `promo_codes` rules (validity dates, `is_active`, `min_purchase`, `max_uses`, `max_discount`). Client-submitted discount amounts are strictly ignored, defending against tampering.
- **Reconciliation Invariant**: For every confirmed booking, `SUM(booking_items.discount_amount) = bookings.discount_amount` and `SUM(booking_items.subtotal) = bookings.final_amount`.
- **Partial Refund Support**: Historical partial refunds rely directly on `booking_items.discount_amount` and `booking_items.subtotal`, remaining 100% immutable even if the promo code is later modified or deleted.

---

## 4. Row-Level Security (RLS) Authorization

- **Location**: [`supabase/migrations/20260821000002_rls_policies.sql`](file:///c:/Users/Lenovo/Documents/panbil-nature-reserve/supabase/migrations/20260821000002_rls_policies.sql#L1)
- **Customer Access**: Restricted via RLS policies to viewing and creating only their own profile, bookings, booking_items, tickets, and payments.
- **Staff Access**: Authorized to query bookings, tickets, and log gate check-ins.
- **Admin Access**: Granted full operational control over categories, activities, pricing, schedules, promo codes, and reports.

---

## 5. Migration Execution Guide

To apply these migrations to your local or cloud Supabase environment:

```bash
# 1. Start local Supabase instance (optional for local testing)
npx supabase start

# 2. Apply migrations to database
npx supabase db push

# 3. Seed conceptual data
npx supabase db reset
```
