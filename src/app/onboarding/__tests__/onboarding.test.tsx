// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import OnboardingPage from '../page';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), replaceState: vi.fn() }),
}));
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt as string} />;
  },
}));
vi.mock('@/lib/auth-token', () => ({
  getAccessToken: async () => 'test-token',
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'ada@test.it', authMethod: 'otp' }, logout: vi.fn() }),
}));

let onboardingBody: Record<string, unknown> | null = null;
let onboardingCalls = 0;

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes('/api/room/profile')) {
      return { ok: true, json: async () => ({ profile: { onboarding_completed: false } }) };
    }
    if (u.includes('/api/room/handle')) {
      return { ok: true, json: async () => ({ available: true }) };
    }
    if (u.includes('/api/room/github/profile')) {
      return {
        ok: true,
        json: async () => ({
          profile: { login: 'octocat', name: 'Octo Cat', avatar_url: '', html_url: 'https://github.com/octocat', public_repos: 3, followers: 10 },
        }),
      };
    }
    if (u.includes('/api/room/onboarding')) {
      onboardingCalls += 1;
      onboardingBody = JSON.parse(String(init?.body || '{}'));
      return { ok: true, json: async () => ({ profile: {} }) };
    }
    // geocoding Open-Meteo e altre chiamate: risposta vuota
    return { ok: false, json: async () => ({}) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const dots = () => Array.from(screen.getByLabelText('Avanzamento onboarding').querySelectorAll('span'));
const currentDot = () => screen.getByLabelText('Avanzamento onboarding').querySelector('[aria-current="step"]');

async function fillProfile() {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ada Lovelace' } });
  fireEvent.change(screen.getByLabelText('Handle (min 3)'), { target: { value: 'adalov' } });
  fireEvent.change(screen.getByLabelText('Data di nascita (16+ anni)'), { target: { value: '1995-04-01' } });
  fireEvent.change(screen.getByLabelText(/Dove ti trovi/), { target: { value: 'Milano' } });
  fireEvent.change(screen.getByLabelText(/Su di te/), { target: { value: 'Costruisco prodotti per founder.' } });
  // la verifica del handle è debounced: aspetta che sia "Disponibile"
  await waitFor(() => expect(screen.getByText('Disponibile')).toBeTruthy(), { timeout: 3000 });
  fireEvent.click(screen.getByRole('button', { name: /Continua/ }));
}

beforeEach(() => {
  push.mockClear();
  onboardingBody = null;
  onboardingCalls = 0;
  mockFetch();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('onboarding — pallini di avanzamento', () => {
  it('un pallino per pagina e quello chiaro segna lo step corrente', async () => {
    render(<OnboardingPage />);

    await waitFor(() => expect(screen.getByText(/Step 1 di/)).toBeTruthy());
    expect(dots()).toHaveLength(7);
    expect(currentDot()).toBe(dots()[0]);

    await fillProfile();

    // dopo il profilo si è allo step 2 (Startup)
    await waitFor(() => expect(screen.getByText(/Step 2 di/)).toBeTruthy());
    expect(currentDot()).toBe(dots()[1]);
  });
});

describe('onboarding — flusso completo', () => {
  it('profilo → startup → github → situazione → focus → prime task → streak', async () => {
    render(<OnboardingPage />);
    await waitFor(() => expect(screen.getByText(/Step 1 di/)).toBeTruthy());

    // 1. Profilo
    await fillProfile();

    // 2. Startup
    await waitFor(() => expect(screen.getByLabelText('Dominio')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Dominio'), { target: { value: 'esempio.com' } });
    await waitFor(() => expect((screen.getByLabelText('Nome startup') as HTMLInputElement).value).toBe('Esempio'));
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // 3. GitHub
    await waitFor(() => expect(screen.getByLabelText('Username GitHub')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Username GitHub'), { target: { value: 'octocat' } });
    fireEvent.click(screen.getByRole('button', { name: /Connetti/ }));
    await waitFor(() => expect(screen.getByText('Connesso')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // 4. Situazione: stato della startup + skills nella stessa pagina
    await waitFor(() => expect(screen.getByText(/Dove sei con la startup/)).toBeTruthy());
    expect(screen.getByLabelText(/Devo pubblicarla/)).toBeTruthy();
    expect(screen.getByLabelText(/Devo marketizzarla/)).toBeTruthy();
    expect(screen.getByText(/Le tue skill/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Devo pubblicarla/));
    fireEvent.click(screen.getByRole('button', { name: 'React' }));
    expect(screen.getByRole('button', { name: 'React' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // 5. Focus principale
    await waitFor(() => expect(screen.getByText(/Qual è il tuo focus principale/)).toBeTruthy());
    fireEvent.click(screen.getByLabelText(/Crescere/));
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // 6. Prime task già impostate + bottone con il numero
    await waitFor(() => expect(screen.getByText(/Step 6 di/)).toBeTruthy());
    expect((screen.getByLabelText('Task 1') as HTMLInputElement).value).toBe('Definire il problema e la promessa in una frase');
    expect((screen.getByLabelText('Task 2') as HTMLInputElement).value).toBe('Preparare il lancio: dominio, email e pagina di attrazione');
    expect((screen.getByLabelText('Task 3') as HTMLInputElement).value).toBe('Parlare con 5 utenti potenziali e annotare le obiezioni');
    const cta = screen.getByRole('button', { name: /Inizia con queste 3 task/ });
    expect(cta).toBeTruthy();

    // "Inizia con queste N task" salva e porta alla pagina della streak
    fireEvent.click(cta);
    await waitFor(() => expect(screen.getByText(/Startup Club — the streak starts now/)).toBeTruthy());
    expect(screen.getByText(/Step 7 di/)).toBeTruthy();

    // la pagina della streak: 7 giorni, fuoco animato, copy
    const days = screen.getByLabelText('Streak dei prossimi 7 giorni');
    expect(days.querySelectorAll('li')).toHaveLength(7);
    for (const d of ['DAY 1', 'DAY 2', 'DAY 3', 'DAY 4', 'DAY 5', 'DAY 6', 'DAY 7']) {
      expect(days.textContent).toContain(d);
    }
    expect(days.querySelector('[aria-current="step"]')?.textContent).toContain('DAY 1');
    expect(document.querySelectorAll('.flame-anim').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.flame-anim-inner').length).toBeGreaterThan(0);
    expect(screen.getByText(/Complete a task to make today count/)).toBeTruthy();
    expect(screen.getByText(/Run standups each morning/)).toBeTruthy();

    // l'ultimo bottone entra nella Room
    fireEvent.click(screen.getByRole('button', { name: /Entra nella Room/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/room/planner'));

    // il payload inviato al server
    expect(onboardingBody).toMatchObject({
      situation: 'Solo founder full-time',
      startup_status: 'publish',
      goals: 'growth',
      skills: ['React'],
      goal_title: 'Esempio: crescere',
    });
    expect((onboardingBody as { tasks: string[] }).tasks).toHaveLength(3);
    // salvato una sola volta: la pagina streak non rilancia il submit
    expect(onboardingCalls).toBe(1);
  });

  it('senza startup la pagina delle task avvisa e il bottone è "Entra nella Room"', async () => {
    render(<OnboardingPage />);
    await waitFor(() => expect(screen.getByText(/Step 1 di/)).toBeTruthy());

    await fillProfile();

    // Startup: nessun dominio inserito
    await waitFor(() => expect(screen.getByLabelText('Dominio')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // GitHub
    await waitFor(() => expect(screen.getByLabelText('Username GitHub')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Username GitHub'), { target: { value: 'octocat' } });
    fireEvent.click(screen.getByRole('button', { name: /Connetti/ }));
    await waitFor(() => expect(screen.getByText('Connesso')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // Situazione
    await waitFor(() => expect(screen.getByText(/Dove sei con la startup/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // Focus
    await waitFor(() => expect(screen.getByText(/Qual è il tuo focus principale/)).toBeTruthy());
    fireEvent.click(screen.getByLabelText(/Vendere/));
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // Task: pagina informativa, nessun bottone "Inizia con queste N task"
    await waitFor(() => expect(screen.getByText(/Nessuna startup, nessuna task/)).toBeTruthy());
    expect(screen.queryByRole('button', { name: /Inizia con queste/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Continua/ }));

    // Streak: ultima pagina, il bottone entra nella Room e salva
    await waitFor(() => expect(screen.getByText(/Startup Club — the streak starts now/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Entra nella Room/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/room/planner'));
    expect(onboardingBody).toMatchObject({ goals: 'sales' });
  });
});
