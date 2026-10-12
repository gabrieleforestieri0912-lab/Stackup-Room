'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2, Plus, Trash2, Flame, Check } from 'lucide-react';

type Startup = { id: string; name: string };
type Task = { id: string; title: string; priority: string; status: string; due_date: string | null };
type Block = { id: string; start_time: string; end_time: string; label: string };
type Goal = { id: string; title: string; status: string; proof_url: string | null; proof_note: string | null; screenshot_path?: string | null };

const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const today = () => new Date().toISOString().slice(0, 10);
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-orange-500 outline-none text-zinc-100 text-sm rounded-xl';

export default function PlannerPage() {
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

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/room/startups', { headers: await auth() });
      const list: Startup[] = r.ok ? await r.json().then((d) => d.startups) : [];
      setStartups(list);
      if (list[0]) setSid(list[0].id);
      const s = await fetch('/api/room/streak', { headers: await auth() });
      if (s.ok) setStreak(await s.json());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!sid) return;
    (async () => {
      const h = await auth();
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

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-orange-500" /></div>;
  if (startups.length === 0) {
    return (
      <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
        <p className="font-bold text-white">Crea prima una startup.</p>
        <a href="/room/startups" className="text-sm text-orange-400 font-bold">Vai al portfolio →</a>
      </div>
    );
  }

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const r = await fetch('/api/room/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: sid, title: newTask }),
    });
    if (r.ok) { const t = await r.json().then((d) => d.task); setTasks((p) => [...p, t]); setNewTask(''); }
  };

  const setTaskStatus = async (id: string, status: string) => {
    const r = await fetch(`/api/room/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      const t = await r.json().then((d) => d.task);
      setTasks((p) => p.map((x) => (x.id === id ? t : x)));
      const s = await fetch('/api/room/streak', { headers: await auth() });
      if (s.ok) setStreak(await s.json());
    }
  };

  const saveStandup = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/room/standups', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: sid, day: today(), ...standup }),
    });
    const s = await fetch('/api/room/streak', { headers: await auth() });
    if (s.ok) setStreak(await s.json());
  };

  const addBlock = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/room/blocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ day: today(), start_time: newBlock.start, end_time: newBlock.end, label: newBlock.label, startup_id: sid }),
    });
    if (r.ok) { const b = await r.json().then((d) => d.block); setBlocks((p) => [...p, b].sort((a, c) => a.start_time.localeCompare(c.start_time))); }
  };

  const addGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    const r = await fetch('/api/room/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: sid, title: newGoal }),
    });
    if (r.ok) { const g = await r.json().then((d) => d.goal); setGoals((p) => [g, ...p]); setNewGoal(''); }
  };

  const section = 'bg-black border border-zinc-800 rounded-2xl p-5';
  const h2 = 'font-bold text-white mb-3';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Planner · privato</p>
        <h1 className="text-2xl font-extrabold tracking-tight mb-3">La tua giornata.</h1>
        <select aria-label="Startup attiva" className={input} value={sid} onChange={(e) => setSid(e.target.value)}>
          {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {streak && (
        <div className={`${section} flex items-center gap-4`} role="status" aria-label="Streak">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${streak.todayDone ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
            <Flame size={22} />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-white">{streak.current} giorni di fila {streak.todayDone ? '· oggi fatto ✓' : '· oggi da fare'}</p>
            <p className="text-xs text-zinc-500">Record: {streak.longest}</p>
          </div>
          {!streak.todayDone && (
            <button onClick={async () => {
              await fetch('/api/room/streak', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) }, body: JSON.stringify({ startup_id: sid }) });
              const s = await fetch('/api/room/streak', { headers: await auth() });
              if (s.ok) setStreak(await s.json());
            }} className="px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl">Shippato oggi</button>
          )}
        </div>
      )}
      {streak && streak.heatmap.length > 0 && (
        <div className={section} aria-label="Ultimi giorni shippati">
          <h2 className={h2}>Heatmap</h2>
          <div className="flex flex-wrap gap-1.5">
            {streak.heatmap.slice(0, 60).map((d) => (
              <div key={d} title={d} className="w-4 h-4 rounded bg-orange-600" />
            ))}
          </div>
        </div>
      )}

      <div className={section}>
        <h2 className={h2}>Task</h2>
        <form onSubmit={addTask} className="flex gap-2 mb-3">
          <input aria-label="Nuovo task" className={input} value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Nuovo task..." maxLength={200} />
          <button aria-label="Aggiungi task" className="px-4 bg-orange-600 text-white rounded-xl font-bold"><Plus size={16} /></button>
        </form>
        {tasks.length === 0 ? <p className="text-sm text-zinc-500">Nessun task. Aggiungi il primo sopra.</p> : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <button onClick={() => setTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')} aria-label={t.status === 'done' ? 'Riapri task' : 'Completa task'}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${t.status === 'done' ? 'bg-orange-600 border-orange-600 text-white' : 'border-zinc-700 text-transparent'}`}>
                  <Check size={14} />
                </button>
                <span className={`flex-1 ${t.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{t.title}</span>
                {t.status !== 'done' && t.status !== 'todo' ? null : null}
                <button onClick={async () => {
                  await fetch(`/api/room/tasks/${t.id}`, { method: 'DELETE', headers: await auth() });
                  setTasks((p) => p.filter((x) => x.id !== t.id));
                }} aria-label="Elimina task" className="p-1.5 text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={saveStandup} className={section}>
        <h2 className={h2}>Standup di oggi</h2>
        <div className="space-y-2">
          <textarea aria-label="Fatto" rows={2} className={input} placeholder="Fatto" value={standup.done} onChange={(e) => setStandup({ ...standup, done: e.target.value })} maxLength={2000} />
          <textarea aria-label="Da fare" rows={2} className={input} placeholder="Da fare" value={standup.todo} onChange={(e) => setStandup({ ...standup, todo: e.target.value })} maxLength={2000} />
          <textarea aria-label="Blocchi" rows={2} className={input} placeholder="Blocchi" value={standup.blockers} onChange={(e) => setStandup({ ...standup, blockers: e.target.value })} maxLength={2000} />
        </div>
        <button className="mt-3 w-full py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-orange-500">Salva standup</button>
      </form>

      <div className={section}>
        <h2 className={h2}>Time-blocking</h2>
        <form onSubmit={addBlock} className="grid grid-cols-3 gap-2 mb-3">
          <input aria-label="Inizio" type="time" className={input} value={newBlock.start} onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })} />
          <input aria-label="Fine" type="time" className={input} value={newBlock.end} onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })} />
          <input aria-label="Etichetta blocco" className={input} placeholder="Focus" value={newBlock.label} onChange={(e) => setNewBlock({ ...newBlock, label: e.target.value })} maxLength={200} />
          <button className="col-span-3 py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-orange-500">Aggiungi blocco</button>
        </form>
        {blocks.length === 0 ? <p className="text-sm text-zinc-500">Nessun blocco oggi.</p> : (
          <ul className="space-y-1.5 text-sm">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-zinc-300">
                <span className="font-mono text-xs text-orange-400">{b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}</span>
                <span className="flex-1 truncate">{b.label || '—'}</span>
                <button onClick={async () => {
                  await fetch(`/api/room/blocks/${b.id}`, { method: 'DELETE', headers: await auth() });
                  setBlocks((p) => p.filter((x) => x.id !== b.id));
                }} aria-label="Elimina blocco" className="p-1.5 text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={section}>
        <h2 className={h2}>Obiettivi + prova</h2>
        <form onSubmit={addGoal} className="flex gap-2 mb-3">
          <input aria-label="Nuovo obiettivo" className={input} value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="Nuovo obiettivo..." maxLength={200} />
          <button aria-label="Aggiungi obiettivo" className="px-4 bg-orange-600 text-white rounded-xl font-bold"><Plus size={16} /></button>
        </form>
        {goals.length === 0 ? <p className="text-sm text-zinc-500">Nessun obiettivo.</p> : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <li key={g.id} className="text-sm border border-zinc-800 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className={`flex-1 ${g.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200 font-semibold'}`}>{g.title}</span>
                  {g.status !== 'done' && (
                    <button onClick={async () => {
                      const r = await fetch(`/api/room/goals/${g.id}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await auth()) },
                        body: JSON.stringify({ status: 'done' }),
                      });
                      if (r.ok) setGoals((p) => p.map((x) => (x.id === g.id ? { ...x, status: 'done' } : x)));
                    }} className="text-[11px] font-bold text-orange-400">Fatto ✓</button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <input aria-label="URL prova" defaultValue={g.proof_url || ''} placeholder="URL prova (https://...)" className={`${input} !py-1.5 !text-xs`}
                    onBlur={async (e) => {
                      if (e.target.value === (g.proof_url || '')) return;
                      await fetch(`/api/room/goals/${g.id}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await auth()) },
                        body: JSON.stringify({ proof_url: e.target.value || null }),
                      });
                    }} />
                </div>
                <label className="block mt-2 text-[11px] font-bold text-zinc-500 cursor-pointer hover:text-orange-400">
                  {g.screenshot_path ? '✓ Prova allegata · sostituisci' : '+ Allega screenshot prova'}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const fd = new FormData();
                    fd.append('goal_id', g.id);
                    fd.append('screenshot', f);
                    const r = await fetch('/api/room/proofs', { method: 'POST', headers: await auth(), body: fd });
                    if (r.ok) setGoals((p) => p.map((x) => (x.id === g.id ? { ...x, screenshot_path: 'ok' } : x)));
                  }} />
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
