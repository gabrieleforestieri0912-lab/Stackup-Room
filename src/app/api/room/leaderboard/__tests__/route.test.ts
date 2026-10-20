import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

type Row = Record<string, unknown>;

const h = vi.hoisted(() => ({
  tables: {} as Record<string, Row[]>,
}));

// Client Supabase finto: ogni catena è thenable e risolve con i dati della tabella.
function makeChain(table: string) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'not', 'in', 'order', 'gte', 'lte', 'limit'];
  for (const m of methods) chain[m] = () => chain;
  chain.then = (resolve: (v: unknown) => unknown, reject?: (r: unknown) => unknown) =>
    Promise.resolve({ data: h.tables[table] ?? [] }).then(resolve, reject);
  return chain;
}

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: (table: string) => makeChain(table) },
}));

const { GET } = await import('../route');

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const oldDay = new Date(Date.now() - 200 * 86400000).toISOString().slice(0, 10);

function req(type: string) {
  return new NextRequest(`http://localhost/api/room/leaderboard?type=${type}&period=all`);
}

beforeEach(() => {
  h.tables = {
    profiles: [
      { id: 'u-ada', handle: 'ada', anonymous_mode: false, show_revenue: true },
      { id: 'u-bruno', handle: 'bruno', anonymous_mode: false, show_revenue: false },
      { id: 'u-carla', handle: 'carla', anonymous_mode: false, show_revenue: true },
    ],
    startups: [
      { id: 's1', user_id: 'u-ada', name: 'Ada App', revenue_self_cents: 5000, archived: false },
      { id: 's2', user_id: 'u-ada', name: 'Ada SaaS', revenue_self_cents: null, archived: false },
      { id: 's3', user_id: 'u-bruno', name: 'Bruno Tool', revenue_self_cents: 999999, archived: false },
      { id: 's4', user_id: 'u-carla', name: 'Carla AI', revenue_self_cents: 0, archived: false },
    ],
    revenue_snapshots: [
      { startup_id: 's2', mrr_cents: 100000, currency: 'EUR', source: 'stripe', created_at: '2026-01-01' },
    ],
    ship_days: [
      { user_id: 'u-ada', day: today },
      { user_id: 'u-ada', day: yesterday },
      { user_id: 'u-bruno', day: yesterday },
    ],
    github_cache: [
      { user_id: 'u-ada', day: today, count: 2 },
      { user_id: 'u-ada', day: oldDay, count: 60 },
      { user_id: 'u-bruno', day: oldDay, count: 5 },
    ],
  };
});

describe('GET /api/room/leaderboard?type=points', () => {
  it('calcola i punti sui 4 criteri e ordina la classifica', async () => {
    const res = await GET(req('points'));
    const d = await res.json();
    expect(d.type).toBe('points');
    // ada 287, bruno 65 (senza ricavi), carla 50 (1 app)
    expect(d.rows).toHaveLength(3);

    const ada = d.rows[0];
    expect(ada.user_id).toBe('u-ada');
    expect(ada.owner).toBe('@ada');
    expect(ada.rank).toBe(1);
    expect(ada.streak).toBe(2);
    expect(ada.apps).toBe(2);
    expect(ada.contributions).toBe(62);
    expect(ada.contributions_week).toBe(2);
    expect(ada.mrr_cents).toBe(105000);       // 1000€ verificati + 50€ dichiarati
    expect(ada.mrr_verified).toBe(true);
    expect(ada.total).toBe(2 * 10 + 105 + 62 + 2 * 50);
  });

  it('chi non condivide i ricavi non li espone e non prende punti da quelli', async () => {
    const res = await GET(req('points'));
    const d = await res.json();
    const bruno = d.rows.find((r: { user_id: string }) => r.user_id === 'u-bruno');
    expect(bruno).toBeTruthy();
    expect(bruno.mrr_cents).toBe(0);        // privacy: nessun fatturato esposto
    expect(bruno.mrr_shared).toBe(false);
    expect(bruno.revenue_points).toBe(0);
    expect(bruno.total).toBe(10 + 5 + 50);   // streak 1, 5 contributi, 1 app
    expect(bruno.rank).toBe(2);
  });

  it('chi ha solo app prende i punti delle app', async () => {
    const res = await GET(req('points'));
    const d = await res.json();
    const carla = d.rows.find((r: { user_id: string }) => r.user_id === 'u-carla');
    expect(carla.total).toBe(50);
    expect(carla.apps).toBe(1);
    expect(carla.streak).toBe(0);
  });

  it('la classifica per ricavi continua a sommare tutte le startup del fondatore', async () => {
    const res = await GET(req('revenue'));
    const d = await res.json();
    expect(d.type).toBe('revenue');
    const ada = d.rows.find((r: { user_id: string }) => r.user_id === 'u-ada');
    expect(ada.total_cents).toBe(105000);
    expect(ada.startups).toEqual(['Ada App', 'Ada SaaS']);
    // chi non ha show_revenue non compare nella classifica dei ricavi
    expect(d.rows.some((r: { user_id: string }) => r.user_id === 'u-bruno')).toBe(false);
  });
});
