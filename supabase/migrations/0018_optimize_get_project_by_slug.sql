-- Optimize the sync trigger to be more specific and ensure an index exists
-- 1. Add an index on people(user_id) if it doesn't exist to speed up the update
CREATE INDEX IF NOT EXISTS idx_people_user_id ON public.people(user_id);

-- 2. Optimize the trigger function
CREATE OR REPLACE FUNCTION public.sync_profile_changes_to_person()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_full_name TEXT;
BEGIN
    -- Only proceed if relevant fields have changed
    IF (OLD.first_name IS DISTINCT FROM NEW.first_name) OR
       (OLD.last_name IS DISTINCT FROM NEW.last_name) OR
       (OLD.email IS DISTINCT FROM NEW.email) OR
       (OLD.phone IS DISTINCT FROM NEW.phone) OR
       (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
    THEN
        -- Construct full name logic
        v_full_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
        
        IF v_full_name = '' AND NEW.email IS NOT NULL THEN
            v_full_name := split_part(NEW.email, '@', 1);
        END IF;

        -- Perform the update efficiently using the user_id index
        UPDATE public.people
        SET
            full_name = v_full_name,
            email = NEW.email,
            phone = NEW.phone,
            avatar_url = NEW.avatar_url,
            -- Smart update for contact JSONB
            contact = jsonb_set(
                jsonb_set(
                    COALESCE(contact, '{}'::jsonb),
                    '{emails}',
                    CASE 
                        WHEN NEW.email IS NOT NULL THEN jsonb_build_array(NEW.email) 
                        ELSE '[]'::jsonb 
                    END
                ),
                '{phones}',
                CASE 
                    WHEN NEW.phone IS NOT NULL THEN jsonb_build_array(NEW.phone) 
                    ELSE '[]'::jsonb 
                END
            ),
            updated_at = NOW()
        WHERE user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$function$;