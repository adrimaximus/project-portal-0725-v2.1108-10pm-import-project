-- Drop the existing read policy to replace it with one using the helper function.
DROP POLICY IF EXISTS "Allow read access to project members" ON public.projects;

-- Create a new, correct policy for viewing projects.
-- This ensures a user can only see projects they are a member of by using our helper function.
CREATE POLICY "Project members can view their projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  is_member_of_project(id)
);