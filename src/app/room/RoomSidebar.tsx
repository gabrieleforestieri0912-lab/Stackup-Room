'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import {
  User, BarChart3, Rocket, Activity, BadgeCheck,
  MessageSquare, MessagesSquare, Trophy, Users, CalendarDays,
  Sparkles, CalendarClock, ListChecks, Sunrise,
  LogOut, Settings,
} from 'lucide-react';

type Item = { href: string; label: string; icon: typeof User; match: { path: string; tab?: string; hash?: string } };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Today',
    items: [
      { href: '/room/planner#schedule', label: 'Schedule', icon: CalendarClock, match: { path: '/room/planner', hash: '#schedule' } },
      { href: '/room/planner#task', label: 'Tasks', icon: ListChecks, match: { path: '/room/planner', hash: '#task' } },
      { href: '/room/planner#standup', label: 'Daily Standup', icon: Sunrise, match: { path: '/room/planner', hash: '#standup' } },
    ],
  },
  {
    title: 'You',
    items: [
      { href: '/room/settings', label: 'Profile', icon: User, match: { path: '/room/settings' } },
      { href: '/room/tracker', label: 'Stats', icon: BarChart3, match: { path: '/room/tracker' } },
      { href: '/room/startups', label: 'Your Startup', icon: Rocket, match: { path: '/room/startups' } },
      { href: '/room/notifiche', label: 'Activity', icon: Activity, match: { path: '/room/notifiche' } },
      { href: '/room/verifiche', label: 'Contributions', icon: BadgeCheck, match: { path: '/room/verifiche' } },
    ],
  },
  {
    title: 'Room',
    items: [
      { href: '/room/community?tab=chat', label: 'Chat', icon: MessageSquare, match: { path: '/room/community', tab: 'chat' } },
      { href: '/room/community?tab=forum', label: 'Rooms', icon: MessagesSquare, match: { path: '/room/community', tab: 'forum' } },
      { href: '/room/leaderboard', label: 'Ranks', icon: Trophy, match: { path: '/room/leaderboard' } },
      { href: '/room/community?tab=network', label: 'Network', icon: Users, match: { path: '/room/community', tab: 'network' } },
      { href: '/room/community?tab=eventi', label: 'Events', icon: CalendarDays, match: { path: '/room/community', tab: 'eventi' } },
    ],
  },
  {
    title: 'Coach',
    items: [
      { href: '/room/coach', label: 'Coach AI', icon: Sparkles, match: { path: '/room/coach' } },
    ],
  },
];

export default function RoomSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

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
  const activeTab = searchParams?.get('tab') || 'chat';

  const isActive = (m: Item['match']) => {
    if ((pathname || '') !== m.path) return false;
    if (m.tab) return activeTab === m.tab;
    if (m.hash) return (hash || '#task') === m.hash;
    return true;
  };

  return (
    <div className="room-sidebar flex flex-col h-full">
      <Link href={handle ? `/u/${handle}` : '/room/settings'} className="flex items-center gap-3 px-2 py-4 hover:bg-room/5 rounded-xl transition-colors">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar da URL arbitrario
          <img src={avatar} alt={name} onError={() => setImgErr(true)} className="w-11 h-11 rounded-full object-cover border border-room/40 shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-room to-room-deep flex items-center justify-center text-[#0B0D12] font-black shrink-0" aria-hidden>
            {name.charAt(0).toUpperCase() || 'U'}
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

      <nav className="flex-1 space-y-4 overflow-y-auto py-2" aria-label="Room">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="px-3 mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600">{g.title}</p>
            <div className="space-y-1">
              {g.items.map((n) => {
                const active = isActive(n.match);
                return (
                  <Link
                    key={n.label}
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
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-800 pt-3">
        <p className="px-3 mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600">Account</p>
        <div className="flex items-center gap-1 rounded-xl p-1.5 hover:bg-room/5 transition-colors">
          <Link href="/room/settings" className="flex flex-1 min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1" title="Gestisci account">
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
