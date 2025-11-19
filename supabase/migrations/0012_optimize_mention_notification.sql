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
    
    -- Coba dapatkan Task ID. 
    -- Skenario 1: Komentar langsung di task (NEW.task_id ada)
    v_task_id := NEW.task_id;
    
    -- Skenario 2: Komentar adalah tiket. Task ID belum ada di NEW, tapi mungkin sudah ada di tabel tasks (via origin_ticket_id)
    IF v_task_id IS NULL AND NEW.is_ticket = true THEN
        SELECT id INTO v_task_id FROM public.tasks WHERE origin_ticket_id = NEW.id::text LIMIT 1;
    END IF;

    -- Ambil judul task jika task id ditemukan
    IF v_task_id IS NOT NULL THEN
        SELECT title INTO v_task_title FROM public.tasks WHERE id = v_task_id;
    END IF;

    -- 3. Siapkan Konteks Data (Seragam dengan trigger assignment)
    v_context_data := jsonb_build_object(
        'project_id', NEW.project_id,
        'project_name', v_project_name,
        'project_slug', v_project_slug,
        'comment_id', NEW.id::text, -- Critical for debouncing
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
      -- Jika terkait task, arahkan ke tab task
      v_link := '/projects/' || v_project_slug || '?tab=tasks&task=' || v_task_id::text || '&comment=' || NEW.id::text;
    ELSE
      -- Jika diskusi umum, arahkan ke tab diskusi
      v_link := '/projects/' || v_project_slug || '?tab=discussion&comment=' || NEW.id::text;
    END IF;

    -- 5. Buat Notifikasi In-App (Satu record master)
    INSERT INTO public.notifications(type, title, body, resource_type, resource_id, actor_id, data)
    VALUES ('mention', v_notification_title, v_notification_body, 'comment', NEW.id, mentioner_id, jsonb_build_object('link', v_link))
    RETURNING id INTO v_notif_id;

    -- 6. Loop penerima
    FOR recipient_record IN 
        SELECT p.id as recipient_id, p.notification_preferences
        FROM unnest(mentioned_ids) AS t(mentioned_id)
        JOIN public.profiles p ON t.mentioned_id = p.id
        WHERE t.mentioned_id <> mentioner_id -- Jangan notifikasi diri sendiri
    LOOP
        -- In-App Recipient
        IF public.is_notification_enabled(recipient_record.notification_preferences, 'mention') THEN
            INSERT INTO public.notification_recipients(notification_id, user_id)
            VALUES (v_notif_id, recipient_record.recipient_id);
        END IF;

        -- External Notification (WA/Email) -> Masuk ke Dispatcher Cerdas
        -- Dispatcher akan menangani prioritas (Mention > Assignment)
        PERFORM public.create_and_dispatch_notification(recipient_record.recipient_id, 'discussion_mention', v_context_data);
    END LOOP;
      
    RETURN NEW;
END;
$function$;