-- Panbil Nature Reserve
-- Migration 007: Automatic Auth User Profile Creation

-- =========================================================
-- 1. Function: create public.users + public.customers
--    automatically after auth.users registration
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    -- Create application user
    INSERT INTO public.users (
        id,
        email,
        role
    )
    VALUES (
        NEW.id,
        NEW.email,
        'CUSTOMER'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email;

    -- Create customer profile
    INSERT INTO public.customers (
        user_id,
        full_name,
        phone_number
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            split_part(COALESCE(NEW.email, ''), '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data ->> 'phone_number',
            ''
        )
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number;

    RETURN NEW;
END;
$$;


-- =========================================================
-- 2. Security hardening
-- =========================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user()
FROM PUBLIC;


-- =========================================================
-- 3. Trigger on Supabase Auth
-- =========================================================

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();