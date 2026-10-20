'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { roomAuthHeaders } from '@/lib/auth-token';
import { Loader2, Trash2, Flag } from 'lucide-react';
import { roomInput as input } from '../ui';

type Topic = { id: string; title: string; body: string; tag: string; created_at: string; author: string; mine: boolean; replies: number };

export default function ForumTab() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('discussione');
  const [filter, setFilter] = useState('');

  const load = async (f = filter) => {
    setLoading(true);
    const r = await fetch(`/api/room/forum${f ? `?tag=${f}` : ''}`, { headers: await roomAuthHeaders() });
    if (r.ok) setTopics(await r.json().then((d) => d.topics));
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(''); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/room/forum', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ title, body, tag }),
    });
    if (r.ok) { setTitle(''); setBody(''); load(); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Filtra topic">
        {(['', 'ask', 'show', 'discussione'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={filter === t}
            onClick={() => { setFilter(t); load(t); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl ${filter === t ? 'bg-room text-[#0B0D12]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
            {t === '' ? 'Tutti' : t === 'ask' ? 'Ask the room' : t === 'show' ? 'Show' : 'Discussioni'}
          </button>
        ))}
      </div>

      <form onSubmit={create} className="border border-zinc-800 rounded-2xl p-4 mb-4 space-y-2">
        <div className="flex gap-2">
          <input aria-label="Titolo topic" required className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Apri un topic..." maxLength={200} />
          <select aria-label="Tipo topic" className="px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs font-bold" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="discussione">Discussione</option>
            <option value="ask">Chiedi alla room</option>
            <option value="show">Show</option>
          </select>
        </div>
        <textarea aria-label="Dettaglio" rows={2} className={input} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Dettagli (facoltativo)..." maxLength={5000} />
        <button className="w-full py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room">Pubblica</button>
        <p className="text-[11px] text-zinc-600">Ask the room: la bozza assistita da AI arriva con la M5. Ora scrivi pure a mano.</p>
      </form>

      {loading ? <div className="flex justify-center py-10" role="status"><Loader2 className="animate-spin text-room" /></div> :
        topics.length === 0 ? <p className="text-sm text-zinc-500 text-center py-8">Nessun topic. Aprine uno sopra 👆</p> : (
          <ul className="space-y-2">
            {topics.map((t) => (
              <li key={t.id} className="border border-zinc-800 bg-black rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-zinc-900 text-room-bright">{t.tag === 'ask' ? 'ask' : t.tag}</span>
                  <span className="text-[11px] text-zinc-500">{t.author} · {t.replies} risposte</span>
                  <span className="ml-auto flex gap-1">
                    {!t.mine && (
                      <button aria-label="Segnala topic" className="p-1 text-zinc-600 hover:text-room" onClick={async () => {
                        const reason = window.prompt('Motivo (spam, odio, nsfw, altro)?', 'spam');
                        if (!reason || !['spam', 'odio', 'nsfw', 'altro'].includes(reason)) return;
                        await fetch('/api/room/reports', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) }, body: JSON.stringify({ target_type: 'topic', target_id: t.id, reason }) });
                        alert('Segnalazione inviata.');
                      }}><Flag size={12} /></button>
                    )}
                    {t.mine && (
                      <button aria-label="Elimina topic" className="p-1 text-zinc-600 hover:text-red-400" onClick={async () => {
                        if (!window.confirm('Eliminare il topic?')) return;
                        await fetch(`/api/room/forum?id=${t.id}`, { method: 'DELETE', headers: await roomAuthHeaders() });
                        load();
                      }}><Trash2 size={12} /></button>
                    )}
                  </span>
                </div>
                <Link href={`/room/community/forum/${t.id}`} className="block font-bold text-white mt-1 hover:text-room-bright">{t.title}</Link>
                {t.body && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{t.body}</p>}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
