-- Create AI request logs table for analytics and audit
CREATE TABLE public.ai_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_type text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  response_time_ms integer,
  tokens_used integer,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_ai_request_logs_user_id ON public.ai_request_logs(user_id);
CREATE INDEX idx_ai_request_logs_created_at ON public.ai_request_logs(created_at DESC);
CREATE INDEX idx_ai_request_logs_request_type ON public.ai_request_logs(request_type);

-- Enable RLS
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own logs
CREATE POLICY "Users can view own AI logs"
ON public.ai_request_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Only backend can insert logs (via service role)
CREATE POLICY "Service role can insert logs"
ON public.ai_request_logs
FOR INSERT
WITH CHECK (true);

-- Block direct user modifications
CREATE POLICY "Block user updates on ai_request_logs"
ON public.ai_request_logs
FOR UPDATE
USING (false);

CREATE POLICY "Block user deletes on ai_request_logs"
ON public.ai_request_logs
FOR DELETE
USING (false);