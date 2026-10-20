-- Stackup Room: hardening sicurezza (RLS, rate limit atomico, membership gate)
--
-- 1) Le tabelle "verified" (revenue_snapshots, stripe_links, github_cache) diventano
--    SCRIVIBILI SOLO dal service role: il client non deve poter dichiarare MRR
--    "verificato" o link Stripe falsi.
-- 2) increment_rate_limit diventa atomico e fail-closed lato DB.
-- 3) Il gate "requiresMembership" parte abilitato (era disabilitato di default:
--    la policy esisteva ma non era mai stata applicata).

-- ---------------------------------------------------------------------------
-- 1) Scritture riservate al service role
-- ---------------------------------------------------------------------------

-- Snapshot MRR: il badge "verificato" deve arrivare solo da Stripe (service role).
-- Il client può solo LEGGERE i propri snapshot.
DROP POLICY IF EXISTS revenue_owner ON revenue_snapshots;
CREATE POLICY revenue_read ON revenue_snapshots
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM startups WHERE id = startup_id));

-- Link Stripe Connect: scritti solo dal callback OAuth (service role).
-- Prima l'utente poteva inserire a mano una stripe_account_id altrui e farsi
-- leggere l'MRR di un altro account Stripe.
DROP POLICY IF EXISTS stripe_owner ON stripe_links;
CREATE POLICY stripe_links_read ON stripe_links
  FOR SELECT USING (auth.uid() = user_id);

-- Cache GitHub: i conteggi arrivano solo dalla sync server (service role).
DROP POLICY IF EXISTS gh_owner ON github_cache;
CREATE POLICY gh_cache_read ON github_cache
  FOR SELECT USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2) Rate limit atomico, con search_path fissato e senza accesso anonimo
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_key TEXT,
  p_window_ms INTEGER,
  p_max_requests INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_expires_at TIMESTAMPTZ;
  v_now CONSTANT TIMESTAMPTZ := NOW();
BEGIN
  -- Singola statement: niente race tra SELECT e UPDATE.
  INSERT INTO rate_limits (key, count, expires_at)
  VALUES (p_key, 1, v_now + (p_window_ms || ' milliseconds')::INTERVAL)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE WHEN rate_limits.expires_at < v_now THEN 1 ELSE rate_limits.count + 1 END,
        expires_at = CASE
          WHEN rate_limits.expires_at < v_now THEN v_now + (p_window_ms || ' milliseconds')::INTERVAL
          ELSE rate_limits.expires_at
        END
  RETURNING count, expires_at INTO v_count, v_expires_at;

  IF v_count > p_max_requests THEN
    RETURN JSONB_BUILD_OBJECT(
      'allowed', false,
      'retryAfter', GREATEST(1, EXTRACT(EPOCH FROM (v_expires_at - v_now))::INTEGER),
      'count', v_count
    );
  END IF;

  -- Pulizia occasionale delle finestre scadute.
  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE expires_at < v_now;
  END IF;

  RETURN JSONB_BUILD_OBJECT('allowed', true, 'count', v_count);
END;
$$;

-- Solo il service role (i route handler) usa il rate limiter: via anon si
-- poteva azzerare il contatore di qualcun altro passando per la stessa chiave.
REVOKE EXECUTE ON FUNCTION increment_rate_limit(TEXT, INTEGER, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- Il contatore iscritti non deve essere incrementabile da anon.
CREATE OR REPLACE FUNCTION increment_enrollment_count(course_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE courses
  SET enrollment_count = COALESCE(enrollment_count, 0) + 1
  WHERE id = course_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_enrollment_count(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_enrollment_count(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 3) Gate "solo membri" attivo di default
-- ---------------------------------------------------------------------------
-- Finché era FALSE la community era aperta a qualunque utente autenticato:
-- la policy esisteva ma non era mai stata applicata.
INSERT INTO feature_flags (key, enabled) VALUES ('requiresMembership', TRUE)
ON CONFLICT (key) DO UPDATE SET enabled = TRUE;
