-- Verifica comportamentale RLS: due utenti non devono vedere i dati l'uno
-- dell'altro (tasks, chat_messages) e non devono poter scrivere per altri.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'a@test.it'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.it')
ON CONFLICT DO NOTHING;

INSERT INTO startups (id, user_id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Startup A')
ON CONFLICT DO NOTHING;
INSERT INTO startups (id, user_id, name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Startup B')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, startup_id, title) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'task di A')
ON CONFLICT DO NOTHING;
INSERT INTO tasks (user_id, startup_id, title) VALUES
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-0000-0000-0000-000000000002', 'task di B')
ON CONFLICT DO NOTHING;
INSERT INTO chat_messages (user_id, body) VALUES
  ('11111111-1111-1111-1111-111111111111', 'msg di A')
ON CONFLICT DO NOTHING;
INSERT INTO chat_messages (user_id, body) VALUES
  ('22222222-2222-2222-2222-222222222222', 'msg di B')
ON CONFLICT DO NOTHING;

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
  v_tasks INT;
  v_tasks_b INT;
  v_chat INT;
  v_chat_b INT;
BEGIN
  SELECT count(*) INTO v_tasks FROM tasks;
  SELECT count(*) INTO v_tasks_b FROM tasks WHERE user_id = '22222222-2222-2222-2222-222222222222';
  SELECT count(*) INTO v_chat FROM chat_messages;
  SELECT count(*) INTO v_chat_b FROM chat_messages WHERE user_id = '22222222-2222-2222-2222-222222222222';

  IF v_tasks <> 1 THEN RAISE EXCEPTION 'FAIL RLS tasks: utente A vede % righe (atteso 1)', v_tasks; END IF;
  IF v_tasks_b <> 0 THEN RAISE EXCEPTION 'FAIL RLS tasks: utente A vede dati di B (% righe)', v_tasks_b; END IF;
  IF v_chat <> 1 THEN RAISE EXCEPTION 'FAIL RLS chat: utente A vede % righe (atteso 1)', v_chat; END IF;
  IF v_chat_b <> 0 THEN RAISE EXCEPTION 'FAIL RLS chat: utente A vede messaggi di B (% righe)', v_chat_b; END IF;

  RAISE NOTICE 'OK RLS: tasks e chat_messages isolati per utente';
END $$;

-- Utente B non deve poter creare task per A
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
DO $$
DECLARE
  v_seen INT;
BEGIN
  BEGIN
    INSERT INTO tasks (user_id, startup_id, title) VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'task forgiato');
    RAISE EXCEPTION 'FAIL RLS: utente B ha potuto scrivere un task per A';
  EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'OK RLS: inserimento per altri utenti bloccato (check_violation)';
    WHEN insufficient_privilege THEN RAISE NOTICE 'OK RLS: inserimento per altri utenti bloccato (insufficient_privilege)';
  END;

  SELECT count(*) INTO v_seen FROM tasks WHERE title = 'task forgiato';
  IF v_seen <> 0 THEN RAISE EXCEPTION 'FAIL RLS: il task forgiato è stato persistito'; END IF;
END $$;

-- B scrive sul proprio startup ma dichiara user_id = A -> WITH CHECK deve bloccarlo
DO $$
DECLARE
  v_seen INT;
BEGIN
  BEGIN
    INSERT INTO tasks (user_id, startup_id, title)
    VALUES ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000002', 'task con user_id falsificato');
    RAISE EXCEPTION 'FAIL RLS: B ha potuto scrivere con user_id di A (WITH CHECK non applicato)';
  EXCEPTION
    WHEN check_violation THEN RAISE NOTICE 'OK RLS: WITH CHECK blocca user_id falsificato';
    WHEN insufficient_privilege THEN RAISE NOTICE 'OK RLS: inserimento con user_id falsificato bloccato';
  END;

  SELECT count(*) INTO v_seen FROM tasks WHERE title = 'task con user_id falsificato';
  IF v_seen <> 0 THEN RAISE EXCEPTION 'FAIL RLS: task con user_id falsificato persistito'; END IF;
END $$;

-- B non deve leggere i messaggi di A
DO $$
DECLARE
  v_chat_a INT;
BEGIN
  SELECT count(*) INTO v_chat_a FROM chat_messages WHERE user_id = '11111111-1111-1111-1111-111111111111';
  IF v_chat_a <> 0 THEN RAISE EXCEPTION 'FAIL RLS: utente B legge i chat di A (% righe)', v_chat_a; END IF;
  RAISE NOTICE 'OK RLS: chat di A invisibile a B';
END $$;

RESET ROLE;
