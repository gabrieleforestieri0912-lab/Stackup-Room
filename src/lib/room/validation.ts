export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HANDLE_RE = /^[a-z0-9_]{3,24}$/;

export function normalizeHandle(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

export function isValidHandle(h: string): boolean {
  return HANDLE_RE.test(h);
}

export function isValidUrlOrEmpty(v: unknown): boolean {
  if (v === '' || v == null) return true;
  if (typeof v !== 'string') return false;
  if (v.length > 500) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isAdult16(birthDate: string): boolean {
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const min = new Date(now.getFullYear() - 16, now.getMonth(), now.getDate());
  return d <= min;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
