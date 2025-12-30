-- Fix user_roles security: Prevent privilege escalation
-- Only admins can manage roles, users cannot self-assign

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix activity_logs: Prevent users from tampering audit trail
-- Users can only INSERT and SELECT, never UPDATE or DELETE

CREATE POLICY "Block user updates on activity_logs"
ON public.activity_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Block user deletes on activity_logs"
ON public.activity_logs
FOR DELETE
TO authenticated
USING (false);