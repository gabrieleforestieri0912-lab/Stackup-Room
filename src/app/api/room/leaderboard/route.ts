import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';
import { rankFoundersByRevenue, rankRevenue, rankStreak, maskOwner, type Period } from '@/lib/room/leaderboard';

export const runtime = 'nodejs';
const WINDOW_DAYS: Record<Period, number | null> = { week: 7, month: 30, all: null };

function cutoff(period: Period): string | null {
  const w = WINDOW_DAYS[period];
  if (!w) return null;
  return new Date(Date.now() - (w - 1) * 86400000).toISOString().slice(0, 10);
}

// Classifiche calcolate lato server con rate limit. Revenue: verificata (snapshot Stripe)
// e dichiarata distinte; streak: ship consecutivi o giorni shippati nel periodo.
// Rispetta anonymous_mode (maschera) e show_revenue=false (esclusa da revenue).
export async function GET(req: NextRequest) {
  const rl = await rateLimit(rateLimitKey(req, 'leaderboard'), 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ message: `Troppe richieste. Riprova tra ${rl.retryAfter} secondi.` }, { status: 429 });
  }
  const sp = new URL(req.url).searchParams;
  const type = sp.get('type') === 'streak' ? 'streak' : 'revenue';
  const period: Period = sp.get('period') === 'week' || sp.get('period') === 'month' ? sp.get('period') as Period : 'all';

  // Profili visibili: handle presente; per revenue serve anche show_revenue=true.
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id,handle,name,anonymous_mode,show_revenue').not('handle', 'is', null);
  const byId = new Map((profiles || []).map((p: Record<string, unknown>) => [p.id as string, p]));
  const label = (id: string) => {
    const p = byId.get(id) as { anonymous_mode?: boolean; handle?: string } | undefined;
    return maskOwner(p?.handle || null, Boolean(p?.anonymous_mode));
  };

  if (type === 'revenue') {
    const visible = new Set(
      (profiles || []).filter((p: { show_revenue?: boolean }) => p.show_revenue).map((p: { id: string }) => p.id),
    );
    const { data: startups } = await supabaseAdmin.from('startups').select('id,user_id,name,revenue_self_cents').eq('archived', false);
    const list = (startups || []).filter((s: { user_id: string }) => visible.has(s.user_id));
    const ids = list.map((s: { id: string }) => s.id);
    const verified = new Map<string, { mrr_cents: number; currency: string }>();
    if (ids.length > 0) {
      const { data: snaps } = await supabaseAdmin.from('revenue_snapshots').select('startup_id,mrr_cents,currency,created_at').eq('source', 'stripe').in('startup_id', ids).order('created_at', { ascending: false });
      for (const r of snaps || []) {
        if (!verified.has(r.startup_id)) verified.set(r.startup_id, r);
      }
    }
    // Ranking per fondatore: somma i guadagni di tutte le sue startup.
    // Vince il fondatore che ha guadagnato di più in totale.
    const rows = rankFoundersByRevenue(list.map((s: { id: string; user_id: string; name: string; revenue_self_cents: number | null }) => ({
      startup_id: s.id, user_id: s.user_id, name: s.name,
      revenue_self_cents: s.revenue_self_cents, verified: verified.get(s.id),
    }))).map((r) => ({ ...r, owner: label(r.user_id), mrr_cents: r.total_cents }));
    // Compat: mantieni anche rankRevenue per eventuali consumer legacy
    void rankRevenue;
    return NextResponse.json({ type, period, rows });
  }

  // Streak
  const cut = cutoff(period);
  let q = supabaseAdmin.from('ship_days').select('user_id,day').order('day', { ascending: false }).limit(5000);
  if (cut) q = q.gte('day', cut);
  const { data: ships } = await q;
  const perUser = new Map<string, string[]>();
  for (const s of ships || []) {
    const p = byId.get(s.user_id);
    if (!p) continue;
    if (!perUser.has(s.user_id)) perUser.set(s.user_id, []);
    perUser.get(s.user_id)!.push(s.day);
  }
  const rows = rankStreak(perUser, period).map((r) => ({ ...r, owner: label(r.user_id) }));
  return NextResponse.json({ type, period, rows });
}
