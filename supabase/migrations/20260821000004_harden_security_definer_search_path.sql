-- Panbil Nature Reserve — Migration 004: Harden SECURITY DEFINER Functions Search Path
-- File: supabase/migrations/20260821000004_harden_security_definer_search_path.sql

-- 1. public.current_role()
CREATE OR REPLACE FUNCTION public.current_role() RETURNS VARCHAR AS $$
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
        (SELECT role FROM public.users WHERE id = auth.uid()),
        'CUSTOMER'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. public.is_admin()
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
    SELECT public.current_role() IN ('ADMIN', 'SUPER_ADMIN');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. public.is_staff()
CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$
    SELECT public.current_role() IN ('STAFF', 'ADMIN', 'SUPER_ADMIN');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. public.fn_create_booking_atomic()
CREATE OR REPLACE FUNCTION public.fn_create_booking_atomic(
    p_customer_id UUID,
    p_booking_number VARCHAR,
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_booking_id UUID;
    v_total_amount NUMERIC(12, 2) := 0;
    v_item JSONB;
    v_participant JSONB;
    v_item_id UUID;
    v_sched_capacity INT;
    v_sched_booked INT;
    v_sched_status VARCHAR;
    v_item_qty INT;
    v_unit_price NUMERIC(12, 2);
    v_item_subtotal NUMERIC(12, 2);
BEGIN
    -- 1. Validate & Lock Capacity for Each Activity Schedule Item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_qty := (v_item->>'quantity')::INT;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_subtotal := v_item_qty * v_unit_price;
        v_total_amount := v_total_amount + v_item_subtotal;

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

    -- 2. Create Master Booking (15-Minute Reservation Hold)
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
        v_total_amount,
        0,
        v_total_amount,
        'PENDING',
        NOW() + INTERVAL '15 minutes'
    ) RETURNING id INTO v_booking_id;

    -- 3. Create Booking Items, Update Booked Capacity & Save Participants
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_qty := (v_item->>'quantity')::INT;
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_item_subtotal := v_item_qty * v_unit_price;

        UPDATE public.activity_schedules
        SET booked_capacity = booked_capacity + v_item_qty,
            status = CASE WHEN (booked_capacity + v_item_qty) >= total_capacity THEN 'FULL' ELSE 'OPEN' END
        WHERE id = (v_item->>'schedule_id')::UUID;

        INSERT INTO public.booking_items (
            booking_id,
            activity_id,
            schedule_id,
            quantity,
            unit_price,
            subtotal
        ) VALUES (
            v_booking_id,
            (v_item->>'activity_id')::UUID,
            (v_item->>'schedule_id')::UUID,
            v_item_qty,
            v_unit_price,
            v_item_subtotal
        ) RETURNING id INTO v_item_id;

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
        'total_amount', v_total_amount,
        'expires_at', NOW() + INTERVAL '15 minutes'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. public.fn_perform_staff_checkin()
CREATE OR REPLACE FUNCTION public.fn_perform_staff_checkin(
    p_qr_token VARCHAR,
    p_staff_id UUID,
    p_gate VARCHAR DEFAULT 'Main Gate'
) RETURNS JSONB AS $$
DECLARE
    v_ticket_id UUID;
    v_ticket_status VARCHAR;
    v_schedule_date DATE;
    v_current_date DATE := CURRENT_DATE;
    v_ticket_number VARCHAR;
    v_activity_name VARCHAR;
    v_participant_name VARCHAR;
BEGIN
    -- 1. Fetch Ticket & Lock Row FOR UPDATE
    SELECT t.id, t.status, t.ticket_number, s.schedule_date, a.name, COALESCE(p.full_name, 'Visitor')
    INTO v_ticket_id, v_ticket_status, v_ticket_number, v_schedule_date, v_activity_name, v_participant_name
    FROM public.qr_codes q
    JOIN public.tickets t ON t.id = q.ticket_id
    JOIN public.booking_items bi ON bi.id = t.booking_item_id
    JOIN public.activities a ON a.id = bi.activity_id
    JOIN public.activity_schedules s ON s.id = bi.schedule_id
    LEFT JOIN public.booking_participants p ON p.id = t.participant_id
    WHERE q.qr_token = p_qr_token
    FOR UPDATE OF t;

    IF v_ticket_id IS NULL THEN
        RETURN jsonb_build_object('status', 'INVALID', 'message', 'Invalid QR Token');
    END IF;

    IF v_ticket_status = 'USED' THEN
        RETURN jsonb_build_object('status', 'ALREADY_USED', 'message', 'Ticket has already been scanned');
    ELSIF v_ticket_status != 'VALID' THEN
        RETURN jsonb_build_object('status', v_ticket_status, 'message', 'Ticket status is ' || v_ticket_status);
    END IF;

    IF v_schedule_date != v_current_date THEN
        RETURN jsonb_build_object('status', 'WRONG_DATE', 'message', 'Ticket valid for date: ' || v_schedule_date);
    END IF;

    -- 2. Mark Ticket as USED & Log Check-in
    UPDATE public.tickets SET status = 'USED' WHERE id = v_ticket_id;

    INSERT INTO public.check_ins (ticket_id, scanned_by, gate_location)
    VALUES (v_ticket_id, p_staff_id, p_gate);

    RETURN jsonb_build_object(
        'status', 'VALID',
        'ticket_number', v_ticket_number,
        'activity', v_activity_name,
        'participant', v_participant_name,
        'message', 'Check-in Successful'
    );
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('status', 'ALREADY_USED', 'message', 'Ticket was already scanned at another gate');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
