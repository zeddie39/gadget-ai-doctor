-- Create storage_analysis table
CREATE TABLE IF NOT EXISTS public.storage_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_info JSONB,
  total_storage_used NUMERIC,
  total_storage_available NUMERIC,
  potential_cleanup_size NUMERIC,
  unused_apps JSONB,
  duplicate_photos JSONB,
  cache_files JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storage_analysis ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on storage_analysis"
  ON public.storage_analysis
  FOR ALL
  USING (true);

-- Index
CREATE INDEX idx_storage_analysis_created_at ON public.storage_analysis(created_at DESC);
