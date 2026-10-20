import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';
import { rankFoundersByRevenue, rankPoints, rankRevenue, rankStreak, maskOwner, type Period } from '@/lib/room/leaderboard';
import { computeStreak } from '@/lib/room/streak';

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
  const type = sp.get('type') === 'streak' ? 'streak' : sp.get('type') === 'points' ? 'points' : 'revenue';
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

  // Classifica per punti: 4 criteri (streak, ricavi, contributi GitHub, app rilasciate).
  // I ricavi contano solo se l'utente ha attivo "Mostra revenue": chi non
  // condivide il fatturato non lo espone, e non prende punti da quello.
  if (type === 'points') {
    const sharesRevenue = new Set(
      (profiles || []).filter((p: { show_revenue?: boolean }) => p.show_revenue).map((p: { id: string }) => p.id),
    );
    const { data: startups } = await supabaseAdmin.from('startups').select('id,user_id,revenue_self_cents').eq('archived', false);
    const startupIds = (startups || []).map((s: { id: string }) => s.id);

    // MRR verificato (snapshot Stripe più recente per startup)
    const verified = new Map<string, { mrr_cents: number; currency: string }>();
    if (startupIds.length > 0) {
      const { data: snaps } = await supabaseAdmin.from('revenue_snapshots').select('startup_id,mrr_cents,currency,created_at').eq('source', 'stripe').in('startup_id', startupIds).order('created_at', { ascending: false });
      for (const r of snaps || []) {
        if (!verified.has(r.startup_id)) verified.set(r.startup_id, r);
      }
    }

    // Per utente: app rilasciate e MRR (verificato se c'è, altrimenti dichiarato)
    const perUser = new Map<string, { apps: number; mrr_cents: number; verified: boolean }>();
    for (const s of (startups || []) as Array<{ id: string; user_id: string; revenue_self_cents: number | null }>) {
      const cur = perUser.get(s.user_id) || { apps: 0, mrr_cents: 0, verified: false };
      cur.apps += 1;
      const snap = verified.get(s.id);
      if (snap) {
        cur.mrr_cents += snap.mrr_cents;
        cur.verified = true;
      } else {
        cur.mrr_cents += s.revenue_self_cents || 0;
      }
      perUser.set(s.user_id, cur);
    }

    // Streak: giorni shippati per utente
    const { data: ships } = await supabaseAdmin.from('ship_days').select('user_id,day').order('day', { ascending: false }).limit(5000);
    const perUserDays = new Map<string, string[]>();
    for (const s of ships || []) {
      const list = perUserDays.get(s.user_id) || [];
      list.push(s.day);
      perUserDays.set(s.user_id, list);
    }

    // Contributi GitHub pubblici: ultimo anno e questa settimana
    const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data: gh } = await supabaseAdmin.from('github_cache').select('user_id,day,count').gte('day', yearAgo);
    const contribYear = new Map<string, number>();
    const contribWeek = new Map<string, number>();
    for (const g of gh || []) {
      contribYear.set(g.user_id, (contribYear.get(g.user_id) || 0) + (g.count || 0));
      if (g.day >= weekAgo) contribWeek.set(g.user_id, (contribWeek.get(g.user_id) || 0) + (g.count || 0));
    }

    const rows = rankPoints(
      [...perUserDays.keys(), ...perUser.keys(), ...contribYear.keys()]
        .filter((id, i, arr) => arr.indexOf(id) === i)
        .map((id) => {
          const u = perUser.get(id) || { apps: 0, mrr_cents: 0, verified: false };
          const share = sharesRevenue.has(id);
          const st = computeStreak(perUserDays.get(id) || []);
          return {
            user_id: id,
            streak: st.current,
            mrr_cents: share ? u.mrr_cents : 0,
            contributions: contribYear.get(id) || 0,
            apps: u.apps,
          };
        }),
    ).map((r) => ({
      ...r,
      owner: label(r.user_id),
      mrr_verified: perUser.get(r.user_id)?.verified ?? false,
      mrr_shared: sharesRevenue.has(r.user_id),
      contributions_week: contribWeek.get(r.user_id) || 0,
    }));

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
