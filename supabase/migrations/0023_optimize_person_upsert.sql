CREATE OR REPLACE FUNCTION public.upsert_person_with_details(p_id uuid, p_full_name text, p_contact jsonb, p_company_id uuid, p_job_title text, p_department text, p_social_media jsonb, p_birthday date, p_notes text, p_project_ids uuid[], p_existing_tag_ids uuid[], p_custom_tags jsonb, p_avatar_url text, p_address jsonb, p_custom_properties jsonb)
 RETURNS people
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_person_id uuid;
    v_person people;
    v_final_tag_ids UUID[];
    v_tag_object JSONB;
    v_tag_name TEXT;
    v_tag_color TEXT;
    v_tag_id UUID;
    v_user_id UUID;
    v_company_name TEXT;
BEGIN
    v_user_id := auth.uid();

    -- Get company name if ID is provided
    IF p_company_id IS NOT NULL THEN
        SELECT name INTO v_company_name FROM public.companies WHERE id = p_company_id;
    ELSE
        v_company_name := NULL;
    END IF;

    -- Upsert Person
    IF p_id IS NOT NULL THEN
        UPDATE people SET 
            full_name = p_full_name, 
            contact = p_contact, 
            email = (p_contact -> 'emails' ->> 0),
            phone = (p_contact -> 'phones' ->> 0),
            company = v_company_name, 
            company_id = p_company_id,
            job_title = p_job_title, 
            department = p_department, 
            social_media = p_social_media, 
            birthday = p_birthday, 
            notes = p_notes, 
            avatar_url = p_avatar_url, 
            address = p_address, 
            custom_properties = p_custom_properties,
            updated_at = now() 
        WHERE id = p_id RETURNING * INTO v_person;
        v_person_id := p_id;
    ELSE
        INSERT INTO people (full_name, contact, email, phone, company, company_id, job_title, department, social_media, birthday, notes, avatar_url, address, custom_properties)
        VALUES (p_full_name, p_contact, (p_contact -> 'emails' ->> 0), (p_contact -> 'phones' ->> 0), v_company_name, p_company_id, p_job_title, p_department, p_social_media, p_birthday, p_notes, p_avatar_url, p_address, p_custom_properties)
        RETURNING * INTO v_person;
        v_person_id := v_person.id;
    END IF;

    -- Smart Diff for Projects
    IF p_project_ids IS NOT NULL THEN
        -- Delete only removed
        DELETE FROM people_projects 
        WHERE person_id = v_person_id 
        AND NOT (project_id = ANY(p_project_ids));
        
        -- Insert only new
        IF array_length(p_project_ids, 1) > 0 THEN
            INSERT INTO people_projects (person_id, project_id) 
            SELECT v_person_id, unnest(p_project_ids)
            ON CONFLICT (person_id, project_id) DO NOTHING;
        END IF;
    END IF;

    -- Handle Tags (same logic as before for custom tags creation)
    v_final_tag_ids := COALESCE(p_existing_tag_ids, '{}');

    IF p_custom_tags IS NOT NULL AND jsonb_array_length(p_custom_tags) > 0 THEN
        FOR v_tag_object IN SELECT * FROM jsonb_array_elements(p_custom_tags) LOOP
            v_tag_name := v_tag_object->>'name';
            v_tag_color := v_tag_object->>'color';
            IF v_tag_name IS NOT NULL AND v_tag_color IS NOT NULL THEN
                SELECT t.id INTO v_tag_id FROM public.tags t WHERE t.user_id = v_user_id AND t.name = v_tag_name LIMIT 1;
                IF v_tag_id IS NULL THEN
                    INSERT INTO public.tags (user_id, name, color) VALUES (v_user_id, v_tag_name, v_tag_color) RETURNING tags.id INTO v_tag_id;
                END IF;
                v_final_tag_ids := array_append(v_final_tag_ids, v_tag_id);
            END IF;
        END LOOP;
    END IF;

    -- Smart Diff for Tags
    IF v_final_tag_ids IS NOT NULL THEN
        DELETE FROM public.people_tags 
        WHERE person_id = v_person_id 
        AND NOT (tag_id = ANY(v_final_tag_ids));
        
        IF array_length(v_final_tag_ids, 1) > 0 THEN
            INSERT INTO public.people_tags (person_id, tag_id) 
            SELECT v_person_id, unnest(v_final_tag_ids) 
            ON CONFLICT (person_id, tag_id) DO NOTHING;
        END IF;
    END IF;

    RETURN v_person;
END;
$function$;