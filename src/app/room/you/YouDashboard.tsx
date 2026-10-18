'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { roomAuthHeaders } from '@/lib/auth-token';
import { Loader2, Flame, Coins, GitBranch, Rocket, MapPin, Pencil, Plus, Settings } from 'lucide-react';

type Profile = Record<string, unknown>;
type Startup = { id: string; name: string; domain: string | null; url: string | null; stage: string; logo_url: string | null; revenue_self_cents: number | null; tagline: string | null };
type Streak = { current: number; longest: number; todayDone: boolean; heatmap: string[] };
type GhDay = { day: string; count: number };

const card = 'bg-black border border-zinc-800 rounded-2xl p-4';
const kicker = 'text-[11px] font-mono font-black uppercase tracking-[0.16em] text-zinc-500';

function StatRow({ icon, label, hint, value, hintClass = 'text-room font-bold' }: {
  icon: React.ReactNode; label: string; hint?: string; value: React.ReactNode; hintClass?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 py-3 border-b border-zinc-900 last:border-0">
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-[13px] text-white">{label}</span>
        {hint && <span className={`block text-xs ${hintClass}`}>{hint}</span>}
      </span>
      <span className="font-extrabold text-white text-base shrink-0">{value}</span>
    </div>
  );
}

export default function YouDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [gh, setGh] = useState<GhDay[]>([]);
  const [verified, setVerified] = useState<Record<string, { mrr_cents: number; currency: string }>>({});
  const [source, setSource] = useState<'club' | 'github'>('club');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const h = await roomAuthHeaders();
      const [p, s, st, g, l] = await Promise.all([
        fetch('/api/room/profile', { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/room/streak', { headers: h }).then((r) => r.json()).catch(() => null),
        fetch('/api/room/startups', { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/room/github', { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/room/stripe/links', { headers: h }).then((r) => r.json()).catch(() => ({})),
      ]);
      setProfile(p.profile || null);
      setStreak(s);
      setStartups(st.startups || []);
      setGh(g.series || []);
      setVerified(l.verified || {});
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;

  const name = String(profile?.name || user?.name || user?.email || 'Tu');
  const handle = (profile?.handle as string) || null;
  const locality = String(profile?.locality || '');
  const bio = String(profile?.bio || '');
  const avatar = String(profile?.avatar_url || user?.avatar || '');

  const verifiedMrr = Object.values(verified).reduce((a, v) => a + (v?.mrr_cents || 0), 0);
  const selfMrr = startups.reduce((a, s) => a + (s.revenue_self_cents || 0), 0);
  const mrr = verifiedMrr || selfMrr;
  const ghYear = gh.reduce((a, d) => a + d.count, 0);

  const shipDays = new Set(streak?.heatmap || []);
  const ghDays = new Set(gh.filter((d) => d.count > 0).map((d) => d.day));
  const heatSource = source === 'club' ? shipDays : ghDays;

  // Calendario 12 mesi stilato come GitHub: colonne = settimane, righe = giorni (dal domenica)
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 370);
  start.setDate(start.getDate() - start.getDay()); // allinea a domenica
  const weeks: Array<Array<{ iso: string; active: boolean } | null>> = [];
  let week: Array<{ iso: string; active: boolean } | null> = [];
  const monthLabels: Array<{ month: string; span: number }> = [];
  let lastMonth = -1;
  const cursor = new Date(start);
  while (cursor <= today) {
    const iso = cursor.toISOString().slice(0, 10);
    const cell = { iso, active: heatSource.has(iso) };
    if (cursor.getDay() === 0 && lastMonth !== cursor.getMonth()) {
      if (week.length > 0) {
        weeks.push(week);
        const firstDay = week.find(Boolean);
        if (firstDay) monthLabels.push({ month: firstDay.iso.slice(5, 7), span: 0 });
      } else if (monthLabels.length === 0) {
        monthLabels.push({ month: iso.slice(5, 7), span: 0 });
      }
      lastMonth = cursor.getMonth();
      week = [];
    }
    week.push(cell);
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length > 0) {
    weeks.push(week);
    const firstDay = week.find(Boolean);
    if (firstDay) monthLabels.push({ month: firstDay.iso.slice(5, 7), span: 0 });
  }
  // Ricostruisci le etichette mese in base alle colonne effettive
  monthLabels.length = 0;
  weeks.forEach((w, i) => {
    const f = w.find(Boolean);
    if (!f) return;
    const m = f.iso.slice(5, 7);
    if (i === 0 || monthLabels[monthLabels.length - 1].month !== m) monthLabels.push({ month: m, span: i });
  });
  const MESE = ['', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  return (
    <div>
      <div className="flex items-start gap-3 mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-white flex-1">You</h1>
        <button onClick={() => router.replace('/room/settings', { scroll: false })} aria-label="Impostazioni"
          className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white hover:border-room transition-all">
          <Settings size={18} />
        </button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-5 items-start">
        {/* Colonna sinistra */}
        <div className="space-y-5">
          <section className={card} aria-label="Profilo">
            <div className="flex items-start gap-4">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar da URL arbitrario
                <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover border border-room/40 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-room/20 border border-room/40 flex items-center justify-center text-room font-black shrink-0" aria-hidden>
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-extrabold text-white text-lg leading-tight truncate">{name}</h2>
                    {handle && <p className="text-sm text-zinc-400">@{handle}</p>}
                    {locality && <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><MapPin size={12} /> {locality}</p>}
                  </div>
                  <Link href="/room/you?tab=profile" aria-label="Modifica profilo"
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-200 hover:border-room transition-all flex items-center gap-1.5 shrink-0">
                    <Pencil size={12} /> Edit
                  </Link>
                </div>
              </div>
            </div>
            {bio && <p className="text-sm text-zinc-300 mt-4">{bio}</p>}
          </section>

          <section className={`${card} !p-4`} aria-label="Numeri">
            <StatRow icon={<Flame size={20} className="text-orange-500" />} label="Current streak"
              hint={streak?.todayDone ? 'Keep it alive · oggi fatto ✓' : 'Keep it alive · oggi da fare'}
              value={streak?.current ?? 0} />
            <StatRow icon={<Coins size={20} className="text-yellow-500" />} label="Monthly revenue"
              hint={verifiedMrr > 0 ? 'MRR · verificato ✓' : 'MRR · unverified'}
              hintClass={verifiedMrr > 0 ? 'text-emerald-400 font-bold' : 'text-yellow-500 font-bold'}
              value={`€${(mrr / 100).toLocaleString('it-IT')}`} />
            <StatRow icon={<GitBranch size={20} className="text-emerald-400" />} label="Contributions · past year"
              hint="GitHub · pubblici" hintClass="text-emerald-400 font-bold" value={ghYear} />
            <StatRow icon={<Rocket size={20} className="text-room" />} label="Apps shipped" value={startups.length} />
          </section>
        </div>

        {/* Colonna destra */}
        <div className="space-y-5">
          <section className={card} aria-label="Le tue startup">
            <div className="flex items-center gap-3 mb-4">
              <h2 className={`${kicker} flex-1`}>Le tue startup</h2>
              <Link href="/room/you?tab=startup" aria-label="Aggiungi startup"
                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:border-room hover:text-white transition-all">
                <Plus size={16} />
              </Link>
            </div>
            <div className="flex items-baseline gap-3 pb-4 mb-2 border-b border-zinc-900">
              <span className="text-xl font-extrabold text-white">€{(mrr / 100).toLocaleString('it-IT')}</span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-zinc-900 border border-zinc-700 text-zinc-400">
                {verifiedMrr > 0 ? 'verified' : 'pre-rev'}
              </span>
              <span className="text-xs text-zinc-500">MRR vs last month</span>
            </div>
            {startups.length === 0 ? (
              <p className="text-sm text-zinc-500 py-3">Nessuna startup. <Link href="/room/you?tab=startup" className="text-room font-bold">Creane una →</Link></p>
            ) : (
              <ul>
                {startups.map((s) => (
                  <li key={s.id}>
                    <Link href="/room/you?tab=startup" className="flex items-center gap-3 py-3 border-b border-zinc-900 last:border-0 hover:opacity-80 transition-opacity">
                      {s.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- logo da URL arbitrario
                        <img src={s.logo_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-zinc-800 shrink-0" />
                      ) : (
                        <span className="w-9 h-9 rounded-lg bg-room/15 border border-room/30 flex items-center justify-center text-room font-black text-sm shrink-0">{s.name.slice(0, 1).toUpperCase()}</span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-white truncate">{s.name}</span>
                        <span className="block text-xs text-zinc-500 truncate">{s.domain || s.url || s.tagline || '—'}</span>
                      </span>
                      <span className="text-right shrink-0">
                        <span className="block font-extrabold text-white">€{((verified[s.id]?.mrr_cents || s.revenue_self_cents || 0) / 100).toLocaleString('it-IT')}</span>
                        <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-zinc-900 border border-zinc-700 text-zinc-400 mt-0.5">
                          {verified[s.id] ? 'verified' : s.stage}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-zinc-600 mt-3">Tocca una startup per modificarla.</p>
          </section>

          <section className={card} aria-label="Attività">
            <div className="flex items-center gap-3 mb-4">
              <h2 className={`${kicker} flex-1`}>Attività</h2>
              <div className="flex gap-1.5" role="tablist" aria-label="Sorgente attività">
                {(['club', 'github'] as const).map((k) => (
                  <button key={k} role="tab" aria-selected={source === k} onClick={() => setSource(k)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all capitalize ${source === k ? 'border-room bg-room/15 text-room-bright' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[640px]">
                {/* Etichette mese */}
                <div className="relative h-4 mb-1 ml-7">
                  {monthLabels.map((ml) => (
                    <span key={`${ml.month}-${ml.span}`} className="absolute top-0 text-[10px] text-zinc-500" style={{ left: `${ml.span}rem` }}>
                      {MESE[Number(ml.month)]}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  {/* Giorni settimana */}
                  <div className="flex flex-col gap-1 w-6 shrink-0 text-[10px] text-zinc-600 pr-1">
                    {['L', '', 'M', '', 'G', '', 'S'].map((d, i) => (
                      <span key={i} className="h-3 leading-3">{d}</span>
                    ))}
                  </div>
                  {/* Griglia settimane × giorni */}
                  <div className="flex gap-1" role="img" aria-label={`Mappa attività ultimi 12 mesi, sorgente ${source}`}>
                    {weeks.map((w, wi) => (
                      <div key={wi} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }).map((_, di) => {
                          const c = w[di];
                          if (!c) return <span key={di} className="w-3 h-3" />;
                          return (
                            <span key={di} title={`${c.iso}${c.active ? ' · attività' : ''}`}
                              className={`w-3 h-3 rounded-[3px] ${c.active ? 'bg-room' : 'bg-zinc-900'}`} />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-600 mt-3">
              <span>Less</span>
              <span className="w-3 h-3 rounded-[3px] bg-zinc-900" />
              <span className="w-3 h-3 rounded-[3px] bg-room/40" />
              <span className="w-3 h-3 rounded-[3px] bg-room/70" />
              <span className="w-3 h-3 rounded-[3px] bg-room" />
              <span>More</span>
              <span className="ml-auto">last 12 months</span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-2">
              {source === 'club' ? 'Contato dai task che segni — un quadrato al giorno.' : 'Contributi pubblici GitHub — solo conteggi, mai codice.'}
            </p>
          </section>

          <section className={card} aria-label="Contributions">
            <div className="flex items-center gap-3 mb-3">
              <h2 className={`${kicker} flex-1`}>Contribuzioni al club</h2>
              <span className="text-[11px] text-zinc-600">all-time</span>
            </div>
            <div className="flex items-center gap-3 py-2.5 border-b border-zinc-900 last:border-0">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <GitBranch size={15} />
              </span>
              <span className="flex-1 font-bold text-sm text-white">Risposte date</span>
              <span className="font-extrabold text-white">0</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
