-- Stackup Room: tracker personalizzati (metriche giornaliere per startup).
CREATE TABLE IF NOT EXISTS custom_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'number',
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tracker_kind_chk CHECK (kind IN ('boolean','number'))
);
CREATE INDEX IF NOT EXISTS idx_trackers_user_startup ON custom_trackers(user_id, startup_id);

CREATE TABLE IF NOT EXISTS tracker_entries (
  tracker_id UUID NOT NULL REFERENCES custom_trackers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  value_num NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tracker_id, day)
);
CREATE INDEX IF NOT EXISTS idx_entries_day ON tracker_entries(tracker_id, day DESC);

ALTER TABLE custom_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trackers_owner ON custom_trackers;
CREATE POLICY trackers_owner ON custom_trackers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS entries_owner ON tracker_entries;
CREATE POLICY entries_owner ON tracker_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
