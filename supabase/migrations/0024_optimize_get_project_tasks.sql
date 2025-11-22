CREATE OR REPLACE FUNCTION public.get_project_tasks(p_project_ids uuid[] DEFAULT NULL::uuid[], p_completed boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0, p_order_by text DEFAULT 'due_date'::text, p_order_direction text DEFAULT 'asc'::text, p_search_term text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, title text, description text, completed boolean, due_date timestamp with time zone, priority text, project_id uuid, project_name text, project_slug text, project_status text, "assignedTo" jsonb, created_by jsonb, created_at timestamp with time zone, updated_at timestamp with time zone, status text, tags jsonb, origin_ticket_id text, project_venue text, project_owner jsonb, project_client text, kanban_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_by TEXT;
  v_order_direction TEXT;
  v_current_user_id UUID := auth.uid();
  v_has_view_all BOOLEAN;
  v_accessible_project_ids UUID[];
BEGIN
  -- Validate sort order
  IF p_order_by IN ('due_date', 'title', 'priority', 'created_at', 'updated_at', 'status', 'kanban_order', 'project_name') THEN
    v_order_by := p_order_by;
  ELSE
    v_order_by := 'kanban_order';
  END IF;
  
  IF p_order_direction IN ('asc', 'desc') THEN
    v_order_direction := p_order_direction;
  ELSE
    v_order_direction := 'asc';
  END IF;

  -- Optimization: Check permission once
  v_has_view_all := public.has_permission('tasks:view_all');

  -- Optimization: Pre-fetch accessible projects into an array if not admin
  IF NOT v_has_view_all THEN
    SELECT ARRAY(
        SELECT p.id 
        FROM public.projects p 
        WHERE p.created_by = v_current_user_id
        UNION
        SELECT pm.project_id 
        FROM public.project_members pm 
        WHERE pm.user_id = v_current_user_id
    ) INTO v_accessible_project_ids;
  END IF;

  RETURN QUERY
  WITH task_ids_paginated AS (
    SELECT 
      t.id,
      t.kanban_order,
      t.due_date,
      t.title,
      t.priority,
      t.created_at,
      t.updated_at,
      t.status,
      pr.name as project_name_sort
    FROM tasks t
    JOIN projects pr ON t.project_id = pr.id
    WHERE
      (p_project_ids IS NULL OR t.project_id = ANY(p_project_ids))
      AND (p_completed IS NULL OR t.completed = p_completed)
      AND (p_search_term IS NULL OR p_search_term = '' OR t.title ILIKE ('%' || p_search_term || '%'))
      AND (
        v_has_view_all
        OR t.project_id = ANY(v_accessible_project_ids)
        OR EXISTS (SELECT 1 FROM task_assignees ta WHERE ta.task_id = t.id AND ta.user_id = v_current_user_id)
      )
    ORDER BY
      CASE WHEN v_order_by = 'kanban_order' AND v_order_direction = 'asc' THEN t.kanban_order END ASC,
      CASE WHEN v_order_by = 'kanban_order' AND v_order_direction = 'desc' THEN t.kanban_order END DESC,
      CASE WHEN v_order_by = 'due_date' AND v_order_direction = 'asc' THEN t.due_date END ASC NULLS LAST,
      CASE WHEN v_order_by = 'due_date' AND v_order_direction = 'desc' THEN t.due_date END DESC NULLS LAST,
      CASE WHEN v_order_by = 'title' AND v_order_direction = 'asc' THEN lower(t.title) END ASC,
      CASE WHEN v_order_by = 'title' AND v_order_direction = 'desc' THEN lower(t.title) END DESC,
      CASE WHEN v_order_by = 'project_name' AND v_order_direction = 'asc' THEN lower(pr.name) END ASC,
      CASE WHEN v_order_by = 'project_name' AND v_order_direction = 'desc' THEN lower(pr.name) END DESC,
      CASE WHEN v_order_by = 'priority' AND v_order_direction = 'asc' THEN
        CASE t.priority WHEN 'Low' THEN 1 WHEN 'Normal' THEN 2 WHEN 'High' THEN 3 WHEN 'Urgent' THEN 4 ELSE 0 END
      END ASC,
      CASE WHEN v_order_by = 'priority' AND v_order_direction = 'desc' THEN
        CASE t.priority WHEN 'Low' THEN 1 WHEN 'Normal' THEN 2 WHEN 'High' THEN 3 WHEN 'Urgent' THEN 4 ELSE 0 END
      END DESC,
      CASE WHEN v_order_by = 'created_at' AND v_order_direction = 'asc' THEN t.created_at END ASC,
      CASE WHEN v_order_by = 'created_at' AND v_order_direction = 'desc' THEN t.created_at END DESC,
      CASE WHEN v_order_by = 'updated_at' AND v_order_direction = 'asc' THEN t.updated_at END ASC,
      CASE WHEN v_order_by = 'updated_at' AND v_order_direction = 'desc' THEN t.updated_at END DESC,
      CASE WHEN v_order_by = 'status' AND v_order_direction = 'asc' THEN
        CASE t.status WHEN 'To do' THEN 1 WHEN 'In progress' THEN 2 WHEN 'In review' THEN 3 WHEN 'Done' THEN 4 ELSE 0 END
      END ASC,
      CASE WHEN v_order_by = 'status' AND v_order_direction = 'desc' THEN
        CASE t.status WHEN 'To do' THEN 1 WHEN 'In progress' THEN 2 WHEN 'In review' THEN 3 WHEN 'Done' THEN 4 ELSE 0 END
      END DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  assignee_data AS (
    SELECT
      ta.task_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ta.user_id,
          'name', COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), p.email, 'User Deleted'),
          'email', p.email,
          'avatar_url', p.avatar_url,
          'initials', COALESCE(
              CASE
                  WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL AND p.first_name <> '' AND p.last_name <> '' THEN
                      UPPER(SUBSTRING(p.first_name, 1, 1) || SUBSTRING(p.last_name, 1, 1))
                  WHEN p.first_name IS NOT NULL AND p.first_name <> '' THEN
                      UPPER(SUBSTRING(p.first_name, 1, 1))
                  WHEN p.email IS NOT NULL THEN
                      UPPER(SUBSTRING(p.email, 1, 2))
                  ELSE 'NN'
              END, 'NN'
          )
        )
      ) AS assignees
    FROM
      task_assignees ta
      LEFT JOIN profiles p ON ta.user_id = p.id
    WHERE ta.task_id IN (SELECT id FROM task_ids_paginated)
    GROUP BY ta.task_id
  ),
  tag_data AS (
    SELECT
      tt.task_id,
      jsonb_agg(jsonb_build_object('id', tg.id, 'name', tg.name, 'color', tg.color, 'user_id', tg.user_id)) AS tags
    FROM task_tags tt JOIN tags tg ON tt.tag_id = tg.id
    WHERE tt.task_id IN (SELECT id FROM task_ids_paginated)
    GROUP BY tt.task_id
  ),
  -- Optimize: Only calculate client info for projects present in the paginated tasks
  target_project_ids AS (
    SELECT DISTINCT t.project_id FROM tasks t WHERE t.id IN (SELECT id FROM task_ids_paginated)
  ),
  project_client_data AS (
    WITH ranked_clients AS (
      SELECT
        pp.project_id,
        cl.full_name,
        ROW_NUMBER() OVER(PARTITION BY pp.project_id ORDER BY cl.created_at ASC) as rn
      FROM people_projects pp
      JOIN people cl ON pp.person_id = cl.id
      WHERE pp.project_id IN (SELECT project_id FROM target_project_ids)
    )
    SELECT rc.project_id as pcd_project_id, rc.full_name
    FROM ranked_clients rc
    WHERE rc.rn = 1
  )
  SELECT
    t.id, t.title, t.description, t.completed, t.due_date, t.priority, t.project_id,
    pr.name as project_name,
    pr.slug as project_slug,
    pr.status as project_status,
    COALESCE(ad.assignees, '[]'::jsonb) AS "assignedTo",
    CASE
        WHEN creator.id IS NULL THEN jsonb_build_object('id', t.created_by, 'name', 'Deleted User')
        ELSE jsonb_build_object('id', creator.id, 'first_name', creator.first_name, 'last_name', creator.last_name, 'email', creator.email, 'avatar_url', creator.avatar_url)
    END as created_by,
    t.created_at, t.updated_at, t.status, COALESCE(td.tags, '[]'::jsonb) AS tags, t.origin_ticket_id,
    pr.venue as project_venue,
    CASE
        WHEN project_owner_profile.id IS NULL THEN jsonb_build_object('id', pr.created_by, 'name', 'Deleted User')
        ELSE jsonb_build_object(
            'id', project_owner_profile.id, 
            'name', COALESCE(NULLIF(TRIM(COALESCE(project_owner_profile.first_name, '') || ' ' || COALESCE(project_owner_profile.last_name, '')), ''), project_owner_profile.email, 'Deleted User'),
            'avatar_url', project_owner_profile.avatar_url,
            'first_name', project_owner_profile.first_name,
            'last_name', project_owner_profile.last_name,
            'email', project_owner_profile.email
        )
    END as project_owner,
    pcd.full_name as project_client,
    t.kanban_order
  FROM
    task_ids_paginated tip
    JOIN tasks t ON tip.id = t.id -- Join back to get full task columns
    JOIN projects pr ON t.project_id = pr.id
    LEFT JOIN assignee_data ad ON t.id = ad.task_id
    LEFT JOIN tag_data td ON t.id = td.task_id
    LEFT JOIN profiles creator ON t.created_by = creator.id
    LEFT JOIN profiles project_owner_profile ON pr.created_by = project_owner_profile.id
    LEFT JOIN project_client_data pcd ON t.project_id = pcd.pcd_project_id
  ORDER BY
      -- Re-apply sort order to the final result set to ensure correct order after joins
      CASE WHEN v_order_by = 'kanban_order' AND v_order_direction = 'asc' THEN t.kanban_order END ASC,
      CASE WHEN v_order_by = 'kanban_order' AND v_order_direction = 'desc' THEN t.kanban_order END DESC,
      CASE WHEN v_order_by = 'due_date' AND v_order_direction = 'asc' THEN t.due_date END ASC NULLS LAST,
      CASE WHEN v_order_by = 'due_date' AND v_order_direction = 'desc' THEN t.due_date END DESC NULLS LAST,
      CASE WHEN v_order_by = 'title' AND v_order_direction = 'asc' THEN lower(t.title) END ASC,
      CASE WHEN v_order_by = 'title' AND v_order_direction = 'desc' THEN lower(t.title) END DESC,
      CASE WHEN v_order_by = 'project_name' AND v_order_direction = 'asc' THEN lower(pr.name) END ASC,
      CASE WHEN v_order_by = 'project_name' AND v_order_direction = 'desc' THEN lower(pr.name) END DESC,
      CASE WHEN v_order_by = 'priority' AND v_order_direction = 'asc' THEN
        CASE t.priority WHEN 'Low' THEN 1 WHEN 'Normal' THEN 2 WHEN 'High' THEN 3 WHEN 'Urgent' THEN 4 ELSE 0 END
      END ASC,
      CASE WHEN v_order_by = 'priority' AND v_order_direction = 'desc' THEN
        CASE t.priority WHEN 'Low' THEN 1 WHEN 'Normal' THEN 2 WHEN 'High' THEN 3 WHEN 'Urgent' THEN 4 ELSE 0 END
      END DESC,
      CASE WHEN v_order_by = 'created_at' AND v_order_direction = 'asc' THEN t.created_at END ASC,
      CASE WHEN v_order_by = 'created_at' AND v_order_direction = 'desc' THEN t.created_at END DESC,
      CASE WHEN v_order_by = 'updated_at' AND v_order_direction = 'asc' THEN t.updated_at END ASC,
      CASE WHEN v_order_by = 'updated_at' AND v_order_direction = 'desc' THEN t.updated_at END DESC,
      CASE WHEN v_order_by = 'status' AND v_order_direction = 'asc' THEN
        CASE t.status WHEN 'To do' THEN 1 WHEN 'In progress' THEN 2 WHEN 'In review' THEN 3 WHEN 'Done' THEN 4 ELSE 0 END
      END ASC,
      CASE WHEN v_order_by = 'status' AND v_order_direction = 'desc' THEN
        CASE t.status WHEN 'To do' THEN 1 WHEN 'In progress' THEN 2 WHEN 'In review' THEN 3 WHEN 'Done' THEN 4 ELSE 0 END
      END DESC;
END;
$function$;