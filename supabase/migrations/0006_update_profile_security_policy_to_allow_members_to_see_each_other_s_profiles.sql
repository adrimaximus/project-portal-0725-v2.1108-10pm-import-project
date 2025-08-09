-- First, remove the old, restrictive policy
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Then, create a new policy allowing any authenticated user to view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);