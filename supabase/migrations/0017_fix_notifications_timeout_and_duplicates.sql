-- 1. Add explicit debounce_key column if it doesn't exist
ALTER TABLE public.pending_notifications 
ADD COLUMN IF NOT EXISTS debounce_key TEXT;

-- 2. Populate debounce_key from existing context_data for backward compatibility
UPDATE public.pending_notifications
SET debounce_key = context_data->>'debounce_key'
WHERE debounce_key IS NULL;

-- 3. Create a STRICT unique index to prevent duplicates regardless of status
-- First, drop the old partial index if it exists (name might vary, so we use IF EXISTS or ignore error)
DROP INDEX IF EXISTS idx_pending_notifications_unique_pending;
-- Drop any other potential duplicate indexes
DROP INDEX IF EXISTS pending_notifications_recipient_id_debounce_key_notification_t_key;

-- Clean up existing duplicates before creating unique index (keep only the first one)
-- FIX: Cast id to text for MIN() function, then cast back to uuid to avoid "function min(uuid) does not exist" error
DELETE FROM public.pending_notifications a USING (
    SELECT min(id::text)::uuid as id, recipient_id, notification_type, debounce_key
    FROM public.pending_notifications 
    WHERE debounce_key IS NOT NULL
    GROUP BY recipient_id, notification_type, debounce_key
    HAVING count(*) > 1
) b
WHERE a.recipient_id = b.recipient_id 
  AND a.notification_type = b.notification_type 
  AND a.debounce_key = b.debounce_key 
  AND a.id <> b.id;

-- Create the new strict unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_notifications_strict_unique 
ON public.pending_notifications (recipient_id, notification_type, debounce_key);

-- 4. Update the create_and_dispatch_notification function
CREATE OR REPLACE FUNCTION public.create_and_dispatch_notification(p_recipient_id uuid, p_notification_type text, p_context_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    recipient_record RECORD;
    v_debounce_key TEXT;
    v_resource_id TEXT;
    v_existing_type TEXT;
    v_is_priority_update BOOLEAN := false;
BEGIN
    -- 1. Get recipient's details and preferences
    SELECT id, phone, email, notification_preferences INTO recipient_record
    FROM public.profiles
    WHERE id = p_recipient_id;

    IF NOT FOUND THEN
        RAISE WARNING 'Recipient with ID % not found for notification.', p_recipient_id;
        RETURN;
    END IF;

    -- 2. Generate a stable debounce key
    v_resource_id := COALESCE(
        p_context_data ->> 'comment_id',
        p_context_data ->> 'task_id',
        p_context_data ->> 'project_id',
        'general'
    );

    -- Key unik: User + Resource
    v_debounce_key := p_recipient_id || ':' || v_resource_id;

    -- Tambahkan debounce_key ke context_data juga untuk referensi
    p_context_data := p_context_data || jsonb_build_object('debounce_key', v_debounce_key);

    -- 3. Logic Prioritas (Optional - mempertahankan logika yang ada)
    SELECT notification_type INTO v_existing_type
    FROM public.pending_notifications
    WHERE recipient_id = p_recipient_id 
      AND debounce_key = v_debounce_key
      AND status = 'pending'
      AND notification_type NOT LIKE '%_email' 
    LIMIT 1;

    IF v_existing_type IS NOT NULL THEN
        IF p_notification_type = 'discussion_mention' AND v_existing_type <> 'discussion_mention' THEN
            v_is_priority_update := true; 
        ELSE
            RETURN; 
        END IF;
    END IF;

    -- 4. Eksekusi Insert/Update dengan STRICT conflict handling
    IF public.is_notification_enabled(recipient_record.notification_preferences, p_notification_type) THEN
        
        -- WhatsApp / Base Notification
        IF (recipient_record.phone IS NOT NULL) AND (recipient_record.notification_preferences->p_notification_type->>'whatsapp' IS DISTINCT FROM 'false') THEN
            IF v_is_priority_update THEN
                UPDATE public.pending_notifications 
                SET notification_type = p_notification_type, context_data = p_context_data, send_at = NOW(), updated_at = NOW()
                WHERE recipient_id = p_recipient_id 
                  AND debounce_key = v_debounce_key
                  AND status = 'pending'
                  AND notification_type NOT LIKE '%_email';
            ELSE
                INSERT INTO public.pending_notifications (recipient_id, send_at, notification_type, context_data, debounce_key)
                VALUES (p_recipient_id, NOW(), p_notification_type, p_context_data, v_debounce_key)
                ON CONFLICT (recipient_id, notification_type, debounce_key) 
                DO NOTHING;
            END IF;
        END IF;
        
        -- Email
        IF (recipient_record.email IS NOT NULL) AND (recipient_record.notification_preferences->p_notification_type->>'email' IS DISTINCT FROM 'false') THEN
            IF v_is_priority_update THEN
                UPDATE public.pending_notifications 
                SET notification_type = p_notification_type || '_email', context_data = p_context_data, send_at = NOW(), updated_at = NOW()
                WHERE recipient_id = p_recipient_id 
                  AND debounce_key = v_debounce_key
                  AND status = 'pending'
                  AND notification_type LIKE '%_email';
            ELSE
                INSERT INTO public.pending_notifications (recipient_id, send_at, notification_type, context_data, debounce_key)
                VALUES (p_recipient_id, NOW(), p_notification_type || '_email', p_context_data, v_debounce_key)
                ON CONFLICT (recipient_id, notification_type, debounce_key) 
                DO NOTHING;
            END IF;
        END IF;

    END IF;
END;
$function$;

-- 5. Update queue_pending_notifications (used by task reminders) to use the new column
CREATE OR REPLACE FUNCTION public.queue_pending_notifications(p_notifications jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.pending_notifications (recipient_id, send_at, notification_type, context_data, debounce_key)
  SELECT
    (x->>'recipient_id')::uuid,
    (x->>'send_at')::timestamptz,
    x->>'notification_type',
    x->'context_data',
    x->'context_data'->>'debounce_key'
  FROM jsonb_array_elements(p_notifications) t(x)
  ON CONFLICT (recipient_id, notification_type, debounce_key) 
  DO NOTHING;
END;
$function$;