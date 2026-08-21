-- Panbil Nature Reserve — Migration 006: Add Targeted Activity Promo Codes & Updated RPC
-- File: supabase/migrations/20260821000006_add_targeted_activity_promo.sql

-- 1. Add optional activity_id column to promo_codes if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'promo_codes' 
          AND column_name = 'activity_id'
    ) THEN
        ALTER TABLE public.promo_codes 
        ADD COLUMN activity_id UUID NULL REFERENCES public.activities(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Add index on promo_codes.activity_id for fast targeted lookup
CREATE INDEX IF NOT EXISTS idx_promo_codes_activity ON public.promo_codes(activity_id);

-- 3. Update fn_create_booking_atomic to support both Targeted Activity & Cart-Wide Promos
CREATE OR REPLACE FUNCTION public.fn_create_booking_atomic(
    p_customer_id UUID,
    p_booking_number VARCHAR,
    p_items JSONB,
    p_promo_code VARCHAR DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_booking_id UUID;
    v_gross_cart_total NUMERIC(12, 2) := 0;
    v_eligible_gross_total NUMERIC(12, 2) := 0;
    v_total_discount NUMERIC(12, 2) := 0;
    v_final_amount NUMERIC(12, 2) := 0;
    v_item JSONB;
    v_participant JSONB;
    v_item_id UUID;
    v_sched_capacity INT;
    v_sched_booked INT;
    v_sched_status VARCHAR;
    v_item_qty INT;
    v_unit_price NUMERIC(12, 2);
    v_item_gross NUMERIC(12, 2);
    v_item_discount NUMERIC(12, 2);
    v_item_net NUMERIC(12, 2);
    v_allocated_discount NUMERIC(12, 2) := 0;
    v_item_activity_id UUID;

    -- Promo code variables
    v_promo_id UUID;
    v_promo_activity_id UUID;
    v_discount_type VARCHAR;
    v_discount_value NUMERIC(12, 2);
    v_min_purchase NUMERIC(12, 2);
    v_max_discount NUMERIC(12, 2);
    v_max_uses INT;
    v_used_count INT;
    v_start_date DATE;
    v_end_date DATE;
    v_is_active BOOLEAN;

    -- Iteration helpers
    v_item_count INT;
    v_eligible_item_count INT := 0;
    v_index INT := 0;
    v_eligible_index INT := 0;
BEGIN
    v_item_count := jsonb_array_length(p_items);
    IF v_item_count IS NULL OR v_item_count = 0 THEN
        RAISE EXCEPTION 'EMPTY_CART: Booking must contain at least one item';
    END IF;

    -- 1. Validate & Lock Capacity + Calculate Cart Totals
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_qty := (v_item->>'quantity')::INT;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_gross := v_item_qty * v_unit_price;
        v_gross_cart_total := v_gross_cart_total + v_item_gross;

        -- Row-Level Lock FOR UPDATE on target schedule
        SELECT total_capacity, booked_capacity, status
        INTO v_sched_capacity, v_sched_booked, v_sched_status
        FROM public.activity_schedules
        WHERE id = (v_item->>'schedule_id')::UUID
        FOR UPDATE;

        IF v_sched_capacity IS NULL THEN
            RAISE EXCEPTION 'SCHEDULE_NOT_FOUND: Schedule ID % does not exist', (v_item->>'schedule_id');
        END IF;

        IF v_sched_status != 'OPEN' THEN
            RAISE EXCEPTION 'SCHEDULE_CLOSED: Schedule ID % is not open for booking', (v_item->>'schedule_id');
        END IF;

        IF (v_sched_booked + v_item_qty) > v_sched_capacity THEN
            RAISE EXCEPTION 'CAPACITY_EXCEEDED: Requested % slots, but only % available',
                v_item_qty, (v_sched_capacity - v_sched_booked);
        END IF;
    END LOOP;

    -- 2. Server-Side Promo Code Validation & Discount Engine
    IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) != '' THEN
        SELECT id, activity_id, discount_type, discount_value, min_purchase, max_discount, max_uses, used_count, start_date, end_date, is_active
        INTO v_promo_id, v_promo_activity_id, v_discount_type, v_discount_value, v_min_purchase, v_max_discount, v_max_uses, v_used_count, v_start_date, v_end_date, v_is_active
        FROM public.promo_codes
        WHERE UPPER(code) = UPPER(TRIM(p_promo_code))
        FOR UPDATE;

        IF v_promo_id IS NULL OR NOT v_is_active OR CURRENT_DATE < v_start_date OR CURRENT_DATE > v_end_date OR v_used_count >= v_max_uses THEN
            RAISE EXCEPTION 'PROMO_INVALID: Promo code % is invalid, inactive, or expired', p_promo_code;
        END IF;

        IF v_gross_cart_total < COALESCE(v_min_purchase, 0) THEN
            RAISE EXCEPTION 'PROMO_MIN_PURCHASE: Minimum purchase amount of % required for promo %', v_min_purchase, p_promo_code;
        END IF;

        -- Determine Gross Eligible Total (Targeted Activity vs Cart-Wide)
        IF v_promo_activity_id IS NOT NULL THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
            LOOP
                v_item_activity_id := (v_item->>'activity_id')::UUID;
                IF v_item_activity_id = v_promo_activity_id THEN
                    v_item_qty := (v_item->>'quantity')::INT;
                    v_unit_price := (v_item->>'unit_price')::NUMERIC;
                    v_eligible_gross_total := v_eligible_gross_total + (v_item_qty * v_unit_price);
                    v_eligible_item_count := v_eligible_item_count + 1;
                END IF;
            END LOOP;

            IF v_eligible_item_count = 0 OR v_eligible_gross_total = 0 THEN
                RAISE EXCEPTION 'PROMO_NOT_ELIGIBLE: Promo code % is not eligible for any activity in this cart', p_promo_code;
            END IF;
        ELSE
            v_eligible_gross_total := v_gross_cart_total;
            v_eligible_item_count := v_item_count;
        END IF;

        -- Calculate Raw Discount based on Eligible Total
        IF v_discount_type = 'PERCENTAGE' THEN
            v_total_discount := ROUND(v_eligible_gross_total * (v_discount_value / 100.0), 2);
        ELSIF v_discount_type = 'FIXED_AMOUNT' THEN
            v_total_discount := v_discount_value;
        END IF;

        IF v_max_discount IS NOT NULL AND v_max_discount > 0 THEN
            v_total_discount := LEAST(v_total_discount, v_max_discount);
        END IF;

        v_total_discount := LEAST(v_total_discount, v_eligible_gross_total);
    END IF;

    v_final_amount := v_gross_cart_total - v_total_discount;

    -- 3. Create Master Booking (15-Minute Reservation Hold)
    INSERT INTO public.bookings (
        booking_number,
        customer_id,
        total_amount,
        discount_amount,
        final_amount,
        status,
        expires_at
    ) VALUES (
        p_booking_number,
        p_customer_id,
        v_gross_cart_total,
        v_total_discount,
        v_final_amount,
        'PENDING',
        NOW() + INTERVAL '15 minutes'
    ) RETURNING id INTO v_booking_id;

    -- 4. Record Promo Redemption if Applicable
    IF v_promo_id IS NOT NULL AND v_total_discount > 0 THEN
        INSERT INTO public.promo_redemptions (
            promo_id,
            booking_id,
            customer_id,
            discount_applied
        ) VALUES (
            v_promo_id,
            v_booking_id,
            p_customer_id,
            v_total_discount
        );

        UPDATE public.promo_codes
        SET used_count = used_count + 1
        WHERE id = v_promo_id;
    END IF;

    -- 5. Insert Booking Items & Allocate Item Discounts
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_index := v_index + 1;
        v_item_activity_id := (v_item->>'activity_id')::UUID;
        v_item_qty := (v_item->>'quantity')::INT;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_gross := v_item_qty * v_unit_price;

        IF v_total_discount > 0 THEN
            IF v_promo_activity_id IS NOT NULL THEN
                -- Targeted Activity Promo
                IF v_item_activity_id = v_promo_activity_id THEN
                    v_eligible_index := v_eligible_index + 1;
                    IF v_eligible_index = v_eligible_item_count THEN
                        v_item_discount := v_total_discount - v_allocated_discount;
                    ELSE
                        v_item_discount := ROUND((v_item_gross / v_eligible_gross_total) * v_total_discount, 2);
                        v_allocated_discount := v_allocated_discount + v_item_discount;
                    END IF;
                ELSE
                    v_item_discount := 0;
                END IF;
            ELSE
                -- Cart-Wide Promo
                IF v_index = v_item_count THEN
                    v_item_discount := v_total_discount - v_allocated_discount;
                ELSE
                    v_item_discount := ROUND((v_item_gross / v_gross_cart_total) * v_total_discount, 2);
                    v_allocated_discount := v_allocated_discount + v_item_discount;
                END IF;
            END IF;
        ELSE
            v_item_discount := 0;
        END IF;

        v_item_net := v_item_gross - v_item_discount;

        -- Increment booked capacity
        UPDATE public.activity_schedules
        SET booked_capacity = booked_capacity + v_item_qty,
            status = CASE WHEN (booked_capacity + v_item_qty) >= total_capacity THEN 'FULL' ELSE 'OPEN' END
        WHERE id = (v_item->>'schedule_id')::UUID;

        -- Insert Booking Item
        INSERT INTO public.booking_items (
            booking_id,
            activity_id,
            schedule_id,
            quantity,
            unit_price,
            discount_amount,
            subtotal
        ) VALUES (
            v_booking_id,
            v_item_activity_id,
            (v_item->>'schedule_id')::UUID,
            v_item_qty,
            v_unit_price,
            v_item_discount,
            v_item_net
        ) RETURNING id INTO v_item_id;

        -- Insert Participants linked to this item
        IF v_item ? 'participants' THEN
            FOR v_participant IN SELECT * FROM jsonb_array_elements(v_item->'participants')
            LOOP
                INSERT INTO public.booking_participants (
                    booking_item_id,
                    full_name,
                    age,
                    identity_number,
                    emergency_contact_name,
                    emergency_contact_phone
                ) VALUES (
                    v_item_id,
                    v_participant->>'full_name',
                    (v_participant->>'age')::INT,
                    v_participant->>'identity_number',
                    v_participant->>'emergency_contact_name',
                    v_participant->>'emergency_contact_phone'
                );
            END LOOP;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'booking_id', v_booking_id,
        'booking_number', p_booking_number,
        'total_amount', v_gross_cart_total,
        'discount_amount', v_total_discount,
        'final_amount', v_final_amount,
        'expires_at', NOW() + INTERVAL '15 minutes'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
