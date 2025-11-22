CREATE OR REPLACE FUNCTION public.get_user_conversations()
 RETURNS TABLE(conversation_id uuid, is_group boolean, conversation_name text, conversation_avatar text, last_message_content text, last_message_at timestamp with time zone, other_user_id uuid, participants json, created_by uuid, unread_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        c.id as conversation_id,
        c.is_group,
        CASE
            WHEN c.is_group THEN c.group_name
            ELSE (
                SELECT COALESCE(prof.first_name || ' ' || prof.last_name, prof.email)
                FROM public.conversation_participants cp2
                JOIN public.profiles prof ON cp2.user_id = prof.id
                WHERE cp2.conversation_id = c.id AND cp2.user_id <> auth.uid()
                LIMIT 1
            )
        END as conversation_name,
        CASE
            WHEN c.is_group THEN c.avatar_url
            ELSE (
                SELECT prof.avatar_url
                FROM public.conversation_participants cp2
                JOIN public.profiles prof ON cp2.user_id = prof.id
                WHERE cp2.conversation_id = c.id AND cp2.user_id <> auth.uid()
                LIMIT 1
            )
        END as conversation_avatar,
        lm.content as last_message_content,
        -- Use the explicit conversation timestamp if available, otherwise fallback to message
        COALESCE(c.last_message_at, lm.created_at) as last_message_at,
        (
            SELECT cp2.user_id 
            FROM public.conversation_participants cp2 
            WHERE cp2.conversation_id = c.id AND cp2.user_id <> auth.uid() 
            LIMIT 1
        ) as other_user_id,
        COALESCE(participants_agg.data, '[]'::json) as participants,
        c.created_by,
        COALESCE(uc.cnt, 0) as unread_count
    FROM public.conversations c
    -- Only get conversations the user is part of
    JOIN public.conversation_participants my_cp ON c.id = my_cp.conversation_id AND my_cp.user_id = auth.uid()
    -- Filter out hidden conversations
    LEFT JOIN public.hidden_conversations hc ON c.id = hc.conversation_id AND hc.user_id = auth.uid()
    -- Efficiently get the last message using LATERAL
    LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM public.messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) lm ON true
    -- Aggregate participants efficiently
    LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
            'id', p.id,
            'name', COALESCE(p.first_name || ' ' || p.last_name, p.email),
            'avatar_url', p.avatar_url,
            'initials', COALESCE(SUBSTRING(p.first_name, 1, 1) || SUBSTRING(p.last_name, 1, 1), 'NN')
        )) as data
        FROM public.conversation_participants cp
        JOIN public.profiles p ON cp.user_id = p.id
        WHERE cp.conversation_id = c.id
    ) participants_agg ON true
    -- Calculate unread count efficiently
    LEFT JOIN LATERAL (
        SELECT count(*) as cnt
        FROM public.messages m
        WHERE m.conversation_id = c.id
          AND m.created_at > COALESCE(my_cp.read_at, '1970-01-01'::timestamp)
          AND m.sender_id <> auth.uid()
    ) uc ON true
    WHERE hc.conversation_id IS NULL
    ORDER BY COALESCE(c.last_message_at, lm.created_at) DESC NULLS LAST;
END;
$function$;