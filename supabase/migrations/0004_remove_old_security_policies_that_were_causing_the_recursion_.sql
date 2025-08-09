-- Drop the policy that applied to all actions (*) and caused the recursion
DROP POLICY IF EXISTS "Allow project owners to manage members" ON public.project_members;

-- Drop the old select policy which was too restrictive
DROP POLICY IF EXISTS "Allow read access to own membership" ON public.project_members;