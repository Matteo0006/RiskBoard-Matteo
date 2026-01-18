-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert logs" ON public.ai_request_logs;

-- Create a restrictive INSERT policy for authenticated users only
CREATE POLICY "Authenticated users can insert own logs"
ON public.ai_request_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);