'use client';

import { useEffect, useState, FormEvent } from 'react';
import { roomAuthHeaders } from '@/lib/auth-token';
import { Loader2, Trash2, Flag } from 'lucide-react';
import { roomInput as input } from '../ui';

type NPost = { id: string; kind: string; title: string; body: string; contact: string | null; created_at: string; author: string; mine: boolean };

export default function NetworkTab() {
  const [posts, setPosts] = useState<NPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('offro');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [contact, setContact] = useState('');

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/room/network', { headers: await roomAuthHeaders() });
    if (r.ok) setPosts(await r.json().then((d) => d.posts));
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/room/network', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ kind, title, body, contact }),
    });
    if (r.ok) { setTitle(''); setBody(''); setContact(''); load(); }
  };

  return (
    <div>
      <form onSubmit={create} className="border border-zinc-800 rounded-2xl p-4 mb-4 space-y-2">
        <div className="flex gap-2">
          <select aria-label="Tipo annuncio" className="px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs font-bold" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="offro">Offro</option>
            <option value="cerco">Cerco</option>
          </select>
          <input aria-label="Titolo annuncio" required className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titolo annuncio..." maxLength={200} />
        </div>
        <textarea aria-label="Dettagli" rows={2} className={input} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Dettagli collaborazione..." maxLength={2000} />
        <input aria-label="Contatto" className={input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Come contattarti (facoltativo)" maxLength={200} />
        <button className="w-full py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room">Pubblica in bacheca</button>
      </form>

      {loading ? <div className="flex justify-center py-10" role="status"><Loader2 className="animate-spin text-room" /></div> :
        posts.length === 0 ? <p className="text-sm text-zinc-500 text-center py-8">Bacheca vuota.</p> : (
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.id} className="border border-zinc-800 bg-black rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${p.kind === 'offro' ? 'bg-room/20 text-room-bright' : 'bg-zinc-900 text-zinc-300'}`}>{p.kind}</span>
                  <span className="text-[11px] text-zinc-500">{p.author}</span>
                  <span className="ml-auto flex gap-1">
                    {!p.mine && (
                      <button aria-label="Segnala annuncio" className="p-1 text-zinc-600 hover:text-room" onClick={async () => {
                        const reason = window.prompt('Motivo (spam, odio, nsfw, altro)?', 'spam');
                        if (!reason || !['spam', 'odio', 'nsfw', 'altro'].includes(reason)) return;
                        await fetch('/api/room/reports', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) }, body: JSON.stringify({ target_type: 'network', target_id: p.id, reason }) });
                        alert('Segnalazione inviata.');
                      }}><Flag size={12} /></button>
                    )}
                    {p.mine && (
                      <button aria-label="Elimina annuncio" className="p-1 text-zinc-600 hover:text-red-400" onClick={async () => {
                        await fetch(`/api/room/network?id=${p.id}`, { method: 'DELETE', headers: await roomAuthHeaders() });
                        load();
                      }}><Trash2 size={12} /></button>
                    )}
                  </span>
                </div>
                <p className="font-bold text-white text-sm mt-1">{p.title}</p>
                {p.body && <p className="text-xs text-zinc-400 mt-1">{p.body}</p>}
                {p.contact && <p className="text-[11px] text-room-bright mt-1">Contatto: {p.contact}</p>}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
