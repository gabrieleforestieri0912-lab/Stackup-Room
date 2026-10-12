-- Stackup Room M2: portfolio startup + planner privato + streak shipping
CREATE TABLE IF NOT EXISTS startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  url TEXT,
  tagline TEXT,
  logo_url TEXT,
  stage TEXT NOT NULL DEFAULT 'idea',
  revenue_self_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'EUR',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT startups_stage_chk CHECK (stage IN ('idea','building','launched','scaling','exit'))
);
CREATE INDEX IF NOT EXISTS idx_startups_user ON startups(user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'med',
  status TEXT NOT NULL DEFAULT 'todo',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tasks_priority_chk CHECK (priority IN ('low','med','high')),
  CONSTRAINT tasks_status_chk CHECK (status IN ('todo','doing','done'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_startup ON tasks(user_id, startup_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(startup_id, status);

CREATE TABLE IF NOT EXISTS standups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  done TEXT NOT NULL DEFAULT '',
  todo TEXT NOT NULL DEFAULT '',
  blockers TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT standups_unique UNIQUE (user_id, startup_id, day)
);
CREATE INDEX IF NOT EXISTS idx_standups_user_day ON standups(user_id, day);

CREATE TABLE IF NOT EXISTS time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  startup_id UUID REFERENCES startups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT blocks_range_chk CHECK (start_time < end_time)
);
CREATE INDEX IF NOT EXISTS idx_blocks_user_day ON time_blocks(user_id, day);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  proof_url TEXT,
  proof_note TEXT,
  screenshot_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT goals_status_chk CHECK (status IN ('open','done'))
);
CREATE INDEX IF NOT EXISTS idx_goals_user_startup ON goals(user_id, startup_id);

-- Un giorno shippato per utente (idempotente): alimenta streak + heatmap. MAI visibile ad altri.
CREATE TABLE IF NOT EXISTS ship_days (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  startup_id UUID REFERENCES startups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, day)
);

ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS startups_owner ON startups;
CREATE POLICY startups_owner ON startups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS tasks_owner ON tasks;
CREATE POLICY tasks_owner ON tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS standups_owner ON standups;
CREATE POLICY standups_owner ON standups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS blocks_owner ON time_blocks;
CREATE POLICY blocks_owner ON time_blocks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS goals_owner ON goals;
CREATE POLICY goals_owner ON goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS ship_owner ON ship_days;
CREATE POLICY ship_owner ON ship_days FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
