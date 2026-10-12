import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashOtp } from '../otp';

// Permessi/RLS: le policy vivono nelle migrazioni SQL (il service role bypassa,
// il client è vincolato). Questo test di contratto garantisce che ogni tabella
// Room abbia RLS + policy e che le risorse private non abbiano mai SELECT pubblica.
const MIGRATIONS = ['003_room_auth_onboarding_profile.sql', '004_room_startups_planner_streak.sql', '005_room_verification_leaderboard.sql', '006_room_community.sql', '007_room_coach.sql', '008_room_feedback.sql'];

const PRIVATE_TABLES = [
  'tasks', 'standups', 'time_blocks', 'goals', 'ship_days',
  'otp_codes', 'ai_consents', 'ai_sessions', 'ai_messages', 'ai_usage',
  'stripe_links', 'revenue_snapshots', 'github_cache', 'leaderboard_audit',
  'chat_messages', 'forum_topics', 'forum_posts', 'network_posts', 'events', 'reports', 'blocks', 'notifications', 'feedback',
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
