'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { roomAuthHeaders } from '@/lib/auth-token';
import { Loader2, Plus, Trash2, Flame, Check, Sparkles, X, Users, Lock } from 'lucide-react';
import { roomInput as input } from '../ui';

type Startup = { id: string; name: string };
type Task = { id: string; title: string; priority: string; status: string; due_date: string | null };
type Block = { id: string; start_time: string; end_time: string; label: string };

const today = () => new Date().toISOString().slice(0, 10);
const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const localISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function TodayPage() {
  const { user } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [sid, setSid] = useState('');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [standup, setStandup] = useState({ done: '', todo: '', blockers: '' });
  const [standupOpen, setStandupOpen] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [streak, setStreak] = useState<{ current: number; longest: number; todayDone: boolean; heatmap: string[] } | null>(null);

  // Nota una tantum: giornata e chiusura decise una sola volta (niente re-render)
  const [note] = useState(() => {
    let dismissed = false;
    let day = 1;
    if (typeof window !== 'undefined') {
      try {
        dismissed = localStorage.getItem('room-day-note') === 'gone';
        const first = localStorage.getItem('room-first-seen');
        if (!first) localStorage.setItem('room-first-seen', new Date().toISOString());
        else day = Math.floor((Date.now() - new Date(first).getTime()) / 86400000) + 1;
      } catch { /* storage non disponibile */ }
    }
    return { dismissed, day };
  });
  const [noteOpen, setNoteOpen] = useState(!note.dismissed);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/room/startups', { headers: await roomAuthHeaders() });
      const list: Startup[] = r.ok ? await r.json().then((d) => d.startups) : [];
      setStartups(list);
      if (list[0]) setSid(list[0].id);
      const s = await fetch('/api/room/streak', { headers: await roomAuthHeaders() });
      if (s.ok) setStreak(await s.json());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!sid) return;
    (async () => {
      const h = await roomAuthHeaders();
      const [t, b] = await Promise.all([
        fetch(`/api/room/tasks?startup_id=${sid}`, { headers: h }).then((r) => r.json()),
        fetch(`/api/room/blocks?day=${today()}`, { headers: h }).then((r) => r.json()),
      ]);
      setTasks(t.tasks || []);
      setBlocks(b.blocks || []);
      const su = await fetch(`/api/room/standups?startup_id=${sid}&day=${today()}`, { headers: h }).then((r) => r.json());
      if (su.standups?.[0]) {
        const s0 = su.standups[0];
        setStandup({ done: s0.done || '', todo: s0.todo || '', blockers: s0.blockers || '' });
      } else {
        setStandup({ done: '', todo: '', blockers: '' });
      }
    })();
  }, [sid]);

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;
  if (startups.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
        <p className="font-bold text-white">Crea prima una startup.</p>
        <a href="/room/you?tab=startup" className="text-sm text-room font-bold">Vai alle startup →</a>
      </div>
    );
  }

  const dismissNote = () => {
    setNoteOpen(false);
    try { localStorage.setItem('room-day-note', 'gone'); } catch { /* ignore */ }
  };

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const r = await fetch('/api/room/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ startup_id: sid, title: newTask }),
    });
    if (r.ok) { const t = await r.json().then((d) => d.task); setTasks((p) => [...p, t]); setNewTask(''); }
  };

  const setTaskStatus = async (id: string, status: string) => {
    const r = await fetch(`/api/room/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      const t = await r.json().then((d) => d.task);
      setTasks((p) => p.map((x) => (x.id === id ? t : x)));
      const s = await fetch('/api/room/streak', { headers: await roomAuthHeaders() });
      if (s.ok) setStreak(await s.json());
    }
  };

  const saveStandup = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/room/standups', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ startup_id: sid, day: today(), ...standup }),
    });
    setStandupOpen(false);
    const s = await fetch('/api/room/streak', { headers: await roomAuthHeaders() });
    if (s.ok) setStreak(await s.json());
  };

  // Saluto in base all'ora
  const h = new Date().getHours();
  const greeting = h < 5 ? 'Buonanotte' : h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const firstName = (user?.name || '').trim().split(' ')[0] || 'founder';

  // Settimana corrente (lunedì → domenica) per i pallini della streak
  const heat = new Set(streak?.heatmap || []);
  const nowD = new Date();
  const todayIdx = (nowD.getDay() + 6) % 7; // 0 = lunedì
  const monday = new Date(nowD);
  monday.setDate(nowD.getDate() - todayIdx);
  const week = WEEK.map((l, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { l, on: heat.has(localISO(d)), future: i > todayIdx };
  });

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const standupSaved = Boolean(standup.done || standup.todo || standup.blockers);
  const noteTitle = note.day <= 1
    ? 'Primo giorno. Inizia a shippare.'
    : note.day === 2
      ? 'Due giorni sulle spalle. Stai shippando.'
      : `Giorno ${note.day}. Stai shippando.`;

  const ta = `${input} !py-2.5`;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Testata: saluto + avatar */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex-1">
          {greeting}, {firstName}.
        </h1>
        <Link href="/room/you" aria-label="Vai al tuo profilo" className="shrink-0">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar da URL arbitrario
            <img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-zinc-700 hover:border-room transition-colors" />
          ) : (
            <span className="w-11 h-11 rounded-full bg-room/20 border-2 border-zinc-700 flex items-center justify-center text-room font-black text-sm">
              {firstName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </Link>
      </div>

      {/* Nota una tantum */}
      {noteOpen && (
        <section aria-label="Nota del giorno" className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-5 pr-12">
          <button onClick={dismissNote} aria-label="Chiudi nota" title="Chiudi"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-zinc-900 transition-colors">
            <X size={16} />
          </button>
          <p className="text-[11px] font-mono font-black uppercase tracking-[0.18em] text-zinc-500 flex items-center gap-2 mb-3">
            <Users size={14} className="text-room" aria-hidden /> Giorno {note.day} · Nota una tantum
          </p>
          <h2 className="text-lg font-extrabold text-white">{noteTitle}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed mt-1.5">
            È l&apos;abitudine su cui nasce la Room — una room a pagamento di founder solitari con ranking verificati,
            coaching giornaliero e feedback reali su ciò che shippi. Un&apos;occhiata e questa card sparisce per sempre.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <a href="/room/community" onClick={dismissNote}
              className="flex-1 py-3.5 bg-zinc-900 border border-zinc-700 hover:border-room text-white font-bold rounded-xl transition-all text-center">
              Scopri cosa c&apos;è dentro
            </a>
            <button onClick={dismissNote} className="px-5 py-3 text-zinc-500 hover:text-zinc-300 font-bold text-sm transition-colors">
              Non ora
            </button>
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Colonna sinistra: standup, streak, task */}
        <div className="space-y-5">
          {/* Daily standup */}
          <section id="standup" className="scroll-mt-20 bg-teal-500/5 border border-teal-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-teal-400" aria-hidden />
              <p className="text-[11px] font-mono font-black uppercase tracking-[0.18em] text-teal-400">Standup quotidiano</p>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Ieri, oggi, blocchi — tre note veloci, trasformate in una task list actionable per la giornata.
            </p>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
              <Lock size={12} aria-hidden /> Il feedback del Coach sulle tue note è una funzione per membri.
            </p>
            <button onClick={() => setStandupOpen(!standupOpen)}
              className="w-full mt-4 py-3.5 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl transition-colors">
              {standupOpen ? 'Chiudi standup' : standupSaved ? 'Modifica standup' : 'Inizia standup'}
            </button>
            {standupOpen && (
              <form onSubmit={saveStandup} className="mt-4 space-y-2">
                <textarea aria-label="Fatto" rows={2} className={ta} placeholder="Fatto ieri/oggi" value={standup.done} onChange={(e) => setStandup({ ...standup, done: e.target.value })} maxLength={2000} />
                <textarea aria-label="Da fare" rows={2} className={ta} placeholder="Da fare oggi" value={standup.todo} onChange={(e) => setStandup({ ...standup, todo: e.target.value })} maxLength={2000} />
                <textarea aria-label="Blocchi" rows={2} className={ta} placeholder="Blocchi" value={standup.blockers} onChange={(e) => setStandup({ ...standup, blockers: e.target.value })} maxLength={2000} />
                <button className="w-full py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room transition-all">Salva standup</button>
              </form>
            )}
          </section>

          {/* Streak */}
          <section className="bg-orange-500/5 border border-orange-500/30 rounded-2xl p-5" aria-label="Streak">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${streak?.todayDone ? 'bg-ember text-[#0B0D12]' : 'bg-orange-500/20 text-orange-400'}`}>
                <Flame size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xl font-extrabold text-orange-400">{streak?.current ?? 0} giorni</p>
                <p className="text-xs text-zinc-500">
                  {streak?.todayDone ? 'Shippato oggi ✓ · torna domani' : 'Completa un task per iniziare la streak'}
                </p>
              </div>
              <div className="text-right shrink-0" aria-label="Ultimi 7 giorni">
                <div className="flex gap-1.5 justify-end mb-1.5">
                  {week.map((d, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${d.on ? 'bg-orange-400' : d.future ? 'bg-zinc-800' : 'bg-zinc-700'}`} />
                  ))}
                </div>
                <div className="flex gap-1.5 text-[9px] font-bold text-zinc-600">
                  {week.map((d, i) => <span key={i} className="w-2 text-center">{d.l}</span>)}
                </div>
              </div>
            </div>
          </section>

          {/* Task di oggi */}
          <section id="task" className="scroll-mt-20 bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[11px] font-mono font-black uppercase tracking-[0.18em] text-zinc-500 flex-1">Task di oggi</p>
              <span className="text-xs font-mono font-bold text-zinc-400">{doneCount}/{tasks.length}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-4" role="progressbar"
              aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={Math.max(tasks.length, 1)} aria-label="Task completati">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-zinc-500 mb-3">Nessun task in lista. Cosa shippi oggi?</p>
            ) : (
              <ul className="space-y-1.5 mb-3">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2.5 text-sm group">
                    <button onClick={() => setTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')}
                      aria-label={t.status === 'done' ? 'Riapri task' : 'Completa task'}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${t.status === 'done' ? 'bg-teal-500 border-teal-500 text-black' : 'border-zinc-600 text-transparent hover:border-zinc-400'}`}>
                      <Check size={12} />
                    </button>
                    <span className={`flex-1 truncate ${t.status === 'done' ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>{t.title}</span>
                    <button onClick={async () => {
                      await fetch(`/api/room/tasks/${t.id}`, { method: 'DELETE', headers: await roomAuthHeaders() });
                      setTasks((p) => p.filter((x) => x.id !== t.id));
                    }} aria-label="Elimina task"
                      className="p-1.5 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addTask} className="flex gap-2">
              <input aria-label="Nuovo task" className={`${input} flex-1`} value={newTask} onChange={(e) => setNewTask(e.target.value)}
                placeholder="Aggiungi qualcosa da shippare oggi..." maxLength={200} />
              <button aria-label="Aggiungi task"
                className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white hover:border-room transition-all shrink-0">
                <Plus size={18} />
              </button>
            </form>
          </section>
        </div>

        {/* Colonna destra: schedule di oggi */}
        <section aria-label="Schedule di oggi" className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <p className="text-[11px] font-mono font-black uppercase tracking-[0.18em] text-zinc-500 mb-3">Piano di oggi</p>
          {blocks.length === 0 ? (
            <>
              <h2 className="text-lg font-extrabold text-white">Nessun piano per oggi</h2>
              <p className="text-sm text-zinc-500 mt-1.5 mb-4">
                Lascia che il coach trasformi i tuoi task in uno schedule reale, oppure costruiscilo a mano in «Il mio piano».
              </p>
              <a href="/room/coach?plan=1"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-zinc-900 border border-zinc-700 hover:border-room text-white font-bold rounded-xl transition-all">
                ✨ Pianifica la mia giornata con il Coach
              </a>
            </>
          ) : (
            <>
              <ul className="space-y-2 mb-3">
                {blocks.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5">
                    <span className="font-mono text-xs text-room shrink-0">{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</span>
                    <span className="flex-1 truncate text-sm text-zinc-200">{b.label || '—'}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <a href="/room/coach?plan=1"
                  className="flex-1 py-3 bg-zinc-900 border border-zinc-700 hover:border-room text-white text-sm font-bold rounded-xl transition-all text-center">
                  ✨ Riallaccia con il Coach
                </a>
                <Link href="/room/myplan"
                  className="px-4 py-3 border border-zinc-800 hover:border-room text-zinc-400 text-sm font-bold rounded-xl transition-all text-center whitespace-nowrap">
                  Il mio piano
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
