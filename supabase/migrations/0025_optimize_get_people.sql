CREATE OR REPLACE FUNCTION public.get_people_with_details(
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0,
    p_search_term text DEFAULT NULL::text,
    p_tag_ids uuid[] DEFAULT NULL::uuid[],
    p_company_ids uuid[] DEFAULT NULL::uuid[]
)
RETURNS TABLE(
    id uuid, full_name text, email text, phone text, company text, job_title text, department text,
    social_media jsonb, birthday date, notes text, created_at timestamp with time zone,
    updated_at timestamp with time zone, projects jsonb, tags jsonb, avatar_url text, user_id uuid,
    contact jsonb, company_id uuid, slug text, kanban_order integer, address jsonb,
    custom_properties jsonb, company_logo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH people_filtered AS (
        SELECT p.id, p.kanban_order, p.updated_at
        FROM public.people p
        WHERE
            (p_search_term IS NULL OR p_search_term = '' OR
                p.full_name ILIKE ('%' || p_search_term || '%') OR
                COALESCE(p.company, '') ILIKE ('%' || p_search_term || '%') OR
                COALESCE(p.job_title, '') ILIKE ('%' || p_search_term || '%') OR
                COALESCE(p.email, '') ILIKE ('%' || p_search_term || '%') OR
                (p.contact -> 'emails' ->> 0) ILIKE ('%' || p_search_term || '%')
            )
            AND (p_tag_ids IS NULL OR EXISTS (
                SELECT 1 FROM public.people_tags pt WHERE pt.person_id = p.id AND pt.tag_id = ANY(p_tag_ids)
            ))
            AND (p_company_ids IS NULL OR p.company_id = ANY(p_company_ids))
        ORDER BY p.kanban_order ASC NULLS LAST, p.updated_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ),
    person_projects_agg AS (
        SELECT
            pp.person_id,
            jsonb_agg(jsonb_build_object('id', pr.id, 'name', pr.name, 'slug', pr.slug)) as projects
        FROM public.people_projects pp
        JOIN public.projects pr ON pp.project_id = pr.id
        WHERE pp.person_id IN (SELECT pf.id FROM people_filtered pf)
        GROUP BY pp.person_id
    ),
    person_tags_agg AS (
        SELECT
            pt.person_id,
            jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color, 'type', t.type)) as tags
        FROM public.people_tags pt
        JOIN public.tags t ON pt.tag_id = t.id
        WHERE pt.person_id IN (SELECT pf.id FROM people_filtered pf)
        GROUP BY pt.person_id
    )
    SELECT
        p.id,
        COALESCE(
            NULLIF(TRIM(p.full_name), ''),
            split_part(p.email, '@', 1),
            split_part(p.contact -> 'emails' ->> 0, '@', 1),
            'Unnamed Contact'
        ) as full_name,
        p.email, p.phone, p.company, p.job_title, p.department, p.social_media, p.birthday, p.notes, p.created_at, p.updated_at,
        COALESCE(ppa.projects, '[]'::jsonb) AS projects,
        COALESCE(pta.tags, '[]'::jsonb) AS tags,
        p.avatar_url, p.user_id, p.contact, p.company_id, p.slug, p.kanban_order, p.address, p.custom_properties,
        c.logo_url as company_logo_url
    FROM people_filtered pf
    JOIN public.people p ON pf.id = p.id
    LEFT JOIN person_projects_agg ppa ON p.id = ppa.person_id
    LEFT JOIN person_tags_agg pta ON p.id = pta.person_id
    LEFT JOIN public.companies c ON p.company_id = c.id
    ORDER BY pf.kanban_order ASC NULLS LAST, pf.updated_at DESC;
END;
$function$;