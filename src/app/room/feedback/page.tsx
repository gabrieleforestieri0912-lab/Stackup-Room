'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2 } from 'lucide-react';

type F = { id: string; kind: string; body: string; status: string; created_at: string };
const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-orange-500 outline-none text-zinc-100 text-sm rounded-xl';

export default function FeedbackPage() {
  const [items, setItems] = useState<F[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('bug');
  const [body, setBody] = useState('');
  const [shot, setShot] = useState<File | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    const r = await fetch('/api/room/feedback', { headers: await auth() });
    if (r.ok) setItems(await r.json().then((d) => d.feedback));
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg('');
    const fd = new FormData();
    fd.append('kind', kind);
    fd.append('body', body);
    if (shot) fd.append('screenshot', shot);
    const r = await fetch('/api/room/feedback', { method: 'POST', headers: await auth(), body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.message || 'Errore invio'); return; }
    setBody(''); setShot(null);
    setMsg('Grazie! Il tuo feedback è arrivato (screenshot visibile solo al team).');
    load();
  };

  return (
    <div>
      <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Supporto</p>
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Feedback.</h1>
      {err && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}
      {msg && <div className="mb-3 p-3 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold rounded-xl" role="status">{msg}</div>}

      <form onSubmit={send} className="border border-zinc-800 rounded-2xl p-4 mb-5 space-y-2">
        <div className="flex gap-2">
          <select aria-label="Tipo feedback" className="px-3 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs font-bold" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="bug">Bug</option>
            <option value="idea">Idea</option>
          </select>
          <label className="flex-1 px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-zinc-400 cursor-pointer truncate">
            {shot ? shot.name : 'Allega screenshot (facoltativo)'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setShot(e.target.files?.[0] || null)} />
          </label>
        </div>
        <textarea aria-label="Descrizione" required rows={4} className={input} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Cosa è successo? Cosa ti aspettavi? Passi per riprodurlo..." maxLength={5000} />
        <button className="w-full py-2.5 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-500">Invia feedback</button>
      </form>

      {loading ? <div className="flex justify-center py-8" role="status"><Loader2 className="animate-spin text-orange-500" /></div> : (
        <ul className="space-y-2">
          {items.map((f) => (
            <li key={f.id} className="border border-zinc-800 rounded-2xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-300">{f.kind} · {f.status}</p>
              <p className="text-sm text-zinc-300 mt-1">{f.body}</p>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-zinc-500 text-center py-6">Nessun feedback inviato.</li>}
        </ul>
      )}
    </div>
  );
}
