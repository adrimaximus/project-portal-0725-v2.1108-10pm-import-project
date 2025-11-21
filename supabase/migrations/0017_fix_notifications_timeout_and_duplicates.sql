-- 1. Optimasi fungsi get_user_notifications untuk mencegah timeout (Error 520)
-- Mengubah urutan JOIN dan memastikan penggunaan index yang efisien
CREATE OR REPLACE FUNCTION public.get_user_notifications(p_limit integer, p_offset integer)
 RETURNS TABLE(id uuid, type text, title text, body text, created_at timestamp with time zone, resource_type text, resource_id uuid, data jsonb, actor jsonb, read_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.type,
        n.title,
        n.body,
        n.created_at,
        n.resource_type,
        n.resource_id,
        n.data,
        jsonb_build_object(
            'id', p.id,
            'name', COALESCE(p.first_name || ' ' || p.last_name, p.email),
            'avatar_url', p.avatar_url
        ) as actor,
        nr.read_at
    FROM
        public.notification_recipients nr
    JOIN
        public.notifications n ON nr.notification_id = n.id
    LEFT JOIN
        public.profiles p ON n.actor_id = p.id
    WHERE
        nr.user_id = auth.uid()
    ORDER BY
        n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$;

-- 2. Memperbarui fungsi dispatcher untuk mencegah duplikat (Debouncing)
-- Fungsi ini sekarang akan mengecek apakah ada notifikasi "pending" yang identik sebelum membuat yang baru.
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
    v_existing_id UUID;
BEGIN
    -- 1. Get recipient's details and preferences
    SELECT id, phone, email, notification_preferences INTO recipient_record
    FROM public.profiles
    WHERE id = p_recipient_id;

    IF NOT FOUND THEN
        RAISE WARNING 'Recipient with ID % not found for notification.', p_recipient_id;
        RETURN;
    END IF;

    -- 2. Generate Deduplication Key (Debounce Key)
    -- Kita membuat kunci unik berdasarkan tipe resource ID utama.
    -- Prioritas: comment_id (paling spesifik) -> task_id -> project_id.
    v_resource_id := COALESCE(
        p_context_data ->> 'comment_id',
        p_context_data ->> 'task_id',
        p_context_data ->> 'project_id',
        'general'
    );

    -- Key unik: User + Tipe Notif + ID Resource
    -- Contoh: "user123:discussion_mention:comment555"
    v_debounce_key := p_recipient_id || ':' || p_notification_type || ':' || v_resource_id;

    -- Tambahkan debounce_key ke context data agar bisa dicek nanti
    p_context_data := p_context_data || jsonb_build_object('debounce_key', v_debounce_key);

    -- 3. Cek apakah sudah ada notifikasi PENDING dengan key yang sama
    -- Ini mencegah spam jika trigger tereksekusi ganda dalam waktu singkat
    SELECT id INTO v_existing_id
    FROM public.pending_notifications
    WHERE recipient_id = p_recipient_id
      AND (context_data->>'debounce_key') = v_debounce_key
      AND status = 'pending'
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Jika sudah ada yang pending untuk hal yang SAMA PERSIS, jangan buat baru.
        -- Kita bisa update 'send_at' jika ingin menunda pengiriman (opsional), tapi di sini kita abaikan (debounce).
        RETURN;
    END IF;

    -- 4. Insert jika belum ada duplikat
    IF public.is_notification_enabled(recipient_record.notification_preferences, p_notification_type) THEN
        
        -- WhatsApp / Base Notification
        IF (recipient_record.phone IS NOT NULL) AND (recipient_record.notification_preferences->p_notification_type->>'whatsapp' IS DISTINCT FROM 'false') THEN
            INSERT INTO public.pending_notifications (recipient_id, send_at, notification_type, context_data)
            VALUES (p_recipient_id, NOW(), p_notification_type, p_context_data);
        END IF;
        
        -- Email (Insert terpisah dengan suffix _email untuk diproses worker berbeda jika perlu)
        IF (recipient_record.email IS NOT NULL) AND (recipient_record.notification_preferences->p_notification_type->>'email' IS DISTINCT FROM 'false') THEN
            INSERT INTO public.pending_notifications (recipient_id, send_at, notification_type, context_data)
            VALUES (p_recipient_id, NOW(), p_notification_type || '_email', p_context_data);
        END IF;

    END IF;
END;
$function$;

-- 3. Memastikan trigger mention mengirimkan comment_id untuk deduplikasi yang akurat
CREATE OR REPLACE FUNCTION public.schedule_mention_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    mentioned_ids UUID[];
    mentioner_id UUID := auth.uid();
    v_mentioner_name TEXT;
    v_project_name TEXT;
    v_project_slug TEXT;
    v_task_id UUID;
    v_task_title TEXT;
    v_context_data JSONB;
    recipient_record RECORD;
    v_link TEXT;
    v_notification_title TEXT;
    v_notification_body TEXT;
    v_notif_id UUID;
BEGIN
    -- 1. Ekstrak ID pengguna yang disebutkan
    SELECT array_agg(DISTINCT (matches[1])::uuid)
    INTO mentioned_ids
    FROM regexp_matches(NEW.text, '@\\[[^\\]]+\\]\\s*\\(([^)]+)\\)', 'g') AS matches;

    IF mentioned_ids IS NULL OR array_length(mentioned_ids, 1) = 0 THEN
        RETURN NEW;
    END IF;

    -- 2. Kumpulkan data konteks
    SELECT p.name, p.slug INTO v_project_name, v_project_slug FROM public.projects p WHERE p.id = NEW.project_id;
    SELECT COALESCE(p.first_name || ' ' || p.last_name, p.email) INTO v_mentioner_name FROM public.profiles p WHERE p.id = mentioner_id;
    
    v_task_id := NEW.task_id;
    
    IF v_task_id IS NULL AND NEW.is_ticket = true THEN
        SELECT id INTO v_task_id FROM public.tasks WHERE origin_ticket_id = NEW.id::text LIMIT 1;
    END IF;

    IF v_task_id IS NOT NULL THEN
        SELECT title INTO v_task_title FROM public.tasks WHERE id = v_task_id;
    END IF;

    -- 3. Siapkan Konteks Data (PENTING: comment_id disertakan untuk debounce)
    v_context_data := jsonb_build_object(
        'project_id', NEW.project_id,
        'project_name', v_project_name,
        'project_slug', v_project_slug,
        'comment_id', NEW.id::text, -- Kunci deduplikasi utama
        'comment_text', public.format_mentions(NEW.text),
        'mentioner_id', mentioner_id,
        'mentioner_name', v_mentioner_name,
        'attachments', NEW.attachments_jsonb,
        'task_id', v_task_id,
        'task_title', v_task_title
    );

    -- 4. Tentukan Link dan Pesan
    v_notification_title := 'You were mentioned in: ' || v_project_name;
    v_notification_body := COALESCE(v_mentioner_name, 'Someone') || ' mentioned you in a comment.';
    
    IF v_task_id IS NOT NULL THEN
      v_link := '/projects/' || v_project_slug || '?tab=tasks&task=' || v_task_id::text || '&comment=' || NEW.id::text;
    ELSE
      v_link := '/projects/' || v_project_slug || '?tab=discussion&comment=' || NEW.id::text;
    END IF;

    -- 5. Buat Notifikasi In-App
    INSERT INTO public.notifications(type, title, body, resource_type, resource_id, actor_id, data)
    VALUES ('mention', v_notification_title, v_notification_body, 'comment', NEW.id, mentioner_id, jsonb_build_object('link', v_link))
    RETURNING id INTO v_notif_id;

    -- 6. Loop penerima
    FOR recipient_record IN 
        SELECT p.id as recipient_id, p.notification_preferences
        FROM unnest(mentioned_ids) AS t(mentioned_id)
        JOIN public.profiles p ON t.mentioned_id = p.id
        WHERE t.mentioned_id <> mentioner_id
    LOOP
        IF public.is_notification_enabled(recipient_record.notification_preferences, 'mention') THEN
            INSERT INTO public.notification_recipients(notification_id, user_id)
            VALUES (v_notif_id, recipient_record.recipient_id);
        END IF;

        -- Pemicu Notifikasi Eksternal (WA/Email) via Dispatcher yang sudah diperbaiki
        PERFORM public.create_and_dispatch_notification(recipient_record.recipient_id, 'discussion_mention', v_context_data);
    END LOOP;
      
    RETURN NEW;
END;
$function$;