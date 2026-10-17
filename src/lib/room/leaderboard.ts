import { computeStreak } from './streak';

export type Period = 'week' | 'month' | 'all';

// Etichetta pubblica: rispetta anonymous_mode e scelte di visibilità.
export function maskOwner(handle: string | null, anonymous: boolean): string {
  if (anonymous || !handle) return 'Anonimo';
  return `@${handle}`;
}

export type RevenueInput = {
  startup_id: string; user_id: string; name: string;
  revenue_self_cents: number | null; verified?: { mrr_cents: number; currency: string };
};

export function rankRevenue(rows: RevenueInput[]) {
  return rows
    .map((s) => ({
      startup_id: s.startup_id,
      user_id: s.user_id,
      name: s.name,
      mrr_cents: s.verified ? s.verified.mrr_cents : (s.revenue_self_cents || 0),
      currency: s.verified ? s.verified.currency : 'EUR',
      verified: Boolean(s.verified),
    }))
    .filter((r) => r.verified || r.mrr_cents > 0)
    .sort((a, b) => b.mrr_cents - a.mrr_cents)
    .slice(0, 50)
    .map((r, i) => ({ rank: i + 1, ...r }));
}

// Classifica per fondatore: somma tutti i guadagni delle sue startup.
// Il ranking è in base al fondatore che ha guadagnato di più.
export function rankFoundersByRevenue(rows: RevenueInput[]) {
  const perFounder = new Map<string, { total_cents: number; currency: string; verified: boolean; startups: string[] }>();
  for (const s of rows) {
    const mrr = s.verified ? s.verified.mrr_cents : (s.revenue_self_cents || 0);
    const isVerifiedRow = Boolean(s.verified);
    // Escludi startup a zero non verificate
    if (!isVerifiedRow && mrr <= 0) continue;
    const cur = perFounder.get(s.user_id) || { total_cents: 0, currency: s.verified?.currency || 'EUR', verified: false, startups: [] };
    cur.total_cents += mrr;
    if (isVerifiedRow) {
      cur.verified = true;
      cur.currency = s.verified!.currency;
    }
    cur.startups.push(s.name);
    perFounder.set(s.user_id, cur);
  }
  return [...perFounder.entries()]
    .map(([user_id, v]) => ({ user_id, ...v }))
    .filter((r) => r.verified || r.total_cents > 0)
    .sort((a, b) => b.total_cents - a.total_cents)
    .slice(0, 50)
    .map((r, i) => ({ rank: i + 1, ...r }));
}

export function rankStreak(perUser: Map<string, string[]>, period: Period) {
  return [...perUser.entries()]
    .map(([uid, days]) => {
      const st = computeStreak(days);
      return { user_id: uid, value: period === 'all' ? st.current : new Set(days).size, todayDone: st.todayDone };
    })
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 50)
    .map((r, i) => ({ rank: i + 1, ...r }));
}
