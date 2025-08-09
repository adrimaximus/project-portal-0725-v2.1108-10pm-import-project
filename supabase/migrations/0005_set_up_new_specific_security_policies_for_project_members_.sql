-- New SELECT policy: Allows members of a project to see other members of the same project.
CREATE POLICY "Allow members to see other project members" ON public.project_members
FOR SELECT
USING ( is_member_of_project(project_id) );

-- New INSERT policy: Allows project creators to add new members.
CREATE POLICY "Allow project owners to insert members" ON public.project_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id AND projects.created_by = auth.uid()
  )
);

-- New UPDATE policy: Allows project creators to update member roles.
CREATE POLICY "Allow project owners to update members" ON public.project_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id AND projects.created_by = auth.uid()
  )
);

-- New DELETE policy: Allows project creators to remove members.
CREATE POLICY "Allow project owners to delete members" ON public.project_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_members.project_id AND projects.created_by = auth.uid()
  )
);