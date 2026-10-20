import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  authUser: { id: 'user-1' } as { id: string } | null,
  calls: {
    profilesUpdate: null as Record<string, unknown> | null,
    startupsInsert: null as Record<string, unknown> | null,
    goalsInsert: null as Record<string, unknown> | null,
    tasksInsert: null as Record<string, unknown> | null,
  },
}));

vi.mock('@/lib/supabase-admin', () => ({
  getAuthUser: async () => h.authUser,
  supabaseAdmin: {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          neq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        h.calls.profilesUpdate = payload;
        return { eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: { id: 'user-1' }, error: null }) }) }) };
      },
      insert: (payload: Record<string, unknown>) => {
        if (table === 'startups') h.calls.startupsInsert = payload;
        if (table === 'goals') h.calls.goalsInsert = payload;
        if (table === 'tasks') h.calls.tasksInsert = payload;
        return { select: () => ({ single: async () => ({ data: { id: 'startup-1' }, error: null }) }) };
      },
    }),
  },
}));

const { POST } = await import('../route');

// Lettura tipizzata: TS non sa che le chiamate mock mutano l'oggetto.
const startup = () => h.calls.startupsInsert as Record<string, unknown> | null;

function body(over: Record<string, unknown> = {}) {
  return {
    name: 'Ada Lovelace',
    handle: 'adalov',
    birth_date: '1995-04-01',
    locality: 'Milano, Italia',
    bio: 'Costruisco prodotti.',
    github_username: 'octocat',
    situation: 'Solo founder full-time',
    goals: 'growth',
    skills: ['React'],
    startup_status: 'publish',
    startups: [{ name: 'Esempio', domain: 'esempio.com', url: 'https://esempio.com', tagline: '' }],
    goal_title: 'Esempio: crescere',
    tasks: ['Task 1', 'Task 2', 'Task 3'],
    ...over,
  };
}

function req(over: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/room/onboarding', {
    method: 'POST',
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: JSON.stringify(body(over)),
  });
}

beforeEach(() => {
  h.authUser = { id: 'user-1' };
  h.calls.profilesUpdate = null;
  h.calls.startupsInsert = null;
  h.calls.goalsInsert = null;
  h.calls.tasksInsert = null;
});

describe('POST /api/room/onboarding', () => {
  it('salva situazione, focus, skill e stato della startup nel profilo', async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.calls.profilesUpdate?.onboarding).toEqual({
      situation: 'Solo founder full-time',
      skills: ['React'],
      goals: 'growth',
      startup_status: 'publish',
    });
  });

  it('lo stato della startup decide lo stage del portfolio', async () => {
    await POST(req());
    expect(startup()?.stage).toBe('building');

    h.calls.startupsInsert = null;
    await POST(req({ startup_status: 'market' }));
    expect(startup()?.stage).toBe('launched');
  });

  it('stato non valido -> stage idea e startup_status null', async () => {
    await POST(req({ startup_status: 'non-esiste' }));
    expect(startup()?.stage).toBe('idea');
    expect((h.calls.profilesUpdate?.onboarding as { startup_status: string | null }).startup_status).toBeNull();
  });

  it('crea obiettivo e le tre task sulla prima startup', async () => {
    await POST(req());
    expect(h.calls.goalsInsert).toMatchObject({ startup_id: 'startup-1', title: 'Esempio: crescere' });
    expect((h.calls.tasksInsert as unknown as { title: string }[]).map((t) => t.title)).toEqual(['Task 1', 'Task 2', 'Task 3']);
  });

  it('senza autorizzazione risponde 401 e non scrive nulla', async () => {
    h.authUser = null;
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(h.calls.profilesUpdate).toBeNull();
  });

  it('rifiuta un payload senza focus principale', async () => {
    const res = await POST(req({ goals: '' }));
    expect(res.status).toBe(400);
    expect(h.calls.profilesUpdate).toBeNull();
  });
});
