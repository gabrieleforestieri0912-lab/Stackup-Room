// Iniziali + colore "casuale" ma stabile per l'avatar.
// Usato come fallback quando l'utente non ha un'immagine profilo.

const PALETTE = [
  '#f97316', '#ef4444', '#ec4899', '#d946ef',
  '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6',
  '#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e',
  '#84cc16', '#eab308', '#f59e0b', '#f43f5e',
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Colore casuale deterministico: stesso seed → stesso colore (stabile tra render/sessioni).
export function avatarGradient(seed: string): string {
  const h = hash(seed || 'stackup');
  const a = PALETTE[h % PALETTE.length];
  const b = PALETTE[(h >>> 5) % PALETTE.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
