CREATE OR REPLACE FUNCTION public.get_task_comments(p_task_id uuid)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, text text, is_ticket boolean, attachment_url text, attachment_name text, attachments_jsonb jsonb, author jsonb, reactions jsonb, author_id uuid, project_id uuid, task_id uuid, reply_to_comment_id uuid, "repliedMessage" jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Security check: Ensure the current user can access this task's project
    IF NOT public.can_access_task(p_task_id) THEN
        RAISE EXCEPTION 'Permission denied to view comments for this task.';
    END IF;

    RETURN QUERY
    WITH relevant_comments AS (
        SELECT c.id
        FROM public.comments c
        WHERE c.task_id = p_task_id
    ),
    comment_reactions_agg AS (
        SELECT
            cr.comment_id,
            jsonb_agg(jsonb_build_object(
                'id', cr.id,
                'emoji', cr.emoji,
                'user_id', cr.user_id,
                'user_name', COALESCE(p_react.first_name || ' ' || p_react.last_name, p_react.email, 'Deleted User'),
                'profiles', jsonb_build_object(
                    'id', p_react.id,
                    'first_name', p_react.first_name,
                    'last_name', p_react.last_name
                )
            )) as reactions
        FROM public.comment_reactions cr
        JOIN relevant_comments rc ON cr.comment_id = rc.id
        LEFT JOIN public.profiles p_react ON cr.user_id = p_react.id
        GROUP BY cr.comment_id
    )
    SELECT
        c.id,
        c.created_at,
        c.text,
        c.is_ticket,
        c.attachment_url,
        c.attachment_name,
        c.attachments_jsonb,
        jsonb_build_object(
            'id', COALESCE(author.id, '00000000-0000-0000-0000-000000000000'),
            'first_name', COALESCE(author.first_name, 'Deleted'),
            'last_name', COALESCE(author.last_name, 'User'),
            'email', COALESCE(author.email, ''),
            'avatar_url', author.avatar_url
        ) as author,
        COALESCE(cra.reactions, '[]'::jsonb) as reactions,
        c.author_id,
        c.project_id,
        c.task_id,
        c.reply_to_comment_id,
        CASE
            WHEN rc.id IS NOT NULL THEN jsonb_build_object(
                'content', rc.text,
                'senderName', COALESCE(NULLIF(TRIM(COALESCE(rp.first_name, '') || ' ' || COALESCE(rp.last_name, '')), ''), rp.email, 'User Deleted'),
                'isDeleted', false
            )
            ELSE NULL
        END as "repliedMessage"
    FROM
        public.comments c
    LEFT JOIN
        public.profiles author ON c.author_id = author.id
    LEFT JOIN
        comment_reactions_agg cra ON c.id = cra.comment_id
    LEFT JOIN
        public.comments rc ON c.reply_to_comment_id = rc.id
    LEFT JOIN
        public.profiles rp ON rc.author_id = rp.id
    WHERE
        c.task_id = p_task_id
    ORDER BY
        c.created_at ASC;
END;
$function$;