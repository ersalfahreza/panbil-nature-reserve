# Panbil Nature Reserve — Database Design Specification

## 1. Relational Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o| customers : "has profile"
    users ||--o{ audit_logs : "triggers"
    users ||--o{ notifications : "receives"

    activity_categories ||--o{ activities : "categorizes"
    activities ||--o{ activity_images : "has media"
    activities ||--o{ activity_pricing : "defines prices"
    activities ||--o{ activity_rules : "enforces rules"
    activities ||--o{ activity_schedules : "has slots"

    customers ||--o{ bookings : "places"
    promo_codes ||--o{ promo_redemptions : "tracks"
    bookings ||--o{ promo_redemptions : "applies"
    bookings ||--o{ booking_items : "contains"
    bookings ||--o{ payments : "paid via"

    activity_schedules ||--o{ booking_items : "booked in"
    activities ||--o{ booking_items : "refers"
    booking_items ||--o{ booking_participants : "assigns"
    booking_items ||--o{ tickets : "generates"

    payments ||--o{ payment_events : "receives logs"
    tickets ||--o1 qr_codes : "links payload"
    tickets ||--o{ check_ins : "scanned at gate"
    users ||--o{ check_ins : "validated by staff"
```

---

## 2. Table Specifications & Schema Definitions

### 2.1 `users`
System user credentials and auth references linked to Supabase Auth (`auth.users`).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'STAFF', 'CUSTOMER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2.2 `customers`
Customer profile details separated from authentication data.

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    identity_card_number VARCHAR(100), -- NIK / Passport (Optional/Configurable)
    country VARCHAR(100) DEFAULT 'Indonesia',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customers_user_id ON customers(user_id);
```

### 2.3 `activity_categories`
Categories grouping activities (e.g. Adventure, Eco Park, Educational).

```sql
CREATE TABLE activity_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.4 `activities`
Master table for activities supported by the platform.

```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES activity_categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    min_participants INT NOT NULL DEFAULT 1 CHECK (min_participants >= 1),
    max_participants INT NOT NULL DEFAULT 100 CHECK (max_participants >= min_participants),
    requires_timeslot BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activities_slug ON activities(slug);
CREATE INDEX idx_activities_status ON activities(status);
```

### 2.5 `activity_images`
Media assets for activity galleries.

```sql
CREATE TABLE activity_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.6 `activity_pricing`
Flexible pricing models supporting tiered, peak, and vehicle/unit pricing.

```sql
CREATE TABLE activity_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    pricing_name VARCHAR(100) NOT NULL, -- e.g., 'Standard Weekend', 'WNI Adult'
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    pricing_type VARCHAR(50) NOT NULL DEFAULT 'PER_PERSON' CHECK (pricing_type IN ('PER_PERSON', 'FLAT_GROUP', 'PER_UNIT')),
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.7 `activity_rules`
Data-driven configurable activity constraints.

```sql
CREATE TABLE activity_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('AGE_RESTRICTION', 'REQUIRED_FIELD', 'SAFETY_GEAR', 'TERMS_AND_CONDITIONS')),
    min_age INT CHECK (min_age >= 0),
    max_age INT CHECK (max_age >= min_age),
    field_name VARCHAR(100), -- e.g. 'emergency_contact_phone'
    rule_description TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.8 `activity_schedules`
Schedules and capacity slots per activity.

```sql
CREATE TABLE activity_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    start_time TIME, -- NULL if day-pass open access
    end_time TIME,
    total_capacity INT NOT NULL CHECK (total_capacity >= 0),
    booked_capacity INT NOT NULL DEFAULT 0 CHECK (booked_capacity <= total_capacity),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'FULL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_activity_slot UNIQUE (activity_id, schedule_date, start_time)
);
CREATE INDEX idx_schedules_lookup ON activity_schedules(activity_id, schedule_date);
```

### 2.9 `bookings`
Master booking transaction record.

```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. PNR-20260821-0001
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    final_amount NUMERIC(12, 2) NOT NULL CHECK (final_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED')),
    expires_at TIMESTAMPTZ NOT NULL, -- 15-min reservation TTL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### 2.10 `booking_items`
Itemized line items within a booking (supports multi-activity checkout).

```sql
CREATE TABLE booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
    schedule_id UUID NOT NULL REFERENCES activity_schedules(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0), -- Snapshot price
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
```

### 2.11 `booking_participants`
Participant list assigned specifically to individual booking items.

```sql
CREATE TABLE booking_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_item_id UUID NOT NULL REFERENCES booking_items(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    age INT CHECK (age >= 0),
    identity_number VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.12 `payments`
Payment transaction records linked to bookings.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    payment_gateway VARCHAR(100) NOT NULL, -- e.g. Midtrans, Xendit, Manual Transfer
    transaction_id VARCHAR(255) UNIQUE, -- PG Reference ID
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'REFUNDED')),
    payment_proof_url TEXT, -- For manual upload if used
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.13 `payment_events`
Idempotency table logging external payment gateway webhooks.

```sql
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) UNIQUE NOT NULL, -- PG Unique Webhook Event ID
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.14 `promo_codes`
Discount & promotional code configurations.

```sql
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
    min_purchase NUMERIC(12, 2) DEFAULT 0,
    max_discount NUMERIC(12, 2),
    max_uses INT DEFAULT 100,
    used_count INT DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.15 `promo_redemptions`
Logs promo code redemptions per booking.

```sql
CREATE TABLE promo_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    discount_applied NUMERIC(12, 2) NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.16 `tickets`
Issued e-tickets generated after successful payment.

```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. TKT-ATV-20260821-008
    booking_item_id UUID NOT NULL REFERENCES booking_items(id) ON DELETE RESTRICT,
    participant_id UUID REFERENCES booking_participants(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'USED', 'CANCELLED', 'EXPIRED')),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tickets_number ON tickets(ticket_number);
```

### 2.17 `qr_codes`
High-entropy secure tokens for scanning.

```sql
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID UNIQUE NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    qr_token VARCHAR(255) UNIQUE NOT NULL, -- Cryptographic random token (NO PII)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_qr_token ON qr_codes(qr_token);
```

### 2.18 `check_ins`
Audit log of on-site entry check-ins preventing double scans.

```sql
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID UNIQUE NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT, -- Unique constraint prevents double check-in
    scanned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Staff ID
    checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    gate_location VARCHAR(100) DEFAULT 'Main Gate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.19 `notifications`
Customer transactional notification messages.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.20 `audit_logs`
System security and administrative audit trail.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.21 `settings`
Global system configurations.

```sql
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
