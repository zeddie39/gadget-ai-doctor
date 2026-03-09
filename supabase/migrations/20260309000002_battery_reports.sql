-- Create battery_reports table
CREATE TABLE IF NOT EXISTS public.battery_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battery_level NUMERIC,
  battery_health JSONB,
  device_info JSONB,
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.battery_reports ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on battery_reports"
  ON public.battery_reports
  FOR ALL
  USING (true);

-- Index for faster queries
CREATE INDEX idx_battery_reports_created_at ON public.battery_reports(created_at DESC);
