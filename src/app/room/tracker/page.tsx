'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2, Flame, Plus, Trash2 } from 'lucide-react';

type Startup = { id: string; name: string };
type Tracker = { id: string; startup_id: string; name: string; kind: string; unit: string | null };
type GhDay = { day: string; count: number };

const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-orange-500 outline-none text-zinc-100 text-sm rounded-xl';
const section = 'bg-black border border-zinc-800 rounded-2xl p-5';

export default function TrackerPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [sid, setSid] = useState('');
  const [streak, setStreak] = useState<{ current: number; longest: number; todayDone: boolean; heatmap: string[] } | null>(null);
  const [gh, setGh] = useState<GhDay[]>([]);
  const [ghMsg, setGhMsg] = useState('');
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [entries, setEntries] = useState<Record<string, Array<{ day: string; value_num: number }>>>({});
  const [tName, setTName] = useState('');
  const [tKind, setTKind] = useState('number');
  const [tUnit, setTUnit] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStreak = async () => {
    const s = await fetch('/api/room/streak', { headers: await auth() });
    if (s.ok) setStreak(await s.json());
  };

  useEffect(() => {
    (async () => {
      const h = await auth();
      const [s, g] = await Promise.all([
        fetch('/api/room/startups', { headers: h }).then((r) => r.json()),
        fetch('/api/room/github', { headers: h }).then((r) => r.json()),
      ]);
      setStartups(s.startups || []);
      if (s.startups?.[0]) setSid(s.startups[0].id);
      setGh(g.series || []);
      await loadStreak();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sid) return;
    (async () => {
      const r = await fetch(`/api/room/trackers?startup_id=${sid}&days=14`, { headers: await auth() });
      if (r.ok) {
        const d = await r.json();
        setTrackers(d.trackers || []);
        setEntries(d.entries || {});
      }
    })();
  }, [sid]);

  const syncGh = async () => {
    setGhMsg('');
    const r = await fetch('/api/room/github', { method: 'POST', headers: await auth() });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setGhMsg(d.message || 'Errore'); return; }
    const g = await fetch('/api/room/github', { headers: await auth() }).then((x) => x.json());
    setGh(g.series || []);
  };

  const createTracker = async (e: FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !sid) return;
    const r = await fetch('/api/room/trackers', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: sid, name: tName, kind: tKind, unit: tUnit }),
    });
    if (r.ok) {
      const t = await r.json().then((d) => d.tracker);
      setTrackers((p) => [...p, t]);
      setTName(''); setTUnit('');
    }
  };

  const logToday = async (trackerId: string, kind: string, value: number) => {
    await fetch('/api/room/trackers', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ tracker_id: trackerId, value }),
    });
    const r = await fetch(`/api/room/trackers?startup_id=${sid}&days=14`, { headers: await auth() });
    if (r.ok) {
      const d = await r.json();
      setEntries(d.entries || {});
    }
    loadStreak();
    void kind;
  };

  if (loading) return <div className="flex justify-center py-20" role="status"><Loader2 className="animate-spin text-orange-500" /></div>;

  const ghTotal = gh.slice(0, 30).reduce((a, d) => a + d.count, 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Tracker</p>
        <h1 className="text-2xl font-extrabold tracking-tight mb-3">I tuoi numeri.</h1>
        {startups.length > 0 && (
          <select aria-label="Startup attiva" className={input} value={sid} onChange={(e) => setSid(e.target.value)}>
            {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {streak && (
        <div className={`${section} flex items-center gap-4`} role="status" aria-label="Streak giorni">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${streak.todayDone ? 'bg-orange-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
            <Flame size={22} />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-white">{streak.current} giorni di fila {streak.todayDone ? '· oggi fatto ✓' : '· oggi da fare'}</p>
            <p className="text-xs text-zinc-500">Record: {streak.longest} · task, standup, goal o tracker alimentano lo streak</p>
          </div>
          {!streak.todayDone && (
            <button onClick={async () => {
              await fetch('/api/room/streak', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) }, body: JSON.stringify({ startup_id: sid || null }) });
              loadStreak();
            }} className="px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl">Shippato oggi</button>
          )}
        </div>
      )}
      {streak && streak.heatmap.length > 0 && (
        <div className={section} aria-label="Heatmap giorni shippati">
          <h2 className="font-bold text-white mb-3">Streak · ultimi 60 giorni</h2>
          <div className="flex flex-wrap gap-1.5">
            {streak.heatmap.slice(0, 60).map((d) => (
              <div key={d} title={d} className="w-4 h-4 rounded bg-orange-600" />
            ))}
          </div>
        </div>
      )}

      <div className={section}>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-bold text-white flex-1">GitHub · contributi pubblici</h2>
          <button onClick={syncGh} className="px-3 py-1.5 text-xs font-bold bg-zinc-900 border border-zinc-700 rounded-lg">Sincronizza</button>
        </div>
        <p className="text-xs text-zinc-500 mb-3">Solo conteggi, mai codice · ultimi 30gg: <strong className="text-white">{ghTotal}</strong> {ghMsg && <span className="text-red-400">{ghMsg}</span>}</p>
        {gh.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun dato. Imposta lo username in Impostazioni e premi Sincronizza.</p>
        ) : (
          <div className="flex items-end gap-1 h-16" role="img" aria-label="Contributi GitHub">
            {gh.slice(0, 60).reverse().map((d) => (
              <div key={d.day} title={`${d.day}: ${d.count}`} className="flex-1 rounded-sm bg-orange-600/70" style={{ height: `${Math.min(100, d.count * 20 + 8)}%`, opacity: d.count > 0 ? 1 : 0.2 }} />
            ))}
          </div>
        )}
      </div>

      <div className={section}>
        <h2 className="font-bold text-white mb-1">Tracker personalizzati</h2>
        <p className="text-xs text-zinc-500 mb-3">Metriche tue (ore deep work, chiamate, contenuti…). Loggare conta come giorno shippato.</p>
        {startups.length === 0 ? (
          <p className="text-sm text-zinc-500">Crea prima una startup. <a href="/room/startups" className="text-orange-400 font-bold">Vai al portfolio →</a></p>
        ) : (
          <>
            <form onSubmit={createTracker} className="flex gap-2 mb-4">
              <input aria-label="Nome metrica" className={input} value={tName} onChange={(e) => setTName(e.target.value)} placeholder="Es. ore deep work" maxLength={60} />
              <select aria-label="Tipo" className="px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs font-bold" value={tKind} onChange={(e) => setTKind(e.target.value)}>
                <option value="number">Numero</option>
                <option value="boolean">Sì/No</option>
              </select>
              <input aria-label="Unità" className={`${input} !w-20`} value={tUnit} onChange={(e) => setTUnit(e.target.value)} placeholder="h" maxLength={20} />
              <button aria-label="Crea tracker" className="px-4 bg-orange-600 text-white rounded-xl font-bold shrink-0"><Plus size={16} /></button>
            </form>
            {trackers.length === 0 ? <p className="text-sm text-zinc-500">Nessun tracker per questa startup.</p> : (
              <ul className="space-y-3">
                {trackers.map((t) => {
                  const hist = entries[t.id] || [];
                  const todayVal = hist.find((h) => h.day === today)?.value_num;
                  const max = Math.max(1, ...hist.map((h) => h.value_num));
                  return (
                    <li key={t.id} className="border border-zinc-800 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white flex-1">{t.name} {t.unit && <span className="text-zinc-500 font-normal">({t.unit})</span>}</p>
                        <button aria-label={`Elimina ${t.name}`} className="p-1 text-zinc-600 hover:text-red-400" onClick={async () => {
                          if (!window.confirm('Eliminare tracker e storico?')) return;
                          await fetch(`/api/room/trackers?id=${t.id}`, { method: 'DELETE', headers: await auth() });
                          setTrackers((p) => p.filter((x) => x.id !== t.id));
                        }}><Trash2 size={14} /></button>
                      </div>
                      <div className="flex items-end gap-1 h-10 mt-2" aria-label={`Storico ${t.name}`}>
                        {hist.map((h) => (
                          <div key={h.day} title={`${h.day}: ${h.value_num}`} className={`flex-1 rounded-sm ${h.day === today ? 'bg-orange-500' : 'bg-orange-600/50'}`} style={{ height: `${Math.max(8, (h.value_num / max) * 100)}%` }} />
                        ))}
                        {hist.length === 0 && <p className="text-[11px] text-zinc-600">Nessun dato — registra oggi 👇</p>}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {t.kind === 'boolean' ? (
                          <button onClick={() => logToday(t.id, t.kind, todayVal ? 0 : 1)} aria-pressed={Boolean(todayVal)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${todayVal ? 'border-orange-500 bg-orange-600/20 text-orange-300' : 'border-zinc-700 text-zinc-300'}`}>
                            {todayVal ? 'Oggi fatto ✓ (tocca per annullare)' : 'Segna oggi'}
                          </button>
                        ) : (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const v = Number(new FormData(e.currentTarget).get('v'));
                            if (Number.isFinite(v)) logToday(t.id, t.kind, v);
                          }} className="flex gap-2 flex-1">
                            <input name="v" aria-label={`Valore odierno ${t.name}`} type="number" min={0} step="any" defaultValue={todayVal ?? ''} placeholder="Oggi..." className={`${input} !py-1.5 !text-xs`} />
                            <button className="px-3 py-1.5 text-xs font-bold bg-zinc-900 border border-zinc-700 rounded-lg">OK</button>
                          </form>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
