import { describe, it, expect } from 'vitest';
import { computeStreak } from '../streak';

describe('computeStreak', () => {
  it('parte da zero senza giorni', () => {
    expect(computeStreak([], '2026-10-12')).toEqual({ current: 0, longest: 0, todayDone: false });
  });

  it('conta la serie corrente con oggi shippato', () => {
    const r = computeStreak(['2026-10-12', '2026-10-11', '2026-10-10'], '2026-10-12');
    expect(r).toEqual({ current: 3, longest: 3, todayDone: true });
  });

  it('tiene la serie se oggi manca ma ieri cè', () => {
    const r = computeStreak(['2026-10-11', '2026-10-10'], '2026-10-12');
    expect(r).toEqual({ current: 2, longest: 2, todayDone: false });
  });

  it('azzera la corrente dopo un buco, record invariato', () => {
    const r = computeStreak(['2026-10-12', '2026-10-09', '2026-10-08', '2026-10-07'], '2026-10-12');
    expect(r.current).toBe(1);
    expect(r.longest).toBe(3);
    expect(r.todayDone).toBe(true);
  });

  it('giorni duplicati non gonfiano la serie', () => {
    const r = computeStreak(['2026-10-12', '2026-10-12', '2026-10-11'], '2026-10-12');
    expect(r.current).toBe(2);
  });

  it('un solo giorno isolato nel passato non è serie corrente', () => {
    const r = computeStreak(['2026-09-01'], '2026-10-12');
    expect(r).toEqual({ current: 0, longest: 1, todayDone: false });
  });
});
