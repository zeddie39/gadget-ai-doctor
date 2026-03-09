-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnosis_id TEXT NOT NULL,
  feature_used TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  helpful BOOLEAN NOT NULL DEFAULT false,
  user_comments TEXT,
  ai_response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Allow all operations (anonymous feedback allowed)
CREATE POLICY "Allow all operations on ai_feedback"
  ON public.ai_feedback
  FOR ALL
  USING (true);

-- Index for faster lookups by diagnosis
CREATE INDEX idx_ai_feedback_diagnosis_id ON public.ai_feedback(diagnosis_id);
CREATE INDEX idx_ai_feedback_feature_used ON public.ai_feedback(feature_used);
CREATE INDEX idx_ai_feedback_created_at ON public.ai_feedback(created_at DESC);
