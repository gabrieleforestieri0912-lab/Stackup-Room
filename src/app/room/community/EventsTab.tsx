'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2, Trash2 } from 'lucide-react';

type Ev = { id: string; title: string; description: string; starts_at: string; link: string | null; author: string; mine: boolean; rsvps: number; attending: boolean };
const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl';

export default function EventsTab() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [when, setWhen] = useState('');
  const [link, setLink] = useState('');

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/room/events', { headers: await auth() });
    if (r.ok) setEvents(await r.json().then((d) => d.events));
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/room/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ title, description: desc, starts_at: when, link }),
    });
    if (r.ok) { setTitle(''); setDesc(''); setWhen(''); setLink(''); load(); }
  };

  const toggle = async (id: string) => {
    const r = await fetch('/api/room/events', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ event_id: id }),
    });
    if (r.ok) {
      const attending = await r.json().then((d) => d.attending);
      setEvents((p) => p.map((e) => (e.id === id ? { ...e, attending, rsvps: e.rsvps + (attending ? 1 : -1) } : e)));
    }
  };

  return (
    <div>
      <form onSubmit={create} className="border border-zinc-800 rounded-2xl p-4 mb-4 space-y-2">
        <input aria-label="Titolo evento" required className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lancio, demo day, call..." maxLength={200} />
        <textarea aria-label="Descrizione" rows={2} className={input} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrizione..." maxLength={2000} />
        <div className="flex gap-2">
          <input aria-label="Data e ora" required type="datetime-local" className={input} value={when} onChange={(e) => setWhen(e.target.value)} />
          <input aria-label="Link evento" className={input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </div>
        <button className="w-full py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room">Crea evento</button>
      </form>

      {loading ? <div className="flex justify-center py-10" role="status"><Loader2 className="animate-spin text-room" /></div> :
        events.length === 0 ? <p className="text-sm text-zinc-500 text-center py-8">Nessun evento in programma.</p> : (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="border border-zinc-800 bg-black rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm flex-1">{e.title}</p>
                  {e.mine && (
                    <button aria-label="Elimina evento" className="p-1 text-zinc-600 hover:text-red-400" onClick={async () => {
                      if (!window.confirm('Eliminare l\u2019evento?')) return;
                      await fetch(`/api/room/events?id=${e.id}`, { method: 'DELETE', headers: await auth() });
                      load();
                    }}><Trash2 size={12} /></button>
                  )}
                </div>
                <p className="text-[11px] text-room-bright font-bold mt-0.5">
                  {new Date(e.starts_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {e.author} · {e.rsvps} partecipanti
                </p>
                {e.description && <p className="text-xs text-zinc-400 mt-1">{e.description}</p>}
                <div className="flex gap-2 mt-2">
                  {e.link && <a href={e.link} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-room">Apri link →</a>}
                  <button onClick={() => toggle(e.id)} aria-pressed={e.attending}
                    className={`ml-auto px-3 py-1.5 text-[11px] font-bold rounded-lg border ${e.attending ? 'border-room bg-room/20 text-room-bright' : 'border-zinc-700 text-zinc-300'}`}>
                    {e.attending ? 'Partecipo ✓' : 'Partecipa'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
