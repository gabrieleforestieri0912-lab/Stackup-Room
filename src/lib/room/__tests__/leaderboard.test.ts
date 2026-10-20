import { describe, it, expect } from 'vitest';
import { computePoints, maskOwner, rankPoints, rankRevenue, rankStreak, splitPodium } from '../leaderboard';

describe('maskOwner', () => {
  it('mostra handle quando pubblico', () => {
    expect(maskOwner('adalov', false)).toBe('@adalov');
  });
  it('maschera in anonymous mode (stats mantenute altrove)', () => {
    expect(maskOwner('adalov', true)).toBe('Anonimo');
  });
  it('maschera senza handle', () => {
    expect(maskOwner(null, false)).toBe('Anonimo');
  });
});

describe('rankRevenue', () => {
  const rows = [
    { startup_id: 'a', user_id: 'u1', name: 'A', revenue_self_cents: 50000, verified: undefined },
    { startup_id: 'b', user_id: 'u2', name: 'B', revenue_self_cents: null, verified: { mrr_cents: 10000, currency: 'EUR' } },
    { startup_id: 'c', user_id: 'u3', name: 'C', revenue_self_cents: null, verified: undefined },
  ];
  it('ordina per MRR e distingue verificato da dichiarato', () => {
    const r = rankRevenue(rows);
    expect(r.map((x) => x.startup_id)).toEqual(['a', 'b']);
    expect(r[1].verified).toBe(true);
    expect(r[0].verified).toBe(false);
    expect(r[0].rank).toBe(1);
  });
  it('esclude righe a zero non verificate', () => {
    expect(rankRevenue(rows).some((x) => x.startup_id === 'c')).toBe(false);
  });
  it('tiene la riga verificata anche a zero (badge onesto)', () => {
    const r = rankRevenue([{ startup_id: 'z', user_id: 'u', name: 'Z', revenue_self_cents: 999, verified: { mrr_cents: 0, currency: 'EUR' } }]);
    expect(r).toHaveLength(1);
    expect(r[0].mrr_cents).toBe(0);
  });
});

describe('splitPodium', () => {
  const rows = [1, 2, 3, 4, 5].map((n) => ({ rank: n }));

  it('mette i primi 3 nel podio e il resto sotto', () => {
    const { podium, rest } = splitPodium(rows);
    expect(podium.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(rest.map((r) => r.rank)).toEqual([4, 5]);
  });

  it('non crea un podio con meno di tre righe (la lista resta intera)', () => {
    for (const n of [0, 1, 2]) {
      const { podium, rest } = splitPodium(rows.slice(0, n));
      expect(podium).toEqual([]);
      expect(rest).toHaveLength(n);
    }
  });

  it('con esattamente tre righe il podio è tutto e sotto non resta nulla', () => {
    const { podium, rest } = splitPodium(rows.slice(0, 3));
    expect(podium.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(rest).toEqual([]);
  });
});

describe('computePoints', () => {
  it('sommi i 4 criteri: streak, ricavi, contributi, app', () => {
    const p = computePoints({ user_id: 'u1', streak: 3, mrr_cents: 105000, contributions: 62, apps: 2 });
    expect(p.streak_points).toBe(30);
    expect(p.revenue_points).toBe(105);      // 1 punto ogni 10€ (1050€)
    expect(p.contributions_points).toBe(62); // 1 punto per contributo
    expect(p.apps_points).toBe(100);        // 50 per app
    expect(p.total).toBe(30 + 105 + 62 + 100);
  });

  it('arrotonda per difetto i ricavi e azzera i valori negativi', () => {
    expect(computePoints({ user_id: 'u', streak: 0, mrr_cents: 999, contributions: 0, apps: 0 }).revenue_points).toBe(0);
    expect(computePoints({ user_id: 'u', streak: -5, mrr_cents: -100, contributions: -3, apps: -1 }).total).toBe(0);
  });
});

describe('rankPoints', () => {
  const rows = [
    { user_id: 'u1', streak: 3, mrr_cents: 0, contributions: 62, apps: 2 },
    { user_id: 'u2', streak: 10, mrr_cents: 0, contributions: 0, apps: 0 },
    { user_id: 'u3', streak: 0, mrr_cents: 0, contributions: 0, apps: 0 },
  ];
  it('ordina per punti totali e assegna il rank', () => {
    const r = rankPoints(rows);
    expect(r.map((x) => x.user_id)).toEqual(['u1', 'u2']);
    expect(r[0].rank).toBe(1);
    expect(r[0].total).toBe(30 + 62 + 100);
  });
  it('esclude chi ha zero punti', () => {
    expect(rankPoints(rows).some((x) => x.user_id === 'u3')).toBe(false);
  });
  it('a parità di punti conta lo streak', () => {
    const r = rankPoints([
      { user_id: 'a', streak: 1, mrr_cents: 0, contributions: 0, apps: 0 },
      { user_id: 'b', streak: 5, mrr_cents: 0, contributions: 0, apps: 0 },
    ]);
    expect(r[0].user_id).toBe('b');
  });
});

describe('rankStreak', () => {
  it('all = serie corrente, week/month = giorni distinti', () => {
    // Date relative a oggi: il test non deve rompersi col passare del tempo
    const day = (offset: number) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - offset);
      return d.toISOString().slice(0, 10);
    };
    const per = new Map([
      ['u1', [day(0), day(1)]],
      ['u2', [day(13)]],
    ]);
    const all = rankStreak(per, 'all');
    expect(all[0]).toMatchObject({ user_id: 'u1', value: 2, rank: 1 });
    const week = rankStreak(per, 'week');
    expect(week.find((r) => r.user_id === 'u2')?.value).toBe(1);
  });
  it('esclude chi è a zero e limita a 50', () => {
    const per = new Map([['u1', ['2000-01-01']]]);
    expect(rankStreak(per, 'all')).toHaveLength(0);
  });
});
