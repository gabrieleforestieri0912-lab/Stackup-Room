-- Stackup Room M3: verifica Stripe read-only + cache GitHub + audit leaderboard
CREATE TABLE IF NOT EXISTS stripe_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  livemode BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT stripe_unique UNIQUE (startup_id, stripe_account_id)
);
CREATE INDEX IF NOT EXISTS idx_stripe_user ON stripe_links(user_id);

-- Snapshot metriche riassuntive verificate (solo MRR/currency: MAI dati di carta).
CREATE TABLE IF NOT EXISTS revenue_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'stripe',
  mrr_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  period TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT revenue_source_chk CHECK (source IN ('self','stripe'))
);
CREATE INDEX IF NOT EXISTS idx_revenue_startup ON revenue_snapshots(startup_id, created_at DESC);

-- Solo conteggi giornalieri pubblici GitHub (mai accesso al codice).
CREATE TABLE IF NOT EXISTS github_cache (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS leaderboard_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}',
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_action ON leaderboard_audit(action, created_at DESC);

ALTER TABLE stripe_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stripe_owner ON stripe_links;
CREATE POLICY stripe_owner ON stripe_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS revenue_owner ON revenue_snapshots;
CREATE POLICY revenue_owner ON revenue_snapshots FOR ALL USING (auth.uid() = (SELECT user_id FROM startups WHERE id = startup_id)) WITH CHECK (auth.uid() = (SELECT user_id FROM startups WHERE id = startup_id));
DROP POLICY IF EXISTS gh_owner ON github_cache;
CREATE POLICY gh_owner ON github_cache FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS audit_none ON leaderboard_audit;
CREATE POLICY audit_none ON leaderboard_audit FOR ALL USING (FALSE);
