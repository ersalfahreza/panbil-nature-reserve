-- Panbil Nature Reserve — Migration 003: Automatic Capacity Release Trigger
-- File: supabase/migrations/20260821000003_release_booking_capacity.sql

CREATE OR REPLACE FUNCTION public.fn_release_booking_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_total_cap INT;
    v_booked_cap INT;
    v_sched_status VARCHAR;
    v_new_booked INT;
    v_new_status VARCHAR;
BEGIN
    -- Idempotency check: Execute ONLY when transitioning from PENDING to EXPIRED, CANCELLED, or REFUNDED
    IF OLD.status = 'PENDING' AND NEW.status IN ('EXPIRED', 'CANCELLED', 'REFUNDED') THEN
        -- Loop through all booking line items
        FOR v_item IN
            SELECT schedule_id, quantity
            FROM public.booking_items
            WHERE booking_id = NEW.id
        LOOP
            IF v_item.schedule_id IS NOT NULL THEN
                -- Row-level lock FOR UPDATE to avoid race conditions
                SELECT total_capacity, booked_capacity, status
                INTO v_total_cap, v_booked_cap, v_sched_status
                FROM public.activity_schedules
                WHERE id = v_item.schedule_id
                FOR UPDATE;

                IF v_booked_cap IS NOT NULL THEN
                    -- Calculate decremented capacity, ensuring it never drops below 0
                    v_new_booked := GREATEST(0, v_booked_cap - v_item.quantity);

                    -- Restore status: FULL -> OPEN if capacity is freed, but preserve CLOSED status
                    v_new_status := CASE
                        WHEN v_sched_status = 'FULL' AND v_new_booked < v_total_cap THEN 'OPEN'
                        ELSE v_sched_status
                    END;

                    -- Update activity_schedules symmetrically with fn_create_booking_atomic
                    UPDATE public.activity_schedules
                    SET booked_capacity = v_new_booked,
                        status = v_new_status,
                        updated_at = NOW()
                    WHERE id = v_item.schedule_id;
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger: Fire AFTER UPDATE on bookings table
DROP TRIGGER IF EXISTS trigger_release_booking_capacity ON public.bookings;

CREATE TRIGGER trigger_release_booking_capacity
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    WHEN (OLD.status = 'PENDING' AND NEW.status IN ('EXPIRED', 'CANCELLED', 'REFUNDED'))
    EXECUTE FUNCTION public.fn_release_booking_capacity();
