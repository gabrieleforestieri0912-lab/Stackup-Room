import { isValidUrlOrEmpty } from './validation';

export const STAGES = ['idea', 'building', 'launched', 'scaling', 'exit'] as const;
export const PRIORITIES = ['low', 'med', 'high'] as const;
export const TASK_STATUS = ['todo', 'doing', 'done'] as const;

export function cleanStr(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function extractDomain(urlOrDomain: string): string | null {
  const s = urlOrDomain.trim().toLowerCase();
  if (!s) return null;
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Logo automatico dal dominio con fallback a iniziale (nessuna chiave richiesta).
export function logoUrlFor(domain: string | null, explicit: string | null): string | null {
  if (explicit) return explicit;
  if (domain) return `https://logo.clearbit.com/${domain}`;
  return null;
}

export function validTime(t: unknown): boolean {
  return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t);
}

export function validDate(d: unknown): boolean {
  if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  return !Number.isNaN(new Date(`${d}T00:00:00Z`).getTime());
}

export { isValidUrlOrEmpty };
