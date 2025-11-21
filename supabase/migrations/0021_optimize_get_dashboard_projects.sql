-- Optimization: get_dashboard_projects
-- Strategy: Filter IDs first, apply pagination, then join details only for the resulting page.
-- This prevents scanning/joining the entire database for every request.

CREATE OR REPLACE FUNCTION public.get_dashboard_projects(
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0,
    p_search_term text DEFAULT NULL,
    p_exclude_other_personal boolean DEFAULT true,
    p_owner_ids uuid[] DEFAULT NULL,
    p_member_ids uuid[] DEFAULT NULL,
    p_status_exclude text[] DEFAULT NULL,
    p_year integer DEFAULT NULL,
    p_timeframe text DEFAULT NULL,
    p_sort_key text DEFAULT 'start_date',
    p_sort_direction text DEFAULT 'desc'
)
RETURNS TABLE(
    id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name text,
    category text,
    description text,
    status text,
    progress integer,
    budget numeric,
    start_date timestamp with time zone,
    due_date timestamp with time zone,
    payment_status text,
    origin_event_id text,
    payment_due_date timestamp with time zone,
    slug text,
    public boolean,
    venue text,
    kanban_order integer,
    "position" integer,
    payment_kanban_order integer,
    invoice_number text,
    email_sending_date timestamp with time zone,
    hardcopy_sending_date timestamp with time zone,
    channel text,
    po_number text,
    paid_date timestamp with time zone,
    invoice_attachment_url text,
    invoice_attachment_name text,
    client_company_id uuid,
    personal_for_user_id uuid,
    payment_terms jsonb,
    created_by jsonb,
    "assignedTo" jsonb,
    tasks jsonb,
    comments jsonb,
    services jsonb,
    "briefFiles" jsonb,
    activities jsonb,
    tags jsonb,
    client_name text,
    client_avatar_url text,
    client_company_logo_url text,
    client_company_name text,
    client_company_custom_properties jsonb,
    reactions jsonb,
    invoice_attachments jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    WITH filtered_projects AS (
        SELECT p.id
        FROM public.projects p
        WHERE
            -- Access Control: Creator or Member
            (
                p.created_by = v_user_id
                OR EXISTS (
                    SELECT 1 FROM public.project_members pm 
                    WHERE pm.project_id = p.id AND pm.user_id = v_user_id
                )
            )
            -- Filters
            AND (NOT p_exclude_other_personal OR p.personal_for_user_id IS NULL OR p.personal_for_user_id = v_user_id)
            AND (p_owner_ids IS NULL OR p.created_by = ANY(p_owner_ids))
            AND (p_member_ids IS NULL OR EXISTS (
                SELECT 1 FROM public.project_members pm 
                WHERE pm.project_id = p.id AND pm.user_id = ANY(p_member_ids)
            ))
            AND (p_status_exclude IS NULL OR NOT (p.status = ANY(p_status_exclude)))
            AND (p_year IS NULL OR EXTRACT(YEAR FROM p.start_date) = p_year)
            AND (
                p_timeframe IS NULL OR
                (p_timeframe = 'upcoming' AND p.start_date >= now()) OR
                (p_timeframe = 'past' AND p.start_date < now())
            )
            -- Search (Optimized: Only join if search term exists)
            AND (
                p_search_term IS NULL OR p_search_term = '' OR
                p.name ILIKE '%' || p_search_term || '%' OR
                COALESCE(p.description, '') ILIKE '%' || p_search_term || '%' OR
                COALESCE(p.venue, '') ILIKE '%' || p_search_term || '%' OR
                -- Search in connected people (Client Name)
                EXISTS (
                    SELECT 1 
                    FROM public.people_projects pp
                    JOIN public.people pers ON pp.person_id = pers.id
                    WHERE pp.project_id = p.id
                    AND pers.full_name ILIKE '%' || p_search_term || '%'
                )
                -- Search in connected company (Client Company)
                OR EXISTS (
                    SELECT 1 
                    FROM public.companies c 
                    WHERE (c.id = p.client_company_id OR c.id IN (
                        SELECT pers.company_id 
                        FROM public.people_projects pp
                        JOIN public.people pers ON pp.person_id = pers.id
                        WHERE pp.project_id = p.id
                    ))
                    AND c.name ILIKE '%' || p_search_term || '%'
                )
            )
        ORDER BY
            CASE WHEN p_sort_key = 'start_date' AND p_sort_direction = 'asc' THEN p.start_date END ASC NULLS LAST,
            CASE WHEN p_sort_key = 'start_date' AND p_sort_direction = 'desc' THEN p.start_date END DESC NULLS LAST,
            CASE WHEN p_sort_key = 'name' AND p_sort_direction = 'asc' THEN p.name END ASC,
            CASE WHEN p_sort_key = 'name' AND p_sort_direction = 'desc' THEN p.name END DESC,
            CASE WHEN p_sort_key = 'updated_at' AND p_sort_direction = 'asc' THEN p.updated_at END ASC,
            CASE WHEN p_sort_key = 'updated_at' AND p_sort_direction = 'desc' THEN p.updated_at END DESC,
            p.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ),
    -- Fetch Aggregates only for the filtered page (max 20 items usually)
    project_members_agg AS (
        SELECT
            pm.project_id,
            jsonb_agg(jsonb_build_object(
                'id', p.id,
                'name', COALESCE(p.first_name || ' ' || p.last_name, p.email),
                'avatar_url', p.avatar_url,
                'initials', COALESCE(UPPER(SUBSTRING(p.first_name, 1, 1) || SUBSTRING(p.last_name, 1, 1)), 'NN'),
                'role', pm.role
            )) AS assignedTo
        FROM public.project_members pm
        JOIN public.profiles p ON pm.user_id = p.id
        WHERE pm.project_id IN (SELECT id FROM filtered_projects)
        GROUP BY pm.project_id
    ),
    project_tags_agg AS (
        SELECT
            pt.project_id,
            jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) as tags
        FROM public.project_tags pt
        JOIN public.tags t ON pt.tag_id = t.id
        WHERE pt.project_id IN (SELECT id FROM filtered_projects)
        GROUP BY pt.project_id
    ),
    -- Fetch Client Info
    project_client_info AS (
        SELECT
            fp.id as project_id,
            pers.full_name as client_name,
            pers.avatar_url as client_avatar_url,
            COALESCE(comp.name, pers.company) as client_company_name,
            comp.logo_url as client_company_logo_url,
            comp.custom_properties as client_company_custom_properties
        FROM filtered_projects fp
        LEFT JOIN LATERAL (
            SELECT pp.person_id 
            FROM public.people_projects pp 
            WHERE pp.project_id = fp.id 
            ORDER BY pp.created_at ASC LIMIT 1
        ) pp_lat ON true
        LEFT JOIN public.people pers ON pp_lat.person_id = pers.id
        LEFT JOIN public.companies comp ON pers.company_id = comp.id
    )

    SELECT
        p.id, p.created_at, p.updated_at, p.name, p.category, p.description, p.status, p.progress, p.budget,
        p.start_date, p.due_date, p.payment_status, p.origin_event_id, p.payment_due_date, p.slug, p.public,
        p.venue, p.kanban_order, p.position, p.payment_kanban_order, p.invoice_number, p.email_sending_date,
        p.hardcopy_sending_date, p.channel, p.po_number, p.paid_date, p.invoice_attachment_url,
        p.invoice_attachment_name, p.client_company_id, p.personal_for_user_id, p.payment_terms,
        -- Creator
        jsonb_build_object(
            'id', creator.id,
            'name', COALESCE(creator.first_name || ' ' || creator.last_name, creator.email),
            'avatar_url', creator.avatar_url,
            'initials', COALESCE(UPPER(SUBSTRING(creator.first_name, 1, 1) || SUBSTRING(creator.last_name, 1, 1)), 'NN')
        ) as created_by,
        -- Members
        COALESCE(pma.assignedTo, '[]'::jsonb),
        -- Placeholders for heavy arrays (handled by frontend detail fetching if needed)
        CASE WHEN p.active_task_count > 0 THEN '[{"completed": false}]'::jsonb ELSE '[]'::jsonb END as tasks,
        '[]'::jsonb as comments,
        '[]'::jsonb as services,
        '[]'::jsonb as "briefFiles",
        '[]'::jsonb as activities,
        -- Tags
        COALESCE(ptags.tags, '[]'::jsonb),
        -- Client Info
        COALESCE(pci.client_name, direct_company.name) as client_name,
        pci.client_avatar_url,
        COALESCE(pci.client_company_logo_url, direct_company.logo_url) as client_company_logo_url,
        COALESCE(pci.client_company_name, direct_company.name) as client_company_name,
        COALESCE(pci.client_company_custom_properties, direct_company.custom_properties) as client_company_custom_properties,
        -- More placeholders
        '[]'::jsonb as reactions,
        '[]'::jsonb as invoice_attachments
    FROM filtered_projects fp
    JOIN public.projects p ON fp.id = p.id
    LEFT JOIN public.profiles creator ON p.created_by = creator.id
    LEFT JOIN project_members_agg pma ON p.id = pma.project_id
    LEFT JOIN project_tags_agg ptags ON p.id = ptags.project_id
    LEFT JOIN project_client_info pci ON p.id = pci.project_id
    LEFT JOIN public.companies direct_company ON p.client_company_id = direct_company.id
    ORDER BY
        CASE WHEN p_sort_key = 'start_date' AND p_sort_direction = 'asc' THEN p.start_date END ASC NULLS LAST,
        CASE WHEN p_sort_key = 'start_date' AND p_sort_direction = 'desc' THEN p.start_date END DESC NULLS LAST,
        CASE WHEN p_sort_key = 'name' AND p_sort_direction = 'asc' THEN p.name END ASC,
        CASE WHEN p_sort_key = 'name' AND p_sort_direction = 'desc' THEN p.name END DESC,
        CASE WHEN p_sort_key = 'updated_at' AND p_sort_direction = 'asc' THEN p.updated_at END ASC,
        CASE WHEN p_sort_key = 'updated_at' AND p_sort_direction = 'desc' THEN p.updated_at END DESC,
        p.created_at DESC;
END;
$function$;