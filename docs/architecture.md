# Panbil Nature Reserve — System Architecture Blueprint

## 1. Executive System Overview

Panbil Nature Reserve is a premier ecotourism destination in Batam featuring diverse outdoor activities:
- **Edu Park** (Family & educational tours, day-pass entry)
- **Eco Park** (Nature trails & wildlife interaction, day-pass entry)
- **Hiking** (Guided trekking, requires emergency contact info)
- **Paintball** (Group tactical battles, requires fixed slot & min 4 participants)
- **ATV** (All-Terrain Vehicle tours, high demand, limited physical fleet capacity = 10 units, age restriction min 17)

The platform functions as a **multi-activity e-commerce ticketing engine**. Customers can assemble a single cart containing multiple activities on different dates, timeslots, and participant counts, check out in one transaction, and receive individual secure e-tickets with QR codes for on-site scanning.

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer
        Web[React + TypeScript + Vite SPA]
        Mobile[Responsive PWA / Mobile Web for Staff & Customers]
    end

    subgraph CDN & Hosting Layer
        Vercel[Vercel Edge Network / CDN]
    end

    subgraph Backend & BaaS Layer (Supabase)
        Auth[Supabase Auth - JWT + RBAC Claims]
        API[Supabase Auto-REST API & Realtime]
        Edge[Supabase Edge Functions - Webhook & Ticket Gen]
        Storage[Supabase Storage - Media & E-Tickets]
        DB[(PostgreSQL 15+ Database)]
    end

    subgraph External Services
        PG[Payment Gateway - Midtrans / Xendit / Stripe]
        Mail[Email Provider - Resend / SendGrid]
    end

    Web -->|HTTPS / WSS| Vercel
    Mobile -->|HTTPS| Vercel
    Vercel -->|REST / GraphQL| API
    Vercel -->|Auth Request| Auth
    API -->|RLS Enforced| DB
    Edge -->|Atomic RPC| DB
    PG -->|Webhook Callback| Edge
    Edge -->|Send E-Ticket Email| Mail
    Edge -->|Issue Webhook Logs| Storage
```

---

## 3. Technology Stack Specification

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18+ with TypeScript | Strict type safety for complex booking payloads and cart state. |
| **Build Tool & Bundler** | Vite | Ultra-fast HMR and optimized production bundle splits. |
| **Styling & UI Kit** | Tailwind CSS + shadcn/ui | Modern, accessible, customized design system with dark/light themes. |
| **Icons & Micro-animations** | Lucide React + Framer Motion | Dynamic visual feedback for booking steps and hover effects. |
| **Backend as a Service** | Supabase | Instant PostgreSQL API, Auth, Realtime, Storage, and Edge Functions. |
| **Database Engine** | PostgreSQL 15+ | Relational integrity, JSONB support, row locking, stored functions. |
| **Authentication** | Supabase Auth | Native JWTs, session handling, custom claims for Role-Based Access Control. |
| **Media & Assets Storage** | Supabase Storage | High-performance CDN storage for activity media and generated PDF tickets. |
| **Deployment & Hosting** | Vercel | Global CDN deployment, auto-preview builds, serverless routing. |

---

## 4. Recommended Directory Structure

```
panbil-nature-reserve/
├── docs/                      # Architectural Blueprints & Specs
├── supabase/                  # Supabase Configuration & Migrations
│   ├── functions/             # Edge Functions
│   │   ├── payment-webhook/   # Payment Gateway Webhook Receiver
│   │   └── generate-ticket/   # E-Ticket PDF & QR Generator
│   ├── migrations/            # SQL DDL & RLS Policies
│   └── seed.sql               # Seed Conceptual Data
├── src/                       # Frontend Source Code
│   ├── assets/                # Static Images, Fonts, Vectors
│   ├── components/            # UI Components (shadcn/ui + Custom)
│   │   ├── admin/             # Admin Management Components
│   │   ├── booking/           # Cart, Date/Slot Picker, Participant Form
│   │   ├── common/            # Header, Footer, Modal, Loading Skeleton
│   │   ├── staff/             # QR Camera Scanner & Check-in Panel
│   │   └── ui/                # Base shadcn Atomic Components
│   ├── context/               # Auth & Cart Context Providers
│   ├── hooks/                 # Custom React Hooks (useAuth, useCart, useCapacity)
│   ├── layouts/               # AdminLayout, CustomerLayout, StaffLayout
│   ├── lib/                   # Supabase Client, Utils, Validators (Zod)
│   ├── pages/                 # Page Views
│   │   ├── admin/             # Dashboard, Activities, Bookings, Reports
│   │   ├── customer/          # Home, Activity Detail, Cart, Checkout, Profile
│   │   ├── staff/             # Gate Check-in & Scanner View
│   │   └── public/            # Terms, Privacy, FAQ
│   ├── routes/                # Protected Routes & Permission Guards
│   ├── types/                 # TypeScript Interfaces & Database Types
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 5. Domain Architectures

### 5.1 Activity Rule Architecture (Data-Driven Dynamic Rules)
Instead of hardcoding age limits or required fields in React code, activity constraints are defined as dynamic JSONB or relational rows in `activity_rules`.

```
[Activity: ATV] ──> Rule 1: AGE_RESTRICTION (min_age: 17)
                 ──> Rule 2: EQUIPMENT_PROVIDED (Helmets, Boots)
                 ──> Rule 3: PHYSICAL_REQUIREMENT (Driving license/ability)

[Activity: Hiking] ──> Rule 1: REQUIRED_FIELD (emergency_contact_phone)
                    ──> Rule 2: REQUIRED_FIELD (emergency_contact_name)

[Activity: Paintball] ──> Rule 1: MIN_PARTICIPANTS (min_quantity: 4)
                        ──> Rule 2: AGE_RESTRICTION (min_age: 12)
```

The frontend dynamically parses `activity_rules` to build participant form fields, enforce input validation via Zod schemas generated on-the-fly, and display safety warning badges. Adding a new activity (e.g. "Zip Line") requires ZERO frontend code changes.

### 5.2 Dynamic Pricing Architecture
Activities support multiple pricing models in `activity_pricing`:
1. **Per Person Fixed**: Standard cost per individual (e.g., Edu Park Rp 50.000 / person).
2. **Tiered / Group Flat**: Group ticket rate up to N people (e.g., Paintball team rate).
3. **Vehicle / Equipment Unit**: Per unit rental (e.g., ATV 1 bike for 2 riders or 1 rider).
4. **Seasonal / Day Type Surcharges**: Weekend, holiday, or peak hour multiplier.

### 5.3 Schedule & Timeslot Architecture
Activities fall into two operational schedule modes:
- **Slot-Based Activities** (ATV, Paintball, Guided Hiking): Requires specific start and end timeslots (`09:00 - 10:00`, `10:30 - 11:30`).
- **Day-Pass / Open-Access Activities** (Edu Park, Eco Park): Requires date selection without specific timeslots (`requires_timeslot = FALSE`). Daily capacity applies overall.

### 5.4 Capacity & Concurrency Control Architecture (Race Condition Guard)

To prevent overbooking on limited physical assets (e.g., 10 ATVs):
1. **Frontend Attempt**: User selects 5 ATVs for tomorrow 10:00 AM and clicks "Proceed to Checkout".
2. **Atomic Reservation**: Frontend calls Supabase RPC `fn_create_booking_atomic`.
3. **Row Locking**: The database executes `SELECT capacity, booked_count FROM activity_schedules WHERE id = target_schedule FOR UPDATE;`.
4. **Validation & Hold**:
   - If `(booked_count + requested_qty) <= capacity`: Database increments `booked_count` or inserts a `PENDING` booking hold with a 15-minute TTL (`expires_at = NOW() + INTERVAL '15 minutes'`).
   - If `(booked_count + requested_qty) > capacity`: Transaction immediately rolls back with error `"CAPACITY_EXCEEDED"`.
5. **Auto-Cleanup**: A scheduled worker or trigger releases expired `PENDING` bookings if payment is not completed within 15 minutes.
