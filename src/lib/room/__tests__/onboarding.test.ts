import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_STEPS, SITUATIONS, STARTUP_STATUSES, FOCUSES, SKILL_PRESETS, DEFAULT_TASKS, MAX_TASKS, STREAK_DAYS,
  cleanTasks, defaultGoalTitle, focusLabel, isFocus, isStartupStatus, stageForStatus, startupStatusLabel,
} from '../onboarding';

describe('onboarding — struttura dei passi', () => {
  it('i passi sono nell\'ordine richiesto: profilo, startup, github, situazione, focus, task, streak', () => {
    expect(ONBOARDING_STEPS.map((s) => s.id)).toEqual(['profilo', 'startup', 'github', 'situazione', 'focus', 'task', 'streak']);
  });

  it('la striscia della streak copre 7 giorni', () => {
    expect(STREAK_DAYS).toBe(7);
  });

  it('la situazione corrente con la startup include pubblicare e marketizzare', () => {
    const labels = STARTUP_STATUSES.map((s) => s.label);
    expect(labels).toContain('Devo pubblicarla');
    expect(labels).toContain('Devo marketizzarla');
  });

  it('le skill sono selezionabili e le task di default sono tre', () => {
    expect(SKILL_PRESETS.length).toBeGreaterThan(3);
    expect(DEFAULT_TASKS).toHaveLength(3);
    expect(DEFAULT_TASKS.every((t) => t.trim().length > 0)).toBe(true);
  });
});

describe('stageForStatus', () => {
  it('mappa ogni stato su uno stage del portfolio valido', () => {
    expect(stageForStatus('idea')).toBe('idea');
    expect(stageForStatus('build')).toBe('building');
    expect(stageForStatus('publish')).toBe('building');
    expect(stageForStatus('market')).toBe('launched');
    expect(stageForStatus('clients')).toBe('launched');
    expect(stageForStatus('live')).toBe('scaling');
  });

  it('stato sconosciuto -> idea (mai crashare)', () => {
    expect(stageForStatus('nonsense')).toBe('idea');
    expect(stageForStatus('')).toBe('idea');
  });
});

describe('isStartupStatus / isFocus', () => {
  it('accetta solo valori noti', () => {
    expect(isStartupStatus('market')).toBe(true);
    expect(isStartupStatus('market2')).toBe(false);
    expect(isStartupStatus(42)).toBe(false);
    expect(isFocus('growth')).toBe(true);
    expect(isFocus('nope')).toBe(false);
  });
});

describe('etichette di default', () => {
  it('le etichette hanno un fallback leggibile', () => {
    expect(startupStatusLabel('publish')).toBe('Devo pubblicarla');
    expect(startupStatusLabel('xxx')).toBe(STARTUP_STATUSES[0].label);
    expect(focusLabel('sales')).toBe('Vendere');
    expect(focusLabel('xxx')).toBe(FOCUSES[0].label);
  });

  it('l\'obiettivo di default usa il focus e il nome della startup', () => {
    expect(defaultGoalTitle('growth', 'Ada App')).toBe('Ada App: crescere');
    expect(defaultGoalTitle('growth')).toBe('Crescere');
  });
});

describe('cleanTasks', () => {
  it('togli spazi, vuoti e troppe task', () => {
    expect(cleanTasks(['  a  ', '', '   ', 'b'])).toEqual(['a', 'b']);
    expect(cleanTasks(Array.from({ length: 9 }, (_, i) => `t${i}`))).toHaveLength(MAX_TASKS);
  });
});

describe('SITUATIONS', () => {
  it('le situazioni personali restano disponibili', () => {
    expect(SITUATIONS.length).toBeGreaterThan(3);
  });
});
