-- Create table for damage detection history
CREATE TABLE IF NOT EXISTS public.damage_detection_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  device_type TEXT,
  scan_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  damaged_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_damage_count INTEGER NOT NULL DEFAULT 0,
  severity_summary JSONB DEFAULT '{"critical": 0, "high": 0, "medium": 0, "low": 0}'::jsonb,
  image_data_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.damage_detection_history ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations (matching existing pattern)
CREATE POLICY "Allow all operations on damage_detection_history" 
ON public.damage_detection_history 
FOR ALL 
USING (true);

-- Create index for faster queries by device_id
CREATE INDEX idx_damage_detection_history_device_id ON public.damage_detection_history(device_id);
CREATE INDEX idx_damage_detection_history_timestamp ON public.damage_detection_history(scan_timestamp DESC);

-- Add trigger for updated_at (using correct function name)
CREATE TRIGGER update_damage_detection_history_updated_at
BEFORE UPDATE ON public.damage_detection_history
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();