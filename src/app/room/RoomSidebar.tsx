'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import {
  LayoutDashboard, CalendarCheck, Rocket, BookOpen, Trophy, Users, Sparkles,
  Bell, Flame, BarChart3, BadgeCheck, MessageSquare, Settings, LogOut, Globe,
} from 'lucide-react';

const NAV = [
  { href: '/room', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/room/planner', label: 'Planner', icon: CalendarCheck },
  { href: '/room/tracker', label: 'Tracker', icon: Flame },
  { href: '/room/startups', label: 'Startup', icon: Rocket },
  { href: '/room/leaderboard', label: 'Classifiche', icon: BarChart3 },
  { href: '/room/verifiche', label: 'Verifiche', icon: BadgeCheck },
  { href: '/room/community', label: 'Community', icon: Users },
  { href: '/room/coach', label: 'Coach AI', icon: Sparkles },
  { href: '/room/corsi', label: 'Corsi', icon: BookOpen },
  { href: '/room/certificati', label: 'Certificati', icon: Trophy },
  { href: '/room/notifiche', label: 'Notifiche', icon: Bell },
  { href: '/room/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/room/settings', label: 'Impostazioni', icon: Settings },
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

  const name = String(profile?.name || user?.name || '');
  const handle = profile?.handle as string | null;
  const avatar = !imgErr ? String((profile?.avatar_url as string) || (profile?.avatar as string) || user?.avatar || '') : '';

  return (
    <div className="flex flex-col h-full">
      <Link href={handle ? `/u/${handle}` : '/room/settings'} className="flex items-center gap-3 px-2 py-4 hover:bg-zinc-900/60 rounded-xl transition-colors">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar da URL arbitrario
          <img src={avatar} alt={name} onError={() => setImgErr(true)} className="w-11 h-11 rounded-full object-cover border border-orange-400/30 shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-black shrink-0" aria-hidden>
            {name.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-sm text-white truncate">{name || '…'}</p>
          <p className="text-[11px] text-zinc-500 truncate">{handle ? `@${handle}` : 'Completa il profilo'}</p>
          {streak != null && (
            <p className="text-[11px] font-bold text-orange-300 mt-0.5">🔥 {streak} giorni</p>
          )}
        </div>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto py-2" aria-label="Room">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.href : pathname === n.href || (pathname || '').startsWith(`${n.href}/`);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold rounded-xl transition-all ${
                active
                  ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <n.icon size={17} className={active ? 'text-orange-400' : 'text-zinc-500'} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 pt-2 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-zinc-500 hover:text-white rounded-xl">
          <Globe size={17} /> Sito
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-red-400 hover:bg-red-500/10 rounded-xl">
          <LogOut size={17} /> Esci
        </button>
      </div>
    </div>
  );
}
