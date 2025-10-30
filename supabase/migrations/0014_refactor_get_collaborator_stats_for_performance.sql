CREATE OR REPLACE FUNCTION public.get_collaborator_stats()
 RETURNS TABLE(id uuid, name text, initials text, avatar_url text, role text, project_count bigint, upcoming_project_count bigint, ongoing_project_count bigint, active_task_count bigint, active_ticket_count bigint, overdue_bill_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_current_user_id uuid := auth.uid();
    v_has_view_all_permission boolean;
BEGIN
    SELECT public.has_permission('projects:view_all') INTO v_has_view_all_permission;

    RETURN QUERY
    WITH accessible_projects AS (
        SELECT p.id, p.start_date, p.status, p.payment_due_date, p.payment_status, p.created_by
        FROM public.projects p
        WHERE v_has_view_all_permission
           OR p.public = true
           OR p.created_by = v_current_user_id
           OR public.is_project_member_internal(p.id, v_current_user_id)
    ),
    project_involvement AS (
        SELECT ap.id AS project_id, ap.created_by AS user_id FROM accessible_projects ap
        UNION -- UNION is correct here to remove duplicate user-project pairs (owner is also a member)
        SELECT pm.project_id, pm.user_id FROM public.project_members pm JOIN accessible_projects ap ON pm.project_id = ap.id
    ),
    project_stats AS (
        SELECT
            pi.user_id,
            COUNT(DISTINCT pi.project_id) AS project_count,
            COUNT(DISTINCT pi.project_id) FILTER (WHERE ap.start_date > now()) AS upcoming_project_count,
            COUNT(DISTINCT pi.project_id) FILTER (WHERE ap.status NOT IN ('Completed', 'Cancelled')) AS ongoing_project_count,
            COUNT(DISTINCT pi.project_id) FILTER (WHERE ap.payment_due_date < now() AND ap.payment_status <> 'Paid') AS overdue_bill_count
        FROM project_involvement pi
        JOIN accessible_projects ap ON pi.project_id = ap.id
        GROUP BY pi.user_id
    ),
    task_stats AS (
        SELECT
            ta.user_id,
            COUNT(t.id) AS active_task_count,
            COUNT(t.id) FILTER (WHERE t.origin_ticket_id IS NOT NULL) AS active_ticket_count
        FROM public.task_assignees ta
        JOIN public.tasks t ON ta.task_id = t.id
        JOIN accessible_projects ap ON t.project_id = ap.id -- Replaced IN with JOIN
        WHERE t.completed = FALSE
        GROUP BY ta.user_id
    )
    SELECT
        p.id,
        COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), p.email, 'Deleted User') AS name,
        COALESCE(
            CASE
                WHEN p.first_name IS NOT NULL AND p.last_name IS NOT NULL AND p.first_name <> '' AND p.last_name <> '' THEN
                    UPPER(SUBSTRING(p.first_name, 1, 1) || SUBSTRING(p.last_name, 1, 1))
                WHEN p.first_name IS NOT NULL AND p.first_name <> '' THEN
                    UPPER(SUBSTRING(p.first_name, 1, 1))
                WHEN p.email IS NOT NULL THEN
                    UPPER(SUBSTRING(p.email, 1, 2))
                ELSE 'NN'
            END, 'NN'
        ) AS initials,
        p.avatar_url,
        p.role,
        COALESCE(ps.project_count, 0),
        COALESCE(ps.upcoming_project_count, 0),
        COALESCE(ps.ongoing_project_count, 0),
        COALESCE(ts.active_task_count, 0),
        COALESCE(ts.active_ticket_count, 0),
        COALESCE(ps.overdue_bill_count, 0)
    FROM public.profiles p
    LEFT JOIN project_stats ps ON p.id = ps.user_id
    LEFT JOIN task_stats ts ON p.id = ts.user_id
    WHERE p.status = 'active';
END;
$function$;