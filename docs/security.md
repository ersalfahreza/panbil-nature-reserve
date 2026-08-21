# Panbil Nature Reserve — Security & Access Control Architecture

## 1. Authentication & Role-Based Access Control (RBAC)

System authorization is structured across four primary user roles enforced via Supabase Auth JWT custom claims:
1. **SUPER_ADMIN**: Full system access, system settings management, user role assignments, database maintenance.
2. **ADMIN**: Activity catalog management, pricing configuration, schedule slot management, promo codes, financial reports, customer booking overrides.
3. **STAFF**: Scanner interface access, ticket verification, check-in operations, operational participant list viewing.
4. **CUSTOMER**: Self-profile management, personal cart & booking creation, payment completion, viewing personal e-tickets & QR codes.

---

## 2. Role-Based Access Control Matrix

| Table / Feature | Customer | Staff | Admin | Super Admin |
| :--- | :--- | :--- | :--- | :--- |
| `activities`, `categories`, `pricing` | Read (Active) | Read | Read / Write | Full Access |
| `activity_schedules` | Read (Open) | Read | Read / Write | Full Access |
| `bookings`, `booking_items` | Own Only | Read (Search) | Read / Overrides | Full Access |
| `booking_participants` | Own Only | Read (Operational) | Read / Overrides | Full Access |
| `tickets`, `qr_codes` | Own Only | Read / Scan | Read / Manage | Full Access |
| `check_ins` | No Access | Read / Insert (Scan) | Read / Reports | Full Access |
| `payments`, `payment_events` | Own Only | No Access | Read / Overrides | Full Access |
| `audit_logs`, `settings` | No Access | No Access | Read (Audit) | Full Access |

---

## 3. Supabase Row-Level Security (RLS) SQL Policies

Every database table MUST have Row-Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`). Below are core RLS policy specifications:

### 3.1 Security Helper Functions
```sql
-- Helper function to extract user role from JWT claims
CREATE OR REPLACE FUNCTION auth.current_role() RETURNS VARCHAR AS $$
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
        'CUSTOMER'
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS BOOLEAN AS $$
    SELECT auth.current_role() IN ('ADMIN', 'SUPER_ADMIN');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.is_staff() RETURNS BOOLEAN AS $$
    SELECT auth.current_role() IN ('STAFF', 'ADMIN', 'SUPER_ADMIN');
$$ LANGUAGE sql STABLE;
```

### 3.2 Customer RLS Policies (`customers` & `bookings`)
```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Customers can view and update only their own profile
CREATE POLICY customer_self_select ON customers
    FOR SELECT USING (user_id = auth.uid() OR auth.is_staff());

CREATE POLICY customer_self_update ON customers
    FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own bookings; Staff/Admin can view all
CREATE POLICY booking_select ON bookings
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
        OR auth.is_staff()
    );

-- Customers can insert bookings for themselves
CREATE POLICY booking_insert ON bookings
    FOR INSERT WITH CHECK (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );
```

### 3.3 Ticket & QR Code Isolation
```sql
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Customer can read only tickets belonging to their bookings
CREATE POLICY ticket_customer_select ON tickets
    FOR SELECT USING (
        booking_item_id IN (
            SELECT bi.id FROM booking_items bi
            JOIN bookings b ON b.id = bi.booking_id
            JOIN customers c ON c.id = b.customer_id
            WHERE c.user_id = auth.uid()
        )
        OR auth.is_staff()
    );
```

---

## 4. Storage & Media Bucket Security

1. **`activity-media` Bucket (Public)**:
   - Contains activity banner photos and gallery images.
   - Public read access permitted; write access restricted to `auth.is_admin()`.
2. **`e-tickets` Bucket (Private)**:
   - Contains generated PDF e-tickets.
   - Public read access DISABLED.
   - Accessed strictly via Supabase Signed URLs with a 5-minute expiration time, generated on-demand by backend functions.

---

## 5. Webhook & API Protection

1. **HMAC Signature Verification**:
   - External payment gateway webhooks are verified in Supabase Edge Functions using HMAC-SHA256 signatures before processing payload.
2. **Service Role Key Protection**:
   - `SUPABASE_SERVICE_ROLE_KEY` is NEVER exposed to the React frontend application bundle. It resides exclusively in secure environment variables accessible only to serverless Edge Functions.
3. **IDOR Defense**:
   - All API queries reference resource IDs through RLS filters. Directly changing a `booking_id` in API requests returns an empty result set or 403 Forbidden.
4. **Rate Limiting & DDoS Defense**:
   - Vercel Web Application Firewall (WAF) and Supabase API rate limiters limit public endpoints (e.g. max 10 checkout attempts per IP per minute).
