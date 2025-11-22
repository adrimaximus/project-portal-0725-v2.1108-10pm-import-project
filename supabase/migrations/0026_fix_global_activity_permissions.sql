CREATE OR REPLACE FUNCTION public.get_global_project_activities(p_limit integer, p_offset integer)
 RETURNS TABLE(id uuid, project_id uuid, project_name text, project_slug text, user_id uuid, user_name text, user_avatar_url text, user_initials text, type text, details jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_current_user_id UUID := auth.uid();
    v_has_view_all BOOLEAN;
BEGIN
    -- Check for global view permission
    v_has_view_all := public.has_permission('projects:view_all');

    RETURN QUERY
    WITH accessible_projects AS (
        -- If admin/view_all, get all project IDs
        SELECT p.id as proj_id
        FROM public.projects p
        WHERE v_has_view_all
        
        UNION
        
        -- Otherwise, get projects created by user
        SELECT p.id as proj_id
        FROM public.projects p 
        WHERE NOT v_has_view_all AND p.created_by = v_current_user_id
        
        UNION
        
        -- And projects where user is a member
        SELECT pm.project_id as proj_id
        FROM public.project_members pm 
        WHERE NOT v_has_view_all AND pm.user_id = v_current_user_id
    )
    SELECT
        pa.id,
        pa.project_id,
        p.name as project_name,
        p.slug as project_slug,
        pa.user_id,
        COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), u.email, 'System') as user_name,
        u.avatar_url as user_avatar_url,
        COALESCE(
            CASE
                WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL AND u.first_name <> '' AND u.last_name <> '' THEN
                    UPPER(SUBSTRING(u.first_name, 1, 1) || SUBSTRING(u.last_name, 1, 1))
                WHEN u.first_name IS NOT NULL AND u.first_name <> '' THEN
                    UPPER(SUBSTRING(u.first_name, 1, 1))
                WHEN u.email IS NOT NULL THEN
                    UPPER(SUBSTRING(u.email, 1, 2))
                ELSE 'SY'
            END, 'SY'
        ) AS user_initials,
        pa.type,
        pa.details,
        pa.created_at
    FROM
        public.project_activities pa
    JOIN
        public.projects p ON pa.project_id = p.id
    LEFT JOIN
        public.profiles u ON pa.user_id = u.id
    WHERE
        pa.project_id IN (SELECT ap.proj_id FROM accessible_projects ap)
    ORDER BY
        pa.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$;