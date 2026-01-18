-- Add explicit anonymous access denial policies for profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit anonymous access denial policies for companies table
CREATE POLICY "Deny anonymous access to companies"
ON public.companies
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit anonymous access denial policies for obligations table
CREATE POLICY "Deny anonymous access to obligations"
ON public.obligations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);