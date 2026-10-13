-- Chat completa: risposte (quote), modifica con timestamp.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_chat_reply ON chat_messages(reply_to);
