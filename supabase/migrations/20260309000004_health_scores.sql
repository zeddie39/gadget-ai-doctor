-- Create health_scores table
CREATE TABLE IF NOT EXISTS public.health_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT,
  device_info JSONB,
  overall_score NUMERIC,
  battery_score NUMERIC,
  storage_score NUMERIC,
  temperature_score NUMERIC,
  usage_score NUMERIC,
  potential_improvement NUMERIC,
  recommendations JSONB,
  improvement_tips JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on health_scores"
  ON public.health_scores
  FOR ALL
  USING (true);

-- Indexes
CREATE INDEX idx_health_scores_device_id ON public.health_scores(device_id);
CREATE INDEX idx_health_scores_created_at ON public.health_scores(created_at DESC);
