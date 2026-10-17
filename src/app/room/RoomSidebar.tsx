'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import { User, CalendarClock, Users, Sparkles, Settings, Mail, Lightbulb, Rocket } from 'lucide-react';
import { initials, avatarGradient } from '@/lib/avatar';

const LINKS = [
  { href: '/room/planner', label: 'Today', icon: CalendarClock, match: '/room/planner' },
  { href: '/room/community', label: 'Club', icon: Users, match: '/room/community' },
  { href: '/room/coach', label: 'Coach', icon: Sparkles, match: '/room/coach' },
  { href: '/room/you', label: 'You', icon: User, match: '/room/you' },
];

const SUPPORT = [
  { href: 'mailto:hello@stackup.dev', label: 'Email us', icon: Mail },
  { href: 'https://github.com/gabrieleforestieri0912-lab/Stackup-Room/issues/new?label=feature', label: 'Request a feature', icon: Lightbulb, external: true },
  { href: 'https://github.com/gabrieleforestieri0912-lab/Stackup-Room/issues/new?label=bug', label: 'Report a bug', icon: Rocket, external: true },
];

export default function RoomSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      const p = await fetch('/api/room/profile', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => ({}));
      if (p.profile) setProfile(p.profile);
    })();
  }, []);

  const name = String(profile?.name || user?.name || user?.email || 'Utente');
  const handle = profile?.handle as string | null;
  const avatar = !imgErr ? String((profile?.avatar_url as string) || (profile?.avatar as string) || user?.avatar || '') : '';

  return (
    <div className="room-sidebar flex flex-col h-full">
      {/* Logo */}
      <Link href="/room" className="flex items-center gap-3 px-2 py-4 mb-1">
        <span className="w-9 h-9 rounded-xl bg-room/15 border border-room/30 flex items-center justify-center shrink-0" aria-hidden>
          <Rocket size={18} className="text-room" />
        </span>
        <span className="font-extrabold text-white tracking-tight">Startup Club</span>
      </Link>
      <div className="border-t border-zinc-900 mx-1 mb-3" />

      {/* Nav principale */}
      <nav className="space-y-1 overflow-y-auto" aria-label="Room">
        {LINKS.map((n) => {
          const active = (pathname || '') === n.match || (pathname || '').startsWith(`${n.match}/`);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3.5 px-3 py-2.5 text-[15px] font-bold rounded-xl transition-all ${
                active
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <n.icon size={18} className={active ? 'text-room' : 'text-zinc-500'} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Support */}
      <div className="border-t border-zinc-900 pt-3 mt-3">
        <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600">Support</p>
        <nav className="space-y-0.5" aria-label="Support">
          {SUPPORT.map((s) => (
            <a
              key={s.href}
              href={s.href}
              {...(s.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="flex items-center gap-3.5 px-3 py-2 text-[14px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-900/60 rounded-xl transition-all"
            >
              <s.icon size={17} className="text-zinc-500" />
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Utente in basso */}
      <div className="border-t border-zinc-900 mt-3 pt-3 flex items-center gap-2.5 px-2">
        <Link href={handle ? `/u/${handle}` : '/room/you?tab=profile'} className="flex items-center gap-2.5 flex-1 min-w-0 py-1" title="Profilo">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar da URL arbitrario
            <img src={avatar} alt={name} onError={() => setImgErr(true)} className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0" />
          ) : (
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0" style={{ background: avatarGradient(handle || name) }} aria-hidden>
              {initials(name)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-bold text-white">{name}</span>
            <span className="block truncate text-[11px] text-zinc-500">{handle ? `@${handle}` : 'Builder — free'}</span>
          </span>
        </Link>
        <Link href="/room/you?tab=profile" aria-label="Impostazioni" title="Impostazioni"
          className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900/60 transition-colors shrink-0">
          <Settings size={16} />
        </Link>
      </div>
    </div>
  );
}
