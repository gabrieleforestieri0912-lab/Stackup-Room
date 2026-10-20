// Primitivi UI condivisi della Room — sistema colore stile startupclub.app:
// teal (#4DE0C9) = primario (azioni, nav attiva, progress, link)
// ember (#FF8A3D) / gold = solo streak & gamification
// Tutte le pagine Room devono usare questi componenti per restare consistenti.

import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export const ROOM = {
  bg: '#0A0B0E',
  teal: '#4DE0C9',
  tealBright: '#8FF0DE',
  ember: '#FF8A3D',
  gold: '#FFC94D',
  inkOnTeal: '#0B0D12',
} as const;

export function RoomLoader({ label = 'Caricamento' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label={label}>
      <Loader2 className="animate-spin text-room" />
    </div>
  );
}

export function RoomHeader({
  eyebrow,
  title,
  sub,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-room text-xs font-semibold uppercase tracking-[0.12em] mb-2">{eyebrow}</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{title}</h1>
          {sub && <p className="text-sm text-zinc-400">{sub}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function RoomCard({
  children,
  className = '',
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const cls = `bg-room-bg border border-zinc-800 rounded-2xl p-6 transition-all ${className}`;
  if (href) {
    return (
      <Link href={href} className={`${cls} block hover:border-room/40`}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  href,
  accent = 'teal',
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  value: React.ReactNode;
  label: string;
  href?: string;
  accent?: 'teal' | 'ember' | 'gold';
}) {
  const color =
    accent === 'ember' ? 'text-ember' : accent === 'gold' ? 'text-gold' : 'text-room';
  const body = (
    <>
      <Icon size={18} className={`${color} mb-2`} />
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{label}</p>
    </>
  );
  const cls =
    'bg-room-bg border border-zinc-800 rounded-2xl p-4 transition-all hover:border-room/40';
  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
}

export function RoomButton({
  children,
  className = '',
  variant = 'primary',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const base =
    variant === 'primary'
      ? 'bg-room text-[#0B0D12] hover:bg-room-bright font-bold'
      : 'bg-zinc-900 border border-zinc-700 text-zinc-100 hover:border-room font-bold';
  return (
    <button className={`px-4 py-2.5 text-sm rounded-xl transition-colors disabled:opacity-60 ${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export const roomInput =
  'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl';

// Colonne di contenuto: centralizzate e non a tutta la larghezza.
export const roomNarrow = 'w-full max-w-2xl mx-auto'; // form e impostazioni
export const roomColumn = 'w-full max-w-3xl mx-auto'; // chat e contenuti conversazionali
