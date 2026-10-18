'use client';

import { useEffect, useState, FormEvent } from 'react';
import { roomAuthHeaders } from '@/lib/auth-token';
import { Loader2, Plus, Trash2, Flame, Check } from 'lucide-react';
import { roomInput as input } from '../ui';

type Startup = { id: string; name: string };
type Task = { id: string; title: string; priority: string; status: string; due_date: string | null };
type Block = { id: string; start_time: string; end_time: string; label: string };
type Goal = { id: string; title: string; status: string; proof_url: string | null; proof_note: string | null; screenshot_path?: string | null };

const today = () => new Date().toISOString().slice(0, 10);

export default function MyPlanPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [sid, setSid] = useState('');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [standup, setStandup] = useState({ done: '', todo: '', blockers: '' });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [newBlock, setNewBlock] = useState({ start: '09:00', end: '10:00', label: '' });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [streak, setStreak] = useState<{ current: number; longest: number; todayDone: boolean; heatmap: string[] } | null>(null);
  // Apertura automatica del form blocchi quando si arriva da ?plan=1
  const [addBlockOpen, setAddBlockOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('plan') === '1') { window.history.replaceState({}, '', '/room/myplan'); return true; }
    }
    return false;
  });
  const [addGoalOpen, setAddGoalOpen] = useState(false);

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
      const [t, b, g] = await Promise.all([
        fetch(`/api/room/tasks?startup_id=${sid}`, { headers: h }).then((r) => r.json()),
        fetch(`/api/room/blocks?day=${today()}`, { headers: h }).then((r) => r.json()),
        fetch(`/api/room/goals?startup_id=${sid}`, { headers: h }).then((r) => r.json()),
      ]);
      setTasks(t.tasks || []);
      setBlocks(b.blocks || []);
      setGoals(g.goals || []);
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
    const s = await fetch('/api/room/streak', { headers: await roomAuthHeaders() });
    if (s.ok) setStreak(await s.json());
  };

  const addBlock = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/room/blocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ day: today(), start_time: newBlock.start, end_time: newBlock.end, label: newBlock.label, startup_id: sid }),
    });
    if (r.ok) { const b = await r.json().then((d) => d.block); setBlocks((p) => [...p, b].sort((a, c) => a.start_time.localeCompare(c.start_time))); }
  };

  const addGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    const r = await fetch('/api/room/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ startup_id: sid, title: newGoal }),
    });
    if (r.ok) { const g = await r.json().then((d) => d.goal); setGoals((p) => [g, ...p]); setNewGoal(''); }
  };

  const section = 'bg-black border border-zinc-800 rounded-2xl p-4';
  const h2 = 'font-bold text-white mb-3';
  const kicker = 'text-[11px] font-mono font-black uppercase tracking-[0.18em] text-zinc-500';

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) window.history.back(); else window.location.href = '/room/planner'; }}
          aria-label="Indietro" title="Indietro"
          className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:border-room hover:text-white transition-all">
          ←
        </button>
        <h1 className="text-xl font-extrabold tracking-tight text-white flex-1">My Plan</h1>
        <select aria-label="Startup attiva" className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 max-w-[160px]" value={sid} onChange={(e) => setSid(e.target.value)}>
          {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Oggi */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5" aria-label="Schedule di oggi">
        <p className={`${kicker} mb-3`}>Today&apos;s schedule</p>
        {blocks.length === 0 ? (
          <>
            <h2 className="text-lg font-extrabold text-white">Nessun piano per oggi</h2>
            <p className="text-sm text-zinc-500 mt-1.5 mb-4">
              Lascia che il coach trasformi i tuoi task in uno schedule reale, oppure costruiscilo a mano in My Plan.
            </p>
            <a href="/room/coach?plan=1" className="w-full flex items-center justify-center gap-2 py-3.5 bg-zinc-900 border border-zinc-700 hover:border-room text-white font-bold rounded-xl transition-all">
              ✨ Pianifica la mia giornata con il Coach
            </a>
          </>
        ) : (
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center gap-3 bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5">
                <span className="font-mono text-xs text-room shrink-0">{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</span>
                <span className="flex-1 truncate text-sm text-zinc-200">{b.label || '—'}</span>
                <button onClick={async () => {
                  await fetch(`/api/room/blocks/${b.id}`, { method: 'DELETE', headers: await roomAuthHeaders() });
                  setBlocks((p) => p.filter((x) => x.id !== b.id));
                }} aria-label="Elimina blocco" className="p-1.5 text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
              </li>
            ))}
            <li>
              <a href="/room/coach?plan=1" className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 border border-zinc-700 hover:border-room text-white text-sm font-bold rounded-xl transition-all">
                ✨ Riallaccia il giorno con il Coach
              </a>
            </li>
          </ul>
        )}
      </section>

      {/* Aggiungi blocco orario */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl">
        <button onClick={() => setAddBlockOpen(!addBlockOpen)} aria-expanded={addBlockOpen}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-zinc-900/50 rounded-2xl transition-colors">
          <span className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0"><Plus size={15} /></span>
          <span className="flex-1 font-bold text-[15px] text-white">Aggiungi blocco orario</span>
          <span className={`text-zinc-500 transition-transform ${addBlockOpen ? 'rotate-180' : ''}`} aria-hidden>⌄</span>
        </button>
        {addBlockOpen && (
          <form onSubmit={addBlock} className="grid grid-cols-3 gap-2 px-4 pb-4">
            <input aria-label="Inizio" type="time" className={input} value={newBlock.start} onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })} />
            <input aria-label="Fine" type="time" className={input} value={newBlock.end} onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })} />
            <input aria-label="Etichetta blocco" className={input} placeholder="Focus" value={newBlock.label} onChange={(e) => setNewBlock({ ...newBlock, label: e.target.value })} maxLength={200} />
            <button className="col-span-3 py-2.5 bg-room text-[#0B0D12] text-sm font-bold rounded-xl">Aggiungi blocco</button>
          </form>
        )}
      </div>

      {/* Milestone */}
      <section className={section} aria-label="Milestone">
        <div className="flex items-center gap-3 mb-3">
          <p className={`${kicker} flex-1`}>My milestones</p>
          <button onClick={() => setAddGoalOpen(!addGoalOpen)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-200 hover:border-room transition-all flex items-center gap-1.5">
            📅 Milestone
          </button>
        </div>
        {addGoalOpen && (
          <form onSubmit={addGoal} className="flex gap-2 mb-4">
            <input aria-label="Nuova milestone" className={input} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Lancio, release, scadenza privata..." maxLength={200} autoFocus />
            <button className="px-4 bg-room text-[#0B0D12] rounded-xl font-bold">Ok</button>
          </form>
        )}
        {goals.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-lg font-extrabold text-white">Niente di programmate ancora</p>
            <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
              Aggiungi una data di lancio, un rilascio feature o una scadenza privata silenziosa — quelle pubbliche finiscono sul calendario del club.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <li key={g.id} className="text-sm border border-zinc-800 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className={`flex-1 ${g.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200 font-semibold'}`}>{g.title}</span>
                  {g.status !== 'done' && (
                    <button onClick={async () => {
                      const r = await fetch(`/api/room/goals/${g.id}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
                        body: JSON.stringify({ status: 'done' }),
                      });
                      if (r.ok) setGoals((p) => p.map((x) => (x.id === g.id ? { ...x, status: 'done' } : x)));
                    }} className="text-[11px] font-bold text-room">Fatto ✓</button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <input aria-label="URL prova" defaultValue={g.proof_url || ''} placeholder="URL prova (https://...)" className={`${input} !py-1.5 !text-xs`}
                    onBlur={async (e) => {
                      if (e.target.value === (g.proof_url || '')) return;
                      await fetch(`/api/room/goals/${g.id}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
                        body: JSON.stringify({ proof_url: e.target.value || null }),
                      });
                    }} />
                </div>
                <label className="block mt-2 text-[11px] font-bold text-zinc-500 cursor-pointer hover:text-room">
                  {g.screenshot_path ? '✓ Prova allegata · sostituisci' : '+ Allega screenshot prova'}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const fd = new FormData();
                    fd.append('goal_id', g.id);
                    fd.append('screenshot', f);
                    const r = await fetch('/api/room/proofs', { method: 'POST', headers: await roomAuthHeaders(), body: fd });
                    if (r.ok) setGoals((p) => p.map((x) => (x.id === g.id ? { ...x, screenshot_path: 'ok' } : x)));
                  }} />
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Streak */}
      {streak && (
        <div className={`${section} flex items-center gap-4`} role="status" aria-label="Streak">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${streak.todayDone ? 'bg-ember text-[#0B0D12]' : 'bg-zinc-900 text-zinc-500'}`}>
            <Flame size={22} />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-white">{streak.current} giorni di fila {streak.todayDone ? '· oggi fatto ✓' : '· oggi da fare'}</p>
            <p className="text-xs text-zinc-500">Record: {streak.longest}</p>
          </div>
          {!streak.todayDone && (
            <button onClick={async () => {
              await fetch('/api/room/streak', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) }, body: JSON.stringify({ startup_id: sid }) });
              const s = await fetch('/api/room/streak', { headers: await roomAuthHeaders() });
              if (s.ok) setStreak(await s.json());
            }} className="px-3 py-2 bg-room text-[#0B0D12] text-xs font-bold rounded-xl">Shippato oggi</button>
          )}
        </div>
      )}

      {/* Task */}
      <div id="task" className={`${section} scroll-mt-20`}>
        <h2 className={h2}>Task</h2>
        <form onSubmit={addTask} className="flex gap-2 mb-3">
          <input aria-label="Nuovo task" className={input} value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Nuovo task..." maxLength={200} />
          <button aria-label="Aggiungi task" className="px-4 bg-room text-[#0B0D12] rounded-xl font-bold"><Plus size={16} /></button>
        </form>
        {tasks.length === 0 ? <p className="text-sm text-zinc-500">Nessun task. Aggiungi il primo sopra.</p> : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <button onClick={() => setTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')} aria-label={t.status === 'done' ? 'Riapri task' : 'Completa task'}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${t.status === 'done' ? 'bg-room border-room text-white' : 'border-zinc-700 text-transparent'}`}>
                  <Check size={14} />
                </button>
                <span className={`flex-1 ${t.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{t.title}</span>
                <button onClick={async () => {
                  await fetch(`/api/room/tasks/${t.id}`, { method: 'DELETE', headers: await roomAuthHeaders() });
                  setTasks((p) => p.filter((x) => x.id !== t.id));
                }} aria-label="Elimina task" className="p-1.5 text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Standup */}
      <form onSubmit={saveStandup} id="standup" className={`${section} scroll-mt-20`}>
        <h2 className={h2}>Standup di oggi</h2>
        <div className="space-y-2">
          <textarea aria-label="Fatto" rows={2} className={input} placeholder="Fatto" value={standup.done} onChange={(e) => setStandup({ ...standup, done: e.target.value })} maxLength={2000} />
          <textarea aria-label="Da fare" rows={2} className={input} placeholder="Da fare" value={standup.todo} onChange={(e) => setStandup({ ...standup, todo: e.target.value })} maxLength={2000} />
          <textarea aria-label="Blocchi" rows={2} className={input} placeholder="Blocchi" value={standup.blockers} onChange={(e) => setStandup({ ...standup, blockers: e.target.value })} maxLength={2000} />
        </div>
        <button className="mt-3 w-full py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room">Salva standup</button>
      </form>
    </div>
  );
}
