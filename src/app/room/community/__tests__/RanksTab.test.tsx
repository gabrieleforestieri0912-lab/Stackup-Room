// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import RanksTab from '../RanksTab';

const useAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuth(),
}));

type Row = { rank: number; owner: string; total_cents: number; verified: boolean; startups: string[] };
type PointRow = {
  rank: number; owner: string; user_id: string;
  streak: number; mrr_cents: number; contributions: number; apps: number;
  streak_points: number; revenue_points: number; contributions_points: number; apps_points: number;
  total: number; mrr_verified: boolean; mrr_shared: boolean; contributions_week: number;
};

const rows: Row[] = [
  { rank: 1, owner: '@ada', total_cents: 900000, verified: true, startups: ['Ada App'] },
  { rank: 2, owner: '@bruno', total_cents: 500000, verified: false, startups: ['Bruno SaaS', 'Bruno Tools'] },
  { rank: 3, owner: '@carla', total_cents: 300000, verified: true, startups: ['Carla AI'] },
  { rank: 4, owner: '@dario', total_cents: 120000, verified: false, startups: ['Dario Bot'] },
  { rank: 5, owner: '@elena', total_cents: 5000, verified: false, startups: ['Elena App'] },
];

const pointRows: PointRow[] = [
  { rank: 1, owner: '@ada', user_id: 'u1', streak: 12, mrr_cents: 105000, contributions: 62, apps: 2, streak_points: 120, revenue_points: 105, contributions_points: 62, apps_points: 100, total: 387, mrr_verified: true, mrr_shared: true, contributions_week: 2 },
  { rank: 2, owner: '@bruno', user_id: 'u2', streak: 6, mrr_cents: 0, contributions: 40, apps: 1, streak_points: 60, revenue_points: 0, contributions_points: 40, apps_points: 50, total: 150, mrr_verified: false, mrr_shared: false, contributions_week: 0 },
  { rank: 3, owner: '@carla', user_id: 'u3', streak: 3, mrr_cents: 20000, contributions: 10, apps: 1, streak_points: 30, revenue_points: 20, contributions_points: 10, apps_points: 50, total: 110, mrr_verified: false, mrr_shared: true, contributions_week: 0 },
  { rank: 4, owner: '@dario', user_id: 'u4', streak: 2, mrr_cents: 0, contributions: 5, apps: 1, streak_points: 20, revenue_points: 0, contributions_points: 5, apps_points: 50, total: 75, mrr_verified: false, mrr_shared: false, contributions_week: 0 },
];

function mockFetch(revenue: Row[], points: PointRow[] = []) {
  const fetchMock = vi.fn(async (url: string) => {
    const u = String(url);
    if (u.includes('type=points')) {
      return { ok: true, json: async () => ({ type: 'points', period: 'all', rows: points }) };
    }
    return { ok: true, json: async () => ({ type: 'revenue', period: 'all', rows: revenue }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  useAuth.mockReturnValue({ user: null });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('RanksTab — podio in cima alla classifica', () => {
  it('mostra il podio con i primi 3 e la lista sotto dal 4° posto', async () => {
    mockFetch(rows);
    render(<RanksTab />);

    await waitFor(() => expect(screen.getByText('Podio')).toBeTruthy());

    // Il podio contiene i primi tre
    const podium = screen.getByLabelText('Podio');
    expect(podium.textContent).toContain('@ada');
    expect(podium.textContent).toContain('@bruno');
    expect(podium.textContent).toContain('@carla');
    expect(podium.textContent).not.toContain('@dario');
    expect(podium.textContent).not.toContain('@elena');

    // La lista sotto parte dal 4° posto e non ripete il podio
    const list = screen.getByText('Classifica completa').parentElement!;
    expect(list.textContent).toContain('#4');
    expect(list.textContent).toContain('#5');
    expect(list.textContent).not.toContain('#1');
    expect(list.textContent).not.toContain('#2');
    expect(list.textContent).not.toContain('#3');
  });

  it('nessun podio con meno di tre fondatori: la lista resta intera', async () => {
    mockFetch(rows.slice(0, 2));
    render(<RanksTab />);

    await waitFor(() => expect(screen.getByText('#2')).toBeTruthy());
    expect(screen.queryByText('Podio')).toBeNull();
    expect(screen.getByText('#1')).toBeTruthy();
    expect(screen.getByText('#2')).toBeTruthy();
  });

  it('segnala la riga dell\'utente autenticato anche nel podio', async () => {
    useAuth.mockReturnValue({ user: { handle: 'ada' } });
    mockFetch(rows);
    render(<RanksTab />);

    await waitFor(() => expect(screen.getByText('Podio')).toBeTruthy());
    const podium = screen.getByLabelText('Podio');
    expect(podium.textContent).toContain('@ada');
    expect(podium.textContent).toContain('(tu)');
  });

  it('mostra il fatturato in euro', async () => {
    mockFetch(rows);
    render(<RanksTab />);

    await waitFor(() => expect(screen.getByText('Podio')).toBeTruthy());
    const podium = screen.getByLabelText('Podio').textContent || '';
    // 900000 cents = 9.000 € (primo classificato, nel podio)
    expect(podium).toContain((900000 / 100).toLocaleString('it-IT'));
    // 500000 cents = 5.000 € (secondo classificato, nel podio)
    expect(podium).toContain((500000 / 100).toLocaleString('it-IT'));
    expect(podium).toContain('€');
  });
});

describe('RanksTab — classifica per punti', () => {
  it('passa alla vista punti e mostra il podio con i 4 criteri', async () => {
    mockFetch(rows, pointRows);
    render(<RanksTab />);

    await waitFor(() => expect(screen.getByText('Podio')).toBeTruthy());

    fireEvent.click(screen.getByRole('tab', { name: 'Punti' }));
    await waitFor(() => expect(screen.getByText('Chi ha più punti.')).toBeTruthy());

    const podium = screen.getByLabelText('Podio punti');
    expect(podium.textContent).toContain('@ada');
    expect(podium.textContent).toContain('387');
    // i 4 criteri del primo classificato: streak, ricavi, contributi, app
    expect(podium.textContent).toContain('12');
    expect(podium.textContent).toContain((105000 / 100).toLocaleString('it-IT'));
    expect(podium.textContent).toContain('62');
    expect(podium.textContent).toContain('+2 questa settimana');
    expect(podium.textContent).toContain('2');
  });

  it('la lista dei punti parte dal 4° posto', async () => {
    mockFetch(rows, pointRows);
    render(<RanksTab />);
    await waitFor(() => expect(screen.getByText('Podio')).toBeTruthy());

    fireEvent.click(screen.getByRole('tab', { name: 'Punti' }));
    await waitFor(() => expect(screen.getByLabelText('Podio punti')).toBeTruthy());

    const list = screen.getByText('Classifica completa').parentElement!;
    expect(list.textContent).toContain('#4');
    expect(list.textContent).toContain('@dario');
    expect(list.textContent).not.toContain('#1');
  });

  it('non mostra i ricavi di chi non li condivide', async () => {
    mockFetch(rows, pointRows);
    render(<RanksTab />);
    await waitFor(() => expect(screen.getByText('Podio')).toBeTruthy());

    fireEvent.click(screen.getByRole('tab', { name: 'Punti' }));
    await waitFor(() => expect(screen.getByLabelText('Podio punti')).toBeTruthy());

    const podium = screen.getByLabelText('Podio punti').textContent || '';
    expect(podium).toContain('@bruno');
    expect(podium).toContain('150');
    // ada (condivide) mostra il MRR
    expect(podium).toContain((105000 / 100).toLocaleString('it-IT'));
    // solo carla (condivide ma non verificato) mostra "non verificato":
    // bruno non condivide i ricavi, quindi il suo MRR non viene mostrato
    expect(podium.match(/non verificato/g) || []).toHaveLength(1);
  });

  it('senza punti mostra lo stato vuoto con la spiegazione', async () => {
    mockFetch(rows, []);
    render(<RanksTab />);
    await waitFor(() => expect(screen.getByText('Podio')).toBeTruthy());

    fireEvent.click(screen.getByRole('tab', { name: 'Punti' }));
    await waitFor(() => expect(screen.getByText(/Nessun punto ancora/)).toBeTruthy());
    expect(screen.getByText(/Completa una task/)).toBeTruthy();
  });

  it('carica entrambe le classifiche in parallelo', async () => {
    const fetchMock = mockFetch(rows, pointRows);
    render(<RanksTab />);
    await waitFor(() => expect(screen.getByText('Podio')).toBeTruthy());

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('type=revenue'))).toBe(true);
    expect(urls.some((u) => u.includes('type=points'))).toBe(true);
  });
});
