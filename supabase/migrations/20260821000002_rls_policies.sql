-- Panbil Nature Reserve — Migration 002: Row Level Security (RLS) Policies
-- File: supabase/migrations/20260821000002_rls_policies.sql

-- 1. Helper Functions for Role Authorization (in public schema)
CREATE OR REPLACE FUNCTION public.current_role() RETURNS VARCHAR AS $$
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
        (SELECT role FROM public.users WHERE id = auth.uid()),
        'CUSTOMER'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
    SELECT public.current_role() IN ('ADMIN', 'SUPER_ADMIN');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$
    SELECT public.current_role() IN ('STAFF', 'ADMIN', 'SUPER_ADMIN');
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- 2. Enable RLS on All 21 Tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;


-- 3. Public Catalog Read Policies (Activities, Categories, Pricing, Rules, Schedules)
CREATE POLICY policy_categories_public_select ON activity_categories FOR SELECT USING (true);
CREATE POLICY policy_activities_public_select ON activities FOR SELECT USING (status = 'ACTIVE' OR public.is_admin());
CREATE POLICY policy_images_public_select ON activity_images FOR SELECT USING (true);
CREATE POLICY policy_pricing_public_select ON activity_pricing FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY policy_rules_public_select ON activity_rules FOR SELECT USING (true);
CREATE POLICY policy_schedules_public_select ON activity_schedules FOR SELECT USING (status = 'OPEN' OR public.is_staff());


-- 4. User & Customer Profile Policies
CREATE POLICY policy_users_select ON users FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY policy_users_update ON users FOR UPDATE USING (id = auth.uid() OR public.is_admin());

CREATE POLICY policy_customers_select ON customers FOR SELECT USING (user_id = auth.uid() OR public.is_staff());
CREATE POLICY policy_customers_insert ON customers FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY policy_customers_update ON customers FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());


-- 5. Customer Booking & Line Item Isolation Policies
CREATE POLICY policy_bookings_select ON bookings FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR public.is_staff()
);
CREATE POLICY policy_bookings_insert ON bookings FOR INSERT WITH CHECK (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY policy_bookings_update ON bookings FOR UPDATE USING (
    public.is_admin()
);

CREATE POLICY policy_booking_items_select ON booking_items FOR SELECT USING (
    booking_id IN (
        SELECT b.id FROM bookings b
        JOIN customers c ON c.id = b.customer_id
        WHERE c.user_id = auth.uid()
    ) OR public.is_staff()
);

CREATE POLICY policy_booking_participants_select ON booking_participants FOR SELECT USING (
    booking_item_id IN (
        SELECT bi.id FROM booking_items bi
        JOIN bookings b ON b.id = bi.booking_id
        JOIN customers c ON c.id = b.customer_id
        WHERE c.user_id = auth.uid()
    ) OR public.is_staff()
);


-- 6. Ticket, QR Code & Payment Isolation Policies
CREATE POLICY policy_tickets_select ON tickets FOR SELECT USING (
    booking_item_id IN (
        SELECT bi.id FROM booking_items bi
        JOIN bookings b ON b.id = bi.booking_id
        JOIN customers c ON c.id = b.customer_id
        WHERE c.user_id = auth.uid()
    ) OR public.is_staff()
);

CREATE POLICY policy_qr_codes_select ON qr_codes FOR SELECT USING (
    ticket_id IN (
        SELECT t.id FROM tickets t
        JOIN booking_items bi ON bi.id = t.booking_item_id
        JOIN bookings b ON b.id = bi.booking_id
        JOIN customers c ON c.id = b.customer_id
        WHERE c.user_id = auth.uid()
    ) OR public.is_staff()
);

CREATE POLICY policy_payments_select ON payments FOR SELECT USING (
    booking_id IN (
        SELECT b.id FROM bookings b
        JOIN customers c ON c.id = b.customer_id
        WHERE c.user_id = auth.uid()
    ) OR public.is_admin()
);


-- 7. Gate Check-ins & Audit Logs (Staff & Admin Only)
CREATE POLICY policy_checkins_select ON check_ins FOR SELECT USING (public.is_staff());
CREATE POLICY policy_checkins_insert ON check_ins FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY policy_notifications_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY policy_audit_logs_select ON audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY policy_settings_select ON settings FOR SELECT USING (public.is_admin());


-- 8. Admin Write Policies for Management Operations
CREATE POLICY policy_categories_admin_all ON activity_categories FOR ALL USING (public.is_admin());
CREATE POLICY policy_activities_admin_all ON activities FOR ALL USING (public.is_admin());
CREATE POLICY policy_images_admin_all ON activity_images FOR ALL USING (public.is_admin());
CREATE POLICY policy_pricing_admin_all ON activity_pricing FOR ALL USING (public.is_admin());
CREATE POLICY policy_rules_admin_all ON activity_rules FOR ALL USING (public.is_admin());
CREATE POLICY policy_schedules_admin_all ON activity_schedules FOR ALL USING (public.is_admin());
CREATE POLICY policy_promos_admin_all ON promo_codes FOR ALL USING (public.is_admin());
CREATE POLICY policy_settings_admin_all ON settings FOR ALL USING (public.is_admin());
