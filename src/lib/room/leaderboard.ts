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

// Il podio (1º, 2º, 3º) sta in cima alla classifica, sotto c'è il resto dal 4°.
// Il podio esiste solo se ci sono almeno tre fondatori in classifica: con meno
// righe non si inventa un podio e la lista resta quella completa.
export function splitPodium<T extends { rank: number }>(rows: T[]): { podium: T[]; rest: T[] } {
  if (rows.length < 3) return { podium: [], rest: rows };
  return { podium: rows.slice(0, 3), rest: rows.slice(3) };
}

// Classifica "solo punti": 4 criteri, gli stessi numeri della card "Tu".
// Regole: 10 punti per giorno di streak, 1 punto ogni 10€ di MRR mensile,
// 1 punto per contributo GitHub dell'ultimo anno, 50 punti per app rilasciata.
export const POINTS_RULES = {
  streak: 10,
  revenuePer10: 1,
  contribution: 1,
  app: 50,
} as const;

export type PointsInput = {
  user_id: string;
  streak: number;
  mrr_cents: number;
  contributions: number;
  apps: number;
};

export type PointsBreakdown = PointsInput & {
  streak_points: number;
  revenue_points: number;
  contributions_points: number;
  apps_points: number;
  total: number;
};

export function computePoints(r: PointsInput): PointsBreakdown {
  const streak_points = Math.max(0, Math.floor(r.streak || 0)) * POINTS_RULES.streak;
  const revenue_points = Math.floor(Math.max(0, r.mrr_cents || 0) / 1000) * POINTS_RULES.revenuePer10;
  const contributions_points = Math.max(0, Math.floor(r.contributions || 0)) * POINTS_RULES.contribution;
  const apps_points = Math.max(0, Math.floor(r.apps || 0)) * POINTS_RULES.app;
  return {
    ...r,
    streak_points,
    revenue_points,
    contributions_points,
    apps_points,
    total: streak_points + revenue_points + contributions_points + apps_points,
  };
}

export function rankPoints(rows: PointsInput[]) {
  return rows
    .map((r) => computePoints(r))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || b.streak - a.streak)
    .slice(0, 50)
    .map((r, i) => ({ rank: i + 1, ...r }));
}
