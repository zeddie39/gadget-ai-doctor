-- Create troubleshooting_sessions table
CREATE TABLE IF NOT EXISTS public.troubleshooting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type TEXT NOT NULL,
  issue_category TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  session_data JSONB,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.troubleshooting_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on troubleshooting_sessions"
  ON public.troubleshooting_sessions
  FOR ALL
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_troubleshooting_sessions_updated_at
  BEFORE UPDATE ON public.troubleshooting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_troubleshooting_sessions_device_type ON public.troubleshooting_sessions(device_type);
CREATE INDEX idx_troubleshooting_sessions_issue_category ON public.troubleshooting_sessions(issue_category);
CREATE INDEX idx_troubleshooting_sessions_completed ON public.troubleshooting_sessions(completed);
CREATE INDEX idx_troubleshooting_sessions_created_at ON public.troubleshooting_sessions(created_at DESC);
