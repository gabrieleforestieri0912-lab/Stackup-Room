-- Stackup Room: collegamento Stripe via chiave ristretta read-only (alternativa a Connect).
-- Il segreto è leggibile solo dal service role (nessuna policy client) e mai restituito alle API di lettura.
CREATE TABLE IF NOT EXISTS stripe_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  key_last4 TEXT NOT NULL DEFAULT '',
  livemode BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT stripe_keys_unique UNIQUE (startup_id)
);
CREATE INDEX IF NOT EXISTS idx_stripe_keys_user ON stripe_keys(user_id);

ALTER TABLE stripe_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS stripekeys_none ON stripe_keys;
CREATE POLICY stripekeys_none ON stripe_keys FOR ALL USING (FALSE);
