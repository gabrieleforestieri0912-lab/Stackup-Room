'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import { Flame, BookOpen, Trophy, Rocket, ArrowRight, Target, Sparkles, BarChart3, MessageSquare, MessagesSquare } from 'lucide-react';
import { RoomLoader, RoomHeader, RoomCard, StatCard } from './ui';

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

  if (loading || !user || !ready) return <RoomLoader />;

  const exp = user.exp || 0;
  const level = Math.floor(exp / 100) + 1;
  const rank = [...RANKS].reverse().find((r) => exp >= r.min) || RANKS[0];
  const expProgress = Math.min(100, ((exp - (level - 1) * 100) / 100) * 100);
  const firstName = user.name.split(' ')[0];
  const todayDone = streak?.todayDone ?? false;

  return (
    <div>
      <RoomHeader
        eyebrow="Dashboard"
        title={<>Bentornato, {firstName}.</>}
        sub={`Livello ${level} · ${rank.title} · ${exp} EXP`}
      />

      {/* Momentum giornaliero — stile Startup Club: streak + azione di oggi */}
      <RoomCard className="mb-6 border-room/25 bg-gradient-to-br from-room/10 via-transparent to-transparent">
        <div className="flex flex-wrap items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${todayDone ? 'bg-room text-[#0B0D12]' : 'bg-zinc-900 text-zinc-500'}`}>
            <Flame size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-white">
              {streak?.current ?? user.studyStreak ?? 0} giorni di streak{' '}
              <span className="text-zinc-500 font-bold">· {todayDone ? 'obiettivo di oggi completato ✓' : 'obiettivo di oggi da fare'}</span>
            </p>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden mt-2" role="progressbar" aria-valuenow={Math.round(expProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso livello">
              <div className="h-full bg-gradient-to-r from-room-deep to-room rounded-full" style={{ width: `${expProgress}%` }} />
            </div>
          </div>
          <Link href="/room/planner" className="px-5 py-2.5 bg-room text-[#0B0D12] text-sm font-bold rounded-xl hover:bg-room-bright transition-colors shrink-0">
            {todayDone ? 'Apri planner' : 'Shippa oggi →'}
          </Link>
        </div>
      </RoomCard>

      {/* Statistiche */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Flame} value={streak?.current ?? user.studyStreak ?? 0} label={`gg streak${streak && !streak.todayDone ? ' · oggi da fare' : ''}`} accent="ember" />
        <StatCard icon={BookOpen} value={courses.length} label="Corsi" href="/room/corsi" />
        <StatCard icon={Trophy} value={certs.length} label="Certificati" href="/room/certificati" accent="gold" />
        <StatCard icon={Rocket} value={startupCount} label="Startup" href="/room/startups" />
      </div>

      {courses.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">Continua a studiare</h2>
            <Link href="/room/corsi" className="text-xs font-bold text-room flex items-center gap-1 hover:text-room-bright">Tutti <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-2">
            {courses.slice(0, 2).map((c) => (
              <Link key={c._id} href={`/courses/${c.slug}`} className="bg-room-bg border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 hover:border-room/40 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{c.title}</p>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-room rounded-full" style={{ width: `${c.progress || 0}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-zinc-400 shrink-0">{c.progress || 0}%</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* La tua Room — stessa IA della sidebar */}
      {[
        {
          group: 'You',
          items: [
            { href: '/room/tracker', title: 'Stats', desc: 'Streak, GitHub, metriche custom.', icon: BarChart3 },
            { href: '/room/startups', title: 'Your Startup', desc: 'Portfolio, metriche, verifiche.', icon: Rocket },
            { href: '/room/notifiche', title: 'Activity', desc: 'Le tue notifiche e menzioni.', icon: MessageSquare },
            { href: '/room/verifiche', title: 'Contributions', desc: 'Fonti verificate per i rank.', icon: Trophy },
          ],
        },
        {
          group: 'Room',
          items: [
            { href: '/room/community?tab=chat', title: 'Chat', desc: 'La chat del club, ultimi 7 giorni.', icon: MessageSquare },
            { href: '/room/community?tab=forum', title: 'Rooms', desc: 'Stanze di discussione per topic.', icon: MessagesSquare },
            { href: '/room/leaderboard', title: 'Ranks', desc: 'Leaderboard verificate del club.', icon: Trophy },
            { href: '/room/community?tab=network', title: 'Network', desc: 'Bacheca offerte e richieste.', icon: BarChart3 },
            { href: '/room/community?tab=eventi', title: 'Events', desc: 'Eventi e ritrovi del club.', icon: Rocket },
          ],
        },
        {
          group: 'Today',
          items: [
            { href: '/room/planner#task', title: 'Tasks', desc: 'I task di oggi, per startup.', icon: Target },
            { href: '/room/planner#standup', title: 'Daily Standup', desc: 'Fatto, da fare, blocchi.', icon: Flame },
            { href: '/room/planner#schedule', title: 'Schedule', desc: 'Time-blocking della giornata.', icon: BookOpen },
          ],
        },
        {
          group: 'Coach',
          items: [
            { href: '/room/coach', title: 'Coach AI', desc: 'Standup, day plan, advisor.', icon: Sparkles },
          ],
        },
      ].map((s) => (
        <section key={s.group} className="mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600 mb-2">{s.group}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.items.map((c) => (
              <Link key={c.href + c.title} href={c.href} className="bg-room-bg border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 hover:border-room/40 transition-all">
                <c.icon size={18} className="text-room shrink-0" />
                <span className="min-w-0">
                  <span className="block font-bold text-sm text-white">{c.title}</span>
                  <span className="block text-xs text-zinc-500 truncate">{c.desc}</span>
                </span>
                <ArrowRight size={16} className="ml-auto text-zinc-600 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
