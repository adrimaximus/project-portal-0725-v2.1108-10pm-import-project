CREATE OR REPLACE FUNCTION public.get_project_by_slug(p_slug text)
 RETURNS TABLE(
    id uuid, slug text, name text, category text, description text, status text, 
    progress integer, total_task_count integer, budget numeric, start_date timestamp with time zone, 
    due_date timestamp with time zone, payment_status text, payment_due_date timestamp with time zone, 
    origin_event_id text, venue text, created_by json, "assignedTo" json, services json, 
    "briefFiles" json, tags jsonb, client_name text, client_avatar_url text, 
    client_company_logo_url text, client_company_name text, client_company_custom_properties jsonb, 
    client_company_id uuid, reactions jsonb, public boolean,
    -- Keeping these columns for type compatibility but returning empty arrays/null
    tasks jsonb, comments jsonb, activities jsonb
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_project_id UUID;
    v_has_access BOOLEAN;
BEGIN
    SELECT p.id INTO v_project_id FROM public.projects p WHERE p.slug = p_slug LIMIT 1;
    IF v_project_id IS NULL THEN RETURN; END IF;

    -- Check permissions
    SELECT (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = v_project_id AND p.public = true) OR
        public.is_admin() OR
        public.has_permission('projects:view_all') OR
        public.is_project_member_internal(v_project_id, auth.uid())
    ) INTO v_has_access;
    
    IF NOT v_has_access THEN RETURN; END IF;

    RETURN QUERY
    SELECT
        p.id, p.slug, p.name, p.category, p.description, p.status, p.progress, p.total_task_count, p.budget, 
        p.start_date, p.due_date, p.payment_status, p.payment_due_date, p.origin_event_id, p.venue,
        -- Creator
        json_build_object(
            'id', p.created_by, 
            'name', COALESCE(NULLIF(TRIM(COALESCE(creator.first_name, '') || ' ' || COALESCE(creator.last_name, '')), ''), creator.email, 'User Deleted'), 
            'email', creator.email, 
            'avatar_url', creator.avatar_url, 
            'initials', COALESCE(CASE WHEN creator.first_name IS NOT NULL AND creator.last_name IS NOT NULL AND creator.first_name <> '' AND creator.last_name <> '' THEN UPPER(SUBSTRING(creator.first_name, 1, 1) || SUBSTRING(creator.last_name, 1, 1)) WHEN creator.first_name IS NOT NULL AND creator.first_name <> '' THEN UPPER(SUBSTRING(creator.first_name, 1, 1)) WHEN creator.email IS NOT NULL THEN UPPER(SUBSTRING(creator.email, 1, 2)) ELSE 'NN' END, 'NN')
        ) AS created_by,
        -- Assigned Members
        (SELECT COALESCE(json_agg(jsonb_build_object(
            'id', pm.user_id, 
            'name', COALESCE(NULLIF(TRIM(COALESCE(prof.first_name, '') || ' ' || COALESCE(prof.last_name, '')), ''), prof.email, 'User Deleted'), 
            'email', prof.email, 
            'avatar_url', prof.avatar_url, 
            'initials', COALESCE(CASE WHEN prof.first_name IS NOT NULL AND prof.last_name IS NOT NULL AND prof.first_name <> '' AND prof.last_name <> '' THEN UPPER(SUBSTRING(prof.first_name, 1, 1) || SUBSTRING(prof.last_name, 1, 1)) WHEN prof.first_name IS NOT NULL AND prof.first_name <> '' THEN UPPER(SUBSTRING(prof.first_name, 1, 1)) WHEN prof.email IS NOT NULL THEN UPPER(SUBSTRING(prof.email, 1, 2)) ELSE 'NN' END, 'NN'), 
            'role', pm.role
        )), '[]'::json) FROM project_members pm LEFT JOIN profiles prof ON pm.user_id = prof.id WHERE pm.project_id = v_project_id) AS "assignedTo",
        -- Services
        (SELECT COALESCE(json_agg(ps.service_title), '[]'::json) FROM project_services ps WHERE ps.project_id = v_project_id) AS services,
        -- Brief Files
        (SELECT COALESCE(json_agg(json_build_object('id', pf.id, 'name', pf.name, 'size', pf.size, 'type', pf.type, 'url', pf.url, 'storage_path', pf.storage_path, 'created_at', pf.created_at)), '[]'::json) FROM project_files pf WHERE pf.project_id = v_project_id) AS "briefFiles",
        -- Tags
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)), '[]'::jsonb) FROM project_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.project_id = v_project_id) AS tags,
        -- Client Details
        COALESCE(pc.client_name, direct_company.name),
        pc.client_avatar_url,
        COALESCE(pc.client_company_logo_url, direct_company.logo_url),
        COALESCE(pc.client_company_name, direct_company.name),
        COALESCE(pc.client_company_custom_properties, direct_company.custom_properties),
        p.client_company_id,
        -- Reactions
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', pr.id, 'emoji', pr.emoji, 'user_id', pr.user_id, 'user_name', COALESCE(prof_react.first_name || ' ' || prof_react.last_name, prof_react.email))), '[]'::jsonb) FROM public.project_reactions pr JOIN public.profiles prof_react ON pr.user_id = prof_react.id WHERE pr.project_id = v_project_id) as reactions,
        p.public,
        -- Optimization: Return empty arrays for heavy lists fetched separately
        '[]'::jsonb as tasks,
        '[]'::jsonb as comments,
        '[]'::jsonb as activities
    FROM projects p
    LEFT JOIN profiles creator ON p.created_by = creator.id
    LEFT JOIN public.companies direct_company ON p.client_company_id = direct_company.id
    LEFT JOIN (
        SELECT pp.project_id, p_client.full_name as client_name, p_client.avatar_url as client_avatar_url, c.logo_url as client_company_logo_url, COALESCE(c.name, p_client.company) as client_company_name, c.custom_properties as client_company_custom_properties, ROW_NUMBER() OVER(PARTITION BY pp.project_id ORDER BY p_client.created_at) as rn
        FROM public.people_projects pp
        LEFT JOIN public.people p_client ON pp.person_id = p_client.id
        LEFT JOIN public.companies c ON p_client.company_id = c.id
        WHERE pp.project_id = v_project_id
    ) pc ON p.id = pc.project_id AND pc.rn = 1
    WHERE p.id = v_project_id;
END;
$function$;