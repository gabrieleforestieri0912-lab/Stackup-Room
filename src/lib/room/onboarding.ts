import { STAGES } from './m2';

// Flusso dell'onboarding Room. L'ordine è quello mostrato dai pallini:
// Profilo -> Startup -> GitHub -> Situazione -> Focus -> Prime task -> Streak.
// Il passo "task" viene saltato se l'utente non ha startup (non c'è a cosa
// agganciare obiettivo e task).
export const ONBOARDING_STEPS = [
  { id: 'profilo', label: 'Profilo' },
  { id: 'startup', label: 'Startup' },
  { id: 'github', label: 'GitHub' },
  { id: 'situazione', label: 'Situazione' },
  { id: 'focus', label: 'Focus' },
  { id: 'task', label: 'Prime task' },
  { id: 'streak', label: 'Streak' },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id'];

/** Quanti giorni mostra la striscia della streak (DAY 1 ... DAY N). */
export const STREAK_DAYS = 7;

/** Situazione personale: da che tipo di vita parti. */
export const SITUATIONS = [
  'Solo founder full-time',
  'Founder part-time',
  'Dipendente che valida un’idea',
  'Studente',
  'Freelance verso prodotto',
] as const;

/**
 * Stato corrente della startup: cosa devi fare adesso con il tuo progetto.
 * Ogni stato mappa su uno `stage` del portfolio (idea/building/launched/...).
 */
export const STARTUP_STATUSES = [
  { id: 'idea', label: 'Ho solo un’idea', hint: 'Sto ancora ragionando sul problema.', stage: 'idea' },
  { id: 'build', label: 'Devo costruirla', hint: 'Ho il piano, il prodotto è da fare.', stage: 'building' },
  { id: 'publish', label: 'Devo pubblicarla', hint: 'Il prodotto c’è, devo lanciarlo online.', stage: 'building' },
  { id: 'market', label: 'Devo marketizzarla', hint: 'È online, devo farmi trovare.', stage: 'launched' },
  { id: 'clients', label: 'Cerco i primi clienti', hint: 'Voglio vendere e chiudere contratti.', stage: 'launched' },
  { id: 'live', label: 'È già lanciata', hint: 'Funziona, ora la faccio crescere.', stage: 'scaling' },
] as const;

export type StartupStatusId = (typeof STARTUP_STATUSES)[number]['id'];

/** Focus principale dei prossimi mesi: su cosa conviene spendere le energie. */
export const FOCUSES = [
  { id: 'product', label: 'Costruire il prodotto', hint: 'MVP, funzionalità, qualità.' },
  { id: 'launch', label: 'Lanciare e validare', hint: 'Pubblicare, feedback, prime utenze.' },
  { id: 'growth', label: 'Crescere', hint: 'Marketing, contenuti, community.' },
  { id: 'sales', label: 'Vendere', hint: 'Clienti, preventivi, partnership.' },
  { id: 'scale', label: 'Scalare', hint: 'Processi, automazione, team.' },
  { id: 'capital', label: 'Raccogliere fondi', hint: 'Investitori, crowdfunding.' },
] as const;

export type FocusId = (typeof FOCUSES)[number]['id'];

/** Skill che l'utente può spuntare. */
export const SKILL_PRESETS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Python', 'Marketing', 'Vendite', 'Design', 'SEO',
] as const;

/** Prime task già impostate: l'utente parte da qui invece che da un foglio vuoto. */
export const DEFAULT_TASKS = [
  'Definire il problema e la promessa in una frase',
  'Preparare il lancio: dominio, email e pagina di attrazione',
  'Parlare con 5 utenti potenziali e annotare le obiezioni',
] as const;

export const MAX_TASKS = 5;

export function isStartupStatus(v: unknown): v is StartupStatusId {
  return typeof v === 'string' && (STARTUP_STATUSES as readonly { id: string }[]).some((s) => s.id === v);
}

export function isFocus(v: unknown): v is FocusId {
  return typeof v === 'string' && (FOCUSES as readonly { id: string }[]).some((f) => f.id === v);
}

/** Stage del portfolio coerente con lo stato scelto. */
export function stageForStatus(status: string): (typeof STAGES)[number] {
  const found = STARTUP_STATUSES.find((s) => s.id === status);
  const stage = found?.stage ?? 'idea';
  return (STAGES as readonly string[]).includes(stage) ? (stage as (typeof STAGES)[number]) : 'idea';
}

/** Etichetta leggibile di uno stato di startup (fallback: idea). */
export function startupStatusLabel(status: string): string {
  return STARTUP_STATUSES.find((s) => s.id === status)?.label ?? STARTUP_STATUSES[0].label;
}

/** Etichetta leggibile di un focus (fallback: primo focus). */
export function focusLabel(focus: string): string {
  return FOCUSES.find((f) => f.id === focus)?.label ?? FOCUSES[0].label;
}

/** Obiettivo di default per le prime task, derivato dal focus scelto. */
export function defaultGoalTitle(focus: string, startupName?: string): string {
  const label = focusLabel(focus);
  const name = (startupName || '').trim();
  return name ? `${name}: ${label.toLowerCase()}` : label;
}

/** Task iniziali non vuoti (le vuote non vengono salvate). */
export function cleanTasks(tasks: string[]): string[] {
  return tasks.map((t) => t.trim()).filter(Boolean).slice(0, MAX_TASKS);
}
