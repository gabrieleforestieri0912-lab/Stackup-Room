import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashOtp } from '../otp';

// Permessi/RLS: le policy vivono nelle migrazioni SQL (il service role bypassa,
// il client è vincolato). Questo test di contratto garantisce che ogni tabella
// Room abbia RLS + policy e che le risorse private non abbiano mai SELECT pubblica.
const MIGRATIONS = ['003_room_auth_onboarding_profile.sql', '004_room_startups_planner_streak.sql', '005_room_verification_leaderboard.sql', '006_room_community.sql', '007_room_coach.sql', '008_room_feedback.sql', '009_room_custom_trackers.sql', '010_room_stripe_keys.sql', '015_room_security_hardening.sql'];

const PRIVATE_TABLES = [
  'tasks', 'standups', 'time_blocks', 'goals', 'ship_days',
  'otp_codes', 'ai_consents', 'ai_sessions', 'ai_messages', 'ai_usage',
  'stripe_links', 'revenue_snapshots', 'github_cache', 'leaderboard_audit',
  'chat_messages', 'forum_topics', 'forum_posts', 'network_posts', 'events', 'reports', 'blocks', 'notifications', 'feedback',
  'stripe_keys', 'custom_trackers', 'tracker_entries', 'event_rsvps', 'chat_reactions', 'forum_reactions',
];

function sql(): string {
  return MIGRATIONS.map((f) => readFileSync(join(__dirname, '..', '..', '..', '..', 'supabase', 'migrations', f), 'utf8')).join('\n');
}

describe('RLS e permessi (contratto migrazioni)', () => {
  it('ogni tabella privata ha ENABLE ROW LEVEL SECURITY', () => {
    const all = sql();
    const missing = PRIVATE_TABLES.filter((t) => !new RegExp(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`).test(all));
    expect(missing).toEqual([]);
  });

  it('nessuna policy pubblica su risorse private (solo owner o FALSE)', () => {
    const all = sql();
    // Vietato: policy FOR SELECT USING (TRUE) su tabelle private
    for (const t of PRIVATE_TABLES) {
      const re = new RegExp(`CREATE POLICY \\S+ ON ${t} FOR SELECT USING \\(TRUE\\)`, 'i');
      expect(re.test(all), `policy pubblica su ${t}`).toBe(false);
    }
  });

  it('OTP: codici hashati, mai in chiaro', () => {
    const h1 = hashOtp('123456', 'a@b.it');
    expect(h1).not.toContain('123456');
    expect(h1).toHaveLength(64);
    expect(hashOtp('123456', 'a@b.it')).toBe(h1);
    expect(hashOtp('123456', 'c@d.it')).not.toBe(h1);
  });
});

describe('RLS: i dati "verified" non sono scrivibili dal client', () => {
  // Lo stato finale è quello dell'ultima migrazione: le policy di scrittura
  // delle tabelle "verified" devono essere state rimosse e sostituite da
  // policy solo-SELECT (le scritture restano al service role).
  const hardening = readFileSync(
    join(__dirname, '..', '..', '..', '..', 'supabase', 'migrations', '015_room_security_hardening.sql'),
    'utf8',
  );

  it('le tabelle "verified" hanno solo policy di lettura nel client', () => {
    for (const t of ['revenue_snapshots', 'stripe_links', 'github_cache']) {
      // La policy di scrittura del passato deve essere rimossa.
      expect(
        new RegExp(`DROP POLICY IF EXISTS \\w+ ON ${t};`).test(hardening),
        `policy di scrittura non rimossa su ${t}`,
      ).toBe(true);
      // E quella nuova deve essere solo SELECT.
      const policies = [...hardening.matchAll(new RegExp(`CREATE POLICY \\w+ ON ${t}\\s+FOR (\\w+)`, 'g'))];
      expect(policies.length, `nessuna policy su ${t}`).toBeGreaterThan(0);
      for (const p of policies) {
        expect(p[1], `policy di scrittura su ${t}`).toBe('SELECT');
      }
    }
  });

  it('rate limiter: nessun accesso anonimo alla RPC', () => {
    expect(hardening).toMatch(/REVOKE EXECUTE ON FUNCTION increment_rate_limit\(TEXT, INTEGER, INTEGER\) FROM anon, authenticated;/);
  });

  it('gate membership attivo di default', () => {
    expect(hardening).toMatch(/requiresMembership', TRUE\)/);
  });
});
