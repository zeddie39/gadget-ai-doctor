-- ============================================================
-- Migration: Add user_id columns and proper RLS policies
-- Replaces open USING(true) policies with user-scoped security
-- ============================================================

-- -------------------------------------------------------
-- 1. ai_feedback
-- -------------------------------------------------------
ALTER TABLE public.ai_feedback ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on ai_feedback" ON public.ai_feedback;

CREATE POLICY "Users can view own feedback"
  ON public.ai_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.ai_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON public.ai_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.ai_feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------
-- 2. battery_reports
-- -------------------------------------------------------
ALTER TABLE public.battery_reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on battery_reports" ON public.battery_reports;

CREATE POLICY "Users can view own battery reports"
  ON public.battery_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battery reports"
  ON public.battery_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all battery reports"
  ON public.battery_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------
-- 3. health_scores
-- -------------------------------------------------------
ALTER TABLE public.health_scores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on health_scores" ON public.health_scores;

CREATE POLICY "Users can view own health scores"
  ON public.health_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health scores"
  ON public.health_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all health scores"
  ON public.health_scores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------
-- 4. image_diagnostics
-- -------------------------------------------------------
ALTER TABLE public.image_diagnostics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on image_diagnostics" ON public.image_diagnostics;

CREATE POLICY "Users can view own image diagnostics"
  ON public.image_diagnostics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own image diagnostics"
  ON public.image_diagnostics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all image diagnostics"
  ON public.image_diagnostics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------
-- 5. issue_history
-- -------------------------------------------------------
ALTER TABLE public.issue_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on issue_history" ON public.issue_history;

CREATE POLICY "Users can view own issue history"
  ON public.issue_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own issue history"
  ON public.issue_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own issue history"
  ON public.issue_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all issue history"
  ON public.issue_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------
-- 6. storage_analysis
-- -------------------------------------------------------
ALTER TABLE public.storage_analysis ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on storage_analysis" ON public.storage_analysis;

CREATE POLICY "Users can view own storage analysis"
  ON public.storage_analysis FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own storage analysis"
  ON public.storage_analysis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all storage analysis"
  ON public.storage_analysis FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------
-- 7. chat_sessions — add user_id for ownership
-- -------------------------------------------------------
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on chat_sessions" ON public.chat_sessions;

CREATE POLICY "Users can view own chat sessions"
  ON public.chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON public.chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON public.chat_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- 8. chat_messages — scoped via session ownership
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow all operations on chat_messages" ON public.chat_messages;

CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = session_id
        AND cs.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- 9. troubleshooting_sessions
-- -------------------------------------------------------
ALTER TABLE public.troubleshooting_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on troubleshooting_sessions" ON public.troubleshooting_sessions;

CREATE POLICY "Users can view own troubleshooting sessions"
  ON public.troubleshooting_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own troubleshooting sessions"
  ON public.troubleshooting_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own troubleshooting sessions"
  ON public.troubleshooting_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all troubleshooting sessions"
  ON public.troubleshooting_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------
-- Indexes on new user_id columns
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_battery_reports_user_id ON public.battery_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_user_id ON public.health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_image_diagnostics_user_id ON public.image_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_history_user_id ON public.issue_history(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_analysis_user_id ON public.storage_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_troubleshooting_sessions_user_id ON public.troubleshooting_sessions(user_id);
