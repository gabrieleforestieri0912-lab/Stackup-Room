-- Stackup Room M4: community (chat 7gg, forum, network, eventi, report, blocchi, notifiche)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  gif_url TEXT,
  audio_path TEXT,
  audio_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chat_content_chk CHECK (body <> '' OR gif_url IS NOT NULL OR audio_path IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS chat_reactions (
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  tag TEXT NOT NULL DEFAULT 'discussione',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT forum_tag_chk CHECK (tag IN ('ask','show','discussione'))
);
CREATE INDEX IF NOT EXISTS idx_forum_created ON forum_topics(created_at DESC);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_topic ON forum_posts(topic_id, created_at);

CREATE TABLE IF NOT EXISTS forum_reactions (
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (target_type, target_id, user_id, emoji),
  CONSTRAINT forum_target_chk CHECK (target_type IN ('topic','post'))
);

CREATE TABLE IF NOT EXISTS network_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT network_kind_chk CHECK (kind IN ('offro','cerco'))
);
CREATE INDEX IF NOT EXISTS idx_network_created ON network_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_starts ON events(starts_at);

CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  snippet TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT report_target_chk CHECK (target_type IN ('chat','topic','post','network','event')),
  CONSTRAINT report_reason_chk CHECK (reason IN ('spam','odio','nsfw','altro')),
  CONSTRAINT report_status_chk CHECK (status IN ('open','resolved','dismissed'))
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT blocks_self_chk CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  ref_type TEXT,
  ref_id UUID,
  text TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read, created_at DESC);

INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', FALSE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_owner ON chat_messages;
CREATE POLICY chat_owner ON chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS chatreact_owner ON chat_reactions;
CREATE POLICY chatreact_owner ON chat_reactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS ftopic_owner ON forum_topics;
CREATE POLICY ftopic_owner ON forum_topics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS fpost_owner ON forum_posts;
CREATE POLICY fpost_owner ON forum_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS freact_owner ON forum_reactions;
CREATE POLICY freact_owner ON forum_reactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS net_owner ON network_posts;
CREATE POLICY net_owner ON network_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS ev_owner ON events;
CREATE POLICY ev_owner ON events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS rsvp_owner ON event_rsvps;
CREATE POLICY rsvp_owner ON event_rsvps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS reports_none ON reports;
CREATE POLICY reports_none ON reports FOR ALL USING (FALSE);
DROP POLICY IF EXISTS blocks_owner ON blocks;
CREATE POLICY blocks_owner ON blocks FOR ALL USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS notif_owner ON notifications;
CREATE POLICY notif_owner ON notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
