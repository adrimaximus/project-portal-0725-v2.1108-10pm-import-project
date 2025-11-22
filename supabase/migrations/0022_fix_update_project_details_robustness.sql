CREATE OR REPLACE FUNCTION public.update_project_details(p_project_id uuid, p_name text, p_description text, p_category text, p_status text, p_budget numeric, p_start_date timestamp with time zone, p_due_date timestamp with time zone, p_payment_status text, p_payment_due_date timestamp with time zone, p_venue text, p_members jsonb, p_service_titles text[], p_existing_tags uuid[], p_custom_tags jsonb, p_invoice_number text, p_po_number text, p_paid_date timestamp with time zone, p_email_sending_date timestamp with time zone, p_hardcopy_sending_date timestamp with time zone, p_channel text, p_client_company_id uuid DEFAULT NULL::uuid, p_public boolean DEFAULT NULL::boolean)
 RETURNS projects
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_current_user_id uuid := auth.uid();
    updated_project projects;
    v_tag_id UUID;
    v_tag_object JSONB;
    v_tag_name TEXT;
    v_tag_color TEXT;
    v_final_tag_ids UUID[];
    v_member_data jsonb;
    v_member_ids uuid[];
    v_project_owner_id uuid;
BEGIN
    -- 1. Verify permissions
    -- Allow if admin, permission holder, CREATOR, or privileged member
    IF NOT (
        is_admin() OR 
        has_permission('projects:edit_all'::text) OR
        (SELECT created_by FROM public.projects WHERE id = p_project_id) = v_current_user_id OR
        EXISTS (
            SELECT 1
            FROM public.project_members pm
            WHERE pm.project_id = p_project_id
              AND pm.user_id = v_current_user_id
              AND lower(pm.role) IN ('owner', 'admin', 'editor')
        )
    ) THEN
        RAISE EXCEPTION 'User does not have permission to update this project';
    END IF;

    SELECT created_by INTO v_project_owner_id FROM projects WHERE id = p_project_id;

    -- 2. Update the main project table
    UPDATE projects
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        category = COALESCE(p_category, category),
        status = COALESCE(p_status, status),
        budget = COALESCE(p_budget, budget),
        start_date = COALESCE(p_start_date, start_date),
        due_date = COALESCE(p_due_date, due_date),
        payment_status = COALESCE(p_payment_status, payment_status),
        payment_due_date = COALESCE(p_payment_due_date, payment_due_date),
        venue = COALESCE(p_venue, venue),
        invoice_number = COALESCE(p_invoice_number, invoice_number),
        po_number = COALESCE(p_po_number, po_number),
        paid_date = COALESCE(p_paid_date, paid_date),
        email_sending_date = COALESCE(p_email_sending_date, email_sending_date),
        hardcopy_sending_date = COALESCE(p_hardcopy_sending_date, hardcopy_sending_date),
        channel = COALESCE(p_channel, channel),
        client_company_id = p_client_company_id,
        public = COALESCE(p_public, public),
        updated_at = now()
    WHERE id = p_project_id
    RETURNING * INTO updated_project;

    -- 3. Manage project members
    IF p_members IS NOT NULL THEN
        SELECT array_agg((COALESCE(m->>'user_id', m->>'id'))::uuid) INTO v_member_ids FROM jsonb_array_elements(p_members) m;
        
        DELETE FROM project_members pm
        WHERE pm.project_id = p_project_id
          AND pm.user_id <> v_project_owner_id
          AND NOT (pm.user_id = ANY(COALESCE(v_member_ids, '{}')));
          
        FOR v_member_data IN SELECT * FROM jsonb_array_elements(p_members)
        LOOP
            INSERT INTO project_members (project_id, user_id, role)
            VALUES (
                p_project_id, 
                (COALESCE(v_member_data->>'user_id', v_member_data->>'id'))::uuid, 
                COALESCE(v_member_data->>'role', 'member')::text
            )
            ON CONFLICT (project_id, user_id) DO UPDATE
            SET role = EXCLUDED.role
            WHERE project_members.user_id <> v_project_owner_id;
        END LOOP;
    END IF;

    -- 4. Manage project services
    IF p_service_titles IS NOT NULL THEN
        DELETE FROM project_services ps
        WHERE ps.project_id = p_project_id
          AND NOT (ps.service_title = ANY(p_service_titles));
        INSERT INTO project_services (project_id, service_title)
        SELECT p_project_id, service_title
        FROM unnest(p_service_titles) as service_title
        ON CONFLICT (project_id, service_title) DO NOTHING;
    END IF;

    -- 5. Manage project tags
    IF p_existing_tags IS NOT NULL OR p_custom_tags IS NOT NULL THEN
        v_final_tag_ids := COALESCE(p_existing_tags, '{}');
        IF p_custom_tags IS NOT NULL AND jsonb_array_length(p_custom_tags) > 0 THEN
            FOR v_tag_object IN SELECT * FROM jsonb_array_elements(p_custom_tags)
            LOOP
                v_tag_name := v_tag_object->>'name';
                v_tag_color := v_tag_object->>'color';
                IF v_tag_name IS NOT NULL AND v_tag_color IS NOT NULL THEN
                    SELECT t.id INTO v_tag_id FROM public.tags t
                    WHERE t.user_id = v_current_user_id AND t.name = v_tag_name
                    LIMIT 1;
                    IF v_tag_id IS NULL THEN
                        INSERT INTO public.tags (user_id, name, color)
                        VALUES (v_current_user_id, v_tag_name, v_tag_color)
                        RETURNING tags.id INTO v_tag_id;
                    END IF;
                    v_final_tag_ids := array_append(v_final_tag_ids, v_tag_id);
                END IF;
            END LOOP;
        END IF;
        DELETE FROM public.project_tags pt
        WHERE pt.project_id = p_project_id 
        AND NOT (pt.tag_id = ANY(v_final_tag_ids));
        IF array_length(v_final_tag_ids, 1) > 0 THEN
            INSERT INTO public.project_tags (project_id, tag_id)
            SELECT p_project_id, unnest(v_final_tag_ids)
            ON CONFLICT (project_id, tag_id) DO NOTHING;
        END IF;
    END IF;

    -- 6. Return the updated project
    RETURN updated_project;
END;
$function$;