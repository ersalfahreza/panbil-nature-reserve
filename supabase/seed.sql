-- Panbil Nature Reserve — Conceptual Seed Data
-- File: supabase/seed.sql

-- 1. Activity Categories
INSERT INTO activity_categories (id, name, slug, description, display_order) VALUES
('c1000000-0000-0000-0000-000000000001', 'Educational', 'educational', 'Family and school educational nature experiences', 1),
('c1000000-0000-0000-0000-000000000002', 'Eco Park', 'eco-park', 'Immersive botanical trails and animal interaction', 2),
('c1000000-0000-0000-0000-000000000003', 'Trekking', 'trekking', 'Guided rainforest trails and hill climbing', 3),
('c1000000-0000-0000-0000-000000000004', 'Adventure Sports', 'adventure-sports', 'High-adrenaline outdoor group sports', 4)
ON CONFLICT (slug) DO NOTHING;

-- 2. Activities (5 Core Activities)
INSERT INTO activities (id, category_id, name, slug, description, duration_minutes, min_participants, max_participants, requires_timeslot, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Edu Park', 'edu-park', 'Educational flora & fauna tour suitable for all ages.', 480, 1, 500, FALSE, 'ACTIVE'),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Eco Park', 'eco-park', 'Nature reserve walk with scenic lake views.', 480, 1, 500, FALSE, 'ACTIVE'),
('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003', 'Hiking', 'hiking', 'Guided trek through Batam rainforest trails.', 120, 1, 30, TRUE, 'ACTIVE'),
('a1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'Paintball', 'paintball', 'Tactical group battle arena with complete safety gear.', 60, 4, 20, TRUE, 'ACTIVE'),
('a1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000004', 'ATV', 'atv', 'Off-road All-Terrain Vehicle adventure tour.', 60, 1, 10, TRUE, 'ACTIVE')
ON CONFLICT (slug) DO NOTHING;

-- 3. Conceptual Activity Pricing (Placeholders)
INSERT INTO activity_pricing (activity_id, pricing_name, price, pricing_type) VALUES
('a1000000-0000-0000-0000-000000000001', 'Edu Park Adult Entry', 50000.00, 'PER_PERSON'),
('a1000000-0000-0000-0000-000000000002', 'Eco Park Day Pass', 60000.00, 'PER_PERSON'),
('a1000000-0000-0000-0000-000000000003', 'Guided Hiking Pass', 100000.00, 'PER_PERSON'),
('a1000000-0000-0000-0000-000000000004', 'Paintball Battle Package', 150000.00, 'PER_PERSON'),
('a1000000-0000-0000-0000-000000000005', 'ATV Single Rider Tour', 200000.00, 'PER_UNIT');

-- 4. Activity Rules Configuration
INSERT INTO activity_rules (activity_id, rule_type, min_age, max_age, field_name, rule_description) VALUES
('a1000000-0000-0000-0000-000000000005', 'AGE_RESTRICTION', 17, 65, NULL, 'ATV drivers must be at least 17 years old.'),
('a1000000-0000-0000-0000-000000000005', 'SAFETY_GEAR', NULL, NULL, NULL, 'Helmets and protective boots must be worn at all times.'),
('a1000000-0000-0000-0000-000000000003', 'REQUIRED_FIELD', NULL, NULL, 'emergency_contact_phone', 'Emergency contact details are required for hiking.'),
('a1000000-0000-0000-0000-000000000004', 'TERMS_AND_CONDITIONS', 12, NULL, NULL, 'Minimum 4 participants required per paintball session.');

-- 5. Conceptual Activity Schedules
INSERT INTO activity_schedules (activity_id, schedule_date, start_time, end_time, total_capacity, booked_capacity, status) VALUES
('a1000000-0000-0000-0000-000000000001', CURRENT_DATE, NULL, NULL, 500, 0, 'OPEN'),
('a1000000-0000-0000-0000-000000000002', CURRENT_DATE, NULL, NULL, 500, 0, 'OPEN'),
('a1000000-0000-0000-0000-000000000003', CURRENT_DATE, '08:00:00', '10:00:00', 30, 0, 'OPEN'),
('a1000000-0000-0000-0000-000000000004', CURRENT_DATE, '10:00:00', '11:00:00', 20, 0, 'OPEN'),
('a1000000-0000-0000-0000-000000000005', CURRENT_DATE, '09:00:00', '10:00:00', 10, 0, 'OPEN'),
('a1000000-0000-0000-0000-000000000005', CURRENT_DATE, '10:30:00', '11:30:00', 10, 0, 'OPEN');
