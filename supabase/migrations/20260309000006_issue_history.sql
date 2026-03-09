-- Create issue_history table
CREATE TABLE IF NOT EXISTS public.issue_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT,
  issue_type TEXT NOT NULL,
  issue_description TEXT,
  severity_level TEXT,
  diagnosis_result JSONB,
  actions_taken TEXT[],
  repair_status TEXT,
  repair_cost NUMERIC,
  resolved BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.issue_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on issue_history"
  ON public.issue_history
  FOR ALL
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_issue_history_updated_at
  BEFORE UPDATE ON public.issue_history
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_issue_history_device_id ON public.issue_history(device_id);
CREATE INDEX idx_issue_history_issue_type ON public.issue_history(issue_type);
CREATE INDEX idx_issue_history_resolved ON public.issue_history(resolved);
CREATE INDEX idx_issue_history_created_at ON public.issue_history(created_at DESC);
