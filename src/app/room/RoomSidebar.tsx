'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import { User, CalendarClock, MessagesSquare, Sparkles, LogOut, Settings } from 'lucide-react';
import { initials, avatarGradient } from '@/lib/avatar';

const LINKS = [
  { href: '/room/planner', label: 'Today', icon: CalendarClock, match: '/room/planner' },
  { href: '/room/community', label: 'Room', icon: MessagesSquare, match: '/room/community' },
  { href: '/room/coach', label: 'Coach AI', icon: Sparkles, match: '/room/coach' },
  { href: '/room/you', label: 'You', icon: User, match: '/room/you' },
];

export default function RoomSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      const h = { Authorization: `Bearer ${token}` };
      const [p, s] = await Promise.all([
        fetch('/api/room/profile', { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/room/streak', { headers: h }).then((r) => r.json()).catch(() => null),
      ]);
      if (p.profile) setProfile(p.profile);
      if (s) setStreak(s.current);
    })();
  }, []);

  const name = String(profile?.name || user?.name || user?.email || 'Utente');
  const handle = profile?.handle as string | null;
  const avatar = !imgErr ? String((profile?.avatar_url as string) || (profile?.avatar as string) || user?.avatar || '') : '';

  return (
    <div className="room-sidebar flex flex-col h-full">
      <Link href={handle ? `/u/${handle}` : '/room/you?tab=profile'} className="flex items-center gap-3 px-2 py-4 hover:bg-room/5 rounded-xl transition-colors">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar da URL arbitrario
          <img src={avatar} alt={name} onError={() => setImgErr(true)} className="w-11 h-11 rounded-full object-cover border border-room/40 shrink-0" />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black shrink-0"
            style={{ background: avatarGradient(handle || name) }}
            aria-hidden
          >
            {initials(name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm text-white truncate">{name || '…'}</p>
          <p className="text-[11px] text-zinc-500 truncate">{handle ? `@${handle}` : 'Completa il profilo'}</p>
          {streak != null && (
            <p className="text-[11px] font-bold text-ember mt-0.5">🔥 {streak} giorni</p>
          )}
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto py-2" aria-label="Room">
        {LINKS.map((n) => {
          const active = (pathname || '') === n.match || (pathname || '').startsWith(`${n.match}/`);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold rounded-xl transition-all ${
                active
                  ? 'bg-room/10 text-room-bright border border-room/30'
                  : 'text-zinc-400 hover:text-white hover:bg-room/5 border border-transparent'
              }`}
            >
              <n.icon size={17} className={active ? 'text-room' : 'text-zinc-500'} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 pt-3">
        <p className="px-3 mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600">Account</p>
        <div className="flex items-center gap-1 rounded-xl p-1.5 hover:bg-room/5 transition-colors">
          <Link href="/room/you?tab=profile" className="flex flex-1 min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1" title="Gestisci account">
            <Settings size={17} className="text-zinc-500 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-zinc-200">Gestisci account</span>
              <span className="block truncate text-[11px] text-zinc-500">Profilo, privacy, dati</span>
            </span>
          </Link>
          <button
            onClick={logout}
            title="Esci"
            aria-label="Esci"
            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
