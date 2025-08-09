CREATE OR REPLACE FUNCTION is_member_of_project(project_id_to_check uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
-- SET search_path = '' is a security best practice for SECURITY DEFINER functions
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = project_id_to_check AND user_id = auth.uid()
  );
$$;