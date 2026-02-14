
-- Create a helper function to check if two users share a company
CREATE OR REPLACE FUNCTION public.shares_company_with(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members a
    JOIN public.company_members b ON a.company_id = b.company_id
    WHERE a.user_id = _viewer_id
      AND b.user_id = _profile_user_id
  )
$$;

-- Drop the old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a new SELECT policy that allows viewing own profile OR profiles of company members
CREATE POLICY "Users can view own or company member profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR shares_company_with(auth.uid(), user_id)
);
