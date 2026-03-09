-- Create image_diagnostics table
CREATE TABLE IF NOT EXISTS public.image_diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  diagnosis_result JSONB,
  severity_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_diagnostics ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on image_diagnostics"
  ON public.image_diagnostics
  FOR ALL
  USING (true);

-- Indexes
CREATE INDEX idx_image_diagnostics_severity_level ON public.image_diagnostics(severity_level);
CREATE INDEX idx_image_diagnostics_created_at ON public.image_diagnostics(created_at DESC);
