import { describe, it, expect } from 'vitest';
import { maskOwner, rankRevenue, rankStreak } from '../leaderboard';

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

describe('rankStreak', () => {
  it('all = serie corrente, week/month = giorni distinti', () => {
    const per = new Map([
      ['u1', ['2026-10-12', '2026-10-11']],
      ['u2', ['2026-10-01']],
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
