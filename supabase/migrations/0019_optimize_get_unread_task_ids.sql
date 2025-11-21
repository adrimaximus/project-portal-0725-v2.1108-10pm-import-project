CREATE OR REPLACE FUNCTION public.get_unread_task_ids()
 RETURNS TABLE(task_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  WITH accessible_projects AS (
    -- 1. Get all projects user has access to (Owner or Member)
    SELECT p.id 
    FROM public.projects p 
    WHERE p.created_by = v_user_id
    UNION
    SELECT pm.project_id AS id 
    FROM public.project_members pm 
    WHERE pm.user_id = v_user_id
  ),
  visible_tasks AS (
    -- 2. Get all tasks from those projects OR tasks explicitly assigned to user
    SELECT t.id, t.updated_at, t.created_by
    FROM public.tasks t
    WHERE 
      t.project_id IN (SELECT id FROM accessible_projects)
      OR 
      EXISTS (
        SELECT 1 FROM public.task_assignees ta 
        WHERE ta.task_id = t.id AND ta.user_id = v_user_id
      )
  ),
  last_views AS (
    -- 3. Get user's view history
    SELECT tv.task_id, tv.last_viewed_at
    FROM public.task_views tv
    WHERE tv.user_id = v_user_id
  ),
  relevant_comments AS (
    -- 4. Get latest comments on visible tasks not by the user
    SELECT c.task_id, MAX(c.created_at) as latest_comment_at
    FROM public.comments c
    WHERE c.task_id IS NOT NULL 
      AND c.author_id <> v_user_id
      AND c.task_id IN (SELECT id FROM visible_tasks) -- Filter early
    GROUP BY c.task_id
  )
  -- 5. Combine to find unread
  SELECT vt.id
  FROM visible_tasks vt
  LEFT JOIN last_views lv ON vt.id = lv.task_id
  LEFT JOIN relevant_comments rc ON vt.id = rc.task_id
  WHERE
    -- Condition A: New task (never viewed) AND not created by current user
    (lv.last_viewed_at IS NULL AND vt.created_by <> v_user_id)
    OR
    -- Condition B: Task updated since last view AND not created by current user
    (lv.last_viewed_at IS NOT NULL AND vt.updated_at > lv.last_viewed_at AND vt.created_by <> v_user_id)
    OR
    -- Condition C: New comment since last view
    (rc.latest_comment_at IS NOT NULL AND (lv.last_viewed_at IS NULL OR rc.latest_comment_at > lv.last_viewed_at));
END;
$function$;