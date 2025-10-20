--
-- Name: fn_notify_chat_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.fn_notify_chat_message() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  notif_id uuid; 
  sender_name TEXT; 
  conversation_info RECORD;
  truncated_body TEXT;
  participant RECORD;
BEGIN
  -- Do not process system notifications
  IF NEW.message_type = 'system_notification' THEN
    RETURN NEW;
  END IF;

  -- Get sender and conversation info
  SELECT COALESCE(p.first_name || ' ' || p.last_name, p.email) INTO sender_name FROM public.profiles p WHERE p.id = NEW.sender_id;
  SELECT c.is_group, c.group_name INTO conversation_info FROM public.conversations c WHERE c.id = NEW.conversation_id;

  -- Truncate long messages for notification body
  IF length(NEW.content) > 100 THEN
    truncated_body := substring(NEW.content from 1 for 100) || '...';
  ELSE
    truncated_body := NEW.content;
  END IF;

  -- Loop through all participants to send notifications
  FOR participant IN
    SELECT p.id, p.notification_preferences
    FROM public.conversation_participants cp
    JOIN public.profiles p ON cp.user_id = p.id
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id <> NEW.sender_id
  LOOP
    -- 1. In-app notification logic
    IF public.is_notification_enabled(participant.notification_preferences, 'comment') THEN
      INSERT INTO public.notifications(type, title, body, resource_type, resource_id, actor_id, data)
      VALUES (
        'comment', 
        'Pesan Baru' || (CASE WHEN conversation_info.is_group THEN ' di ' || COALESCE(conversation_info.group_name, 'grup') ELSE ' dari ' || COALESCE(sender_name, 'Seseorang') END), 
        truncated_body, 
        'conversation', 
        NEW.conversation_id, 
        NEW.sender_id, 
        jsonb_build_object('link', '/chat')
      )
      RETURNING id INTO notif_id;

      INSERT INTO public.notification_recipients(notification_id, user_id)
      VALUES (notif_id, participant.id);
    END IF;

    -- 2. External (WhatsApp/Email) notification logic with 5-minute throttling
    IF 
      public.is_notification_enabled(participant.notification_preferences, 'comment') AND
      (
        COALESCE((participant.notification_preferences -> 'comment' ->> 'whatsapp')::boolean, true) OR
        COALESCE((participant.notification_preferences -> 'comment' ->> 'email')::boolean, true)
      )
    THEN
      INSERT INTO public.pending_whatsapp_notifications (
        recipient_id,
        conversation_id,
        send_at,
        notification_type,
        context_data
      )
      VALUES (
        participant.id,
        NEW.conversation_id,
        NOW() + interval '5 minutes', -- Schedule for 5 minutes in the future
        'new_chat_message',
        jsonb_build_object('sender_id', NEW.sender_id)
      )
      -- If a pending notification for this user/convo already exists, do nothing.
      -- This bundles all messages within the 5-minute window into one notification.
      ON CONFLICT (conversation_id, recipient_id) WHERE (status = 'pending')
      DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;