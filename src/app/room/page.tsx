'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2 } from 'lucide-react';

export default function RoomHome() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch('/api/room/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data.profile);
      if (data.profile && !data.profile.onboarding_completed) router.push('/onboarding');
    })();
  }, [router]);

  if (loading || !user) {
    return <div className="flex items-center justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-orange-500" /></div>;
  }

  const cards = [
    { href: '/room/community', title: 'Community', desc: 'Chat, forum, network, eventi tra founder.' },
    { href: '/room/coach', title: 'Coach AI', desc: 'Standup, day plan, advisor, ask-the-club. Con consenso.' },
    { href: '/room/planner', title: 'Planner giornaliero', desc: 'Task, standup, time-blocking, obiettivi. Solo tuoi.' },
    { href: '/room/startups', title: 'Portfolio startup', desc: 'Nome, link, stadio, revenue dichiarata.' },
    { href: '/room/leaderboard', title: 'Classifiche verificate', desc: 'Revenue e streak: settimana, mese, sempre.' },
    { href: '/room/verifiche', title: 'Verifiche', desc: 'Collega Stripe (sola lettura) e GitHub.' },
    { href: '/room/settings', title: 'Profilo founder', desc: 'Handle, bio, GitHub, anonymous mode.' },
  ];

  return (
    <div>
      <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">La Room</p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Ciao, {String(profile?.name || user.name)}.</h1>
      <p className="text-sm text-zinc-400 mb-8">Scegli una startup e pianifica la giornata. Completare task, standup o obiettivi alimenta lo streak.</p>
      <div className="grid gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="bg-black border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all">
            <h2 className="font-bold text-white">{c.title}</h2>
            <p className="text-sm text-zinc-400 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
      {profile && !(profile as { handle?: string }).handle && (
        <p className="mt-6 text-xs text-orange-300 font-bold">Suggerimento: imposta il tuo handle nelle Impostazioni per avere un profilo pubblico.</p>
      )}
    </div>
  );
}
