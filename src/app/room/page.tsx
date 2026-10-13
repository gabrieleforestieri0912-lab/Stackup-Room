'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2, Flame, BookOpen, Trophy, Rocket, ArrowRight, Target, Clock } from 'lucide-react';

const RANKS = [
  { min: 0, title: 'Novizio' },
  { min: 100, title: 'Apprendista' },
  { min: 300, title: 'Sviluppatore' },
  { min: 600, title: 'Ingegnere' },
  { min: 1000, title: 'Senior' },
  { min: 1500, title: 'Architetto' },
  { min: 2200, title: 'Maestro' },
  { min: 3000, title: 'Leggenda' },
  { min: 4000, title: 'StackUp Elite' },
];

type Enrolled = { _id: string; title: string; slug: string; progress?: number; duration?: number };
type Cert = { id: string; courseTitle: string };

export default function RoomHome() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Enrolled[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [startupCount, setStartupCount] = useState(0);
  const [streak, setStreak] = useState<{ current: number; todayDone: boolean } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      const h = { Authorization: `Bearer ${token}` };
      const [c, ce, s, st, p] = await Promise.all([
        fetch('/api/courses/enrolled', { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/certificates', { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/room/startups', { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/room/streak', { headers: h }).then((r) => r.json()).catch(() => null),
        fetch('/api/room/profile', { headers: h }).then((r) => r.json()).catch(() => ({})),
      ]);
      if (c.success) setCourses(c.data || []);
      if (ce.success) setCerts(ce.data || []);
      setStartupCount((s.startups || []).length);
      if (st) setStreak(st);
      if (p.profile && !p.profile.onboarding_completed) router.push('/onboarding');
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !user || !ready) {
    return <div className="flex items-center justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-orange-500" /></div>;
  }

  const exp = user.exp || 0;
  const level = Math.floor(exp / 100) + 1;
  const rank = [...RANKS].reverse().find((r) => exp >= r.min) || RANKS[0];
  const expProgress = Math.min(100, ((exp - (level - 1) * 100) / 100) * 100);
  const firstName = user.name.split(' ')[0];

  const card = 'bg-black border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all';

  return (
    <div>
      <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Dashboard</p>
      <h1 className="text-3xl font-extrabold tracking-tight mb-1">Bentornato, {firstName}.</h1>
      <p className="text-sm text-zinc-400 mb-8">Livello {level} · {rank.title} · {exp} EXP</p>

      <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden mb-8" role="progressbar" aria-valuenow={Math.round(expProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso livello">
        <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{ width: `${expProgress}%` }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-black border border-zinc-800 rounded-2xl p-4">
          <Flame size={18} className="text-orange-400 mb-2" />
          <p className="text-2xl font-black text-white">{streak?.current ?? user.studyStreak ?? 0}</p>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">gg streak{streak && !streak.todayDone ? ' · oggi da fare' : ''}</p>
        </div>
        <Link href="/room/corsi" className="bg-black border border-zinc-800 rounded-2xl p-4 hover:border-orange-500/50">
          <BookOpen size={18} className="text-orange-400 mb-2" />
          <p className="text-2xl font-black text-white">{courses.length}</p>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Corsi</p>
        </Link>
        <Link href="/room/certificati" className="bg-black border border-zinc-800 rounded-2xl p-4 hover:border-orange-500/50">
          <Trophy size={18} className="text-yellow-400 mb-2" />
          <p className="text-2xl font-black text-white">{certs.length}</p>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Certificati</p>
        </Link>
        <Link href="/room/startups" className="bg-black border border-zinc-800 rounded-2xl p-4 hover:border-orange-500/50">
          <Rocket size={18} className="text-orange-400 mb-2" />
          <p className="text-2xl font-black text-white">{startupCount}</p>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Startup</p>
        </Link>
      </div>

      {courses.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">Continua a studiare</h2>
            <Link href="/room/corsi" className="text-xs font-bold text-orange-400 flex items-center gap-1">Tutti <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-2">
            {courses.slice(0, 2).map((c) => (
              <Link key={c._id} href={`/courses/${c.slug}`} className={`${card} !p-4 flex items-center gap-3`}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{c.title}</p>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${c.progress || 0}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-400 shrink-0">{c.progress || 0}%</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold text-white mb-3">La tua Room</h2>
        <div className="grid gap-3">
          {[
            { href: '/room/planner', title: 'Planner giornaliero', desc: 'Task, standup, time-blocking, obiettivi.', icon: Target },
            { href: '/room/tracker', title: 'Tracker', desc: 'Streak, GitHub, metriche custom.', icon: Flame },
            { href: '/room/community', title: 'Community', desc: 'Chat, forum, network, eventi.', icon: Clock },
            { href: '/room/coach', title: 'Coach AI', desc: 'Standup, day plan, advisor.', icon: BookOpen },
          ].map((c) => (
            <Link key={c.href} href={c.href} className={`${card} !p-4 flex items-center gap-3`}>
              <c.icon size={18} className="text-orange-400 shrink-0" />
              <span>
                <span className="block font-bold text-sm text-white">{c.title}</span>
                <span className="block text-xs text-zinc-500">{c.desc}</span>
              </span>
              <ArrowRight size={16} className="ml-auto text-zinc-600 shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
