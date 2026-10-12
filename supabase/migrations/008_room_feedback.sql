-- Stackup Room M6: feedback + bucket privati (screenshot feedback, prove obiettivi).
-- Nota: nessun pannello admin e nessuna PWA (esclusi su richiesta): i feedback restano
-- visibili solo all'admin via RLS negata al client + notifica email a ADMIN_EMAILS.
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  body TEXT NOT NULL,
  screenshot_path TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feedback_kind_chk CHECK (kind IN ('bug','idea')),
  CONSTRAINT feedback_status_chk CHECK (status IN ('open','done'))
);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status, created_at);

INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-shots', 'feedback-shots', FALSE)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', FALSE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedback_none ON feedback;
CREATE POLICY feedback_none ON feedback FOR ALL USING (FALSE);
