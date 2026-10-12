'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type Startup = {
  id: string; name: string; url: string | null; domain: string | null;
  tagline: string | null; logo_url: string | null; stage: string;
  revenue_self_cents: number | null; archived: boolean;
};

const STAGES = ['idea', 'building', 'launched', 'scaling', 'exit'] as const;

function Logo({ s }: { s: Startup }) {
  const [err, setErr] = useState(false);
  if (!s.logo_url || err) {
    return <div aria-hidden className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-extrabold">{s.name.charAt(0).toUpperCase()}</div>;
  }
  // Loghi esterni da domini arbitrari: next/image richiederebbe remotePatterns dinamici
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={s.logo_url} alt="" className="w-10 h-10 rounded-xl object-contain bg-zinc-900" onError={() => setErr(true)} loading="lazy" />;
}

export default function StartupsPage() {
  const [items, setItems] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/room/startups', { headers: await auth() });
    if (res.ok) setItems(await res.json().then((d) => d.startups));
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg('');
    const res = await fetch('/api/room/startups', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ name, url, tagline }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(data.message || 'Errore'); return; }
    setItems((p) => [data.startup, ...p]);
    setName(''); setUrl(''); setTagline('');
    setMsg('Startup aggiunta.');
  };

  const update = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/room/startups/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(data.message || 'Errore'); return; }
    setItems((p) => p.map((s) => (s.id === id ? data.startup : s)));
  };

  const remove = async (id: string) => {
    if (!window.confirm('Eliminare la startup e tutti i suoi dati planner?')) return;
    await fetch(`/api/room/startups/${id}`, { method: 'DELETE', headers: await auth() });
    setItems((p) => p.filter((s) => s.id !== id));
  };

  const input = 'w-full px-4 py-3 bg-black border border-zinc-800 focus:border-orange-500 outline-none text-zinc-100 text-sm rounded-xl';

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div>
      <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Portfolio</p>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Le tue startup.</h1>
      <p className="text-sm text-zinc-400 mb-6">Revenue sotto = auto-dichiarata. Quella verificata (da Stripe) arriva nella M3, ben distinta.</p>
      {err && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}
      {msg && <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold rounded-xl" role="status">{msg}</div>}

      <form onSubmit={create} className="bg-black border border-zinc-800 rounded-2xl p-5 space-y-3 mb-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <input aria-label="Nome startup" required className={input} placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <input aria-label="Link sito" className={input} placeholder="https://... (logo auto dal dominio)" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <input aria-label="Tagline" className={input} placeholder="Tagline (una riga)" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={200} />
        <button className="w-full py-3 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-500 flex items-center justify-center gap-2">
          <Plus size={16} /> Aggiungi startup
        </button>
      </form>

      {items.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center">
          <p className="font-bold text-white">Nessuna startup.</p>
          <p className="text-sm text-zinc-400 mt-1">Aggiungi la prima con il form sopra.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.id} className="bg-black border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Logo s={s} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-white truncate">{s.name}</h2>
                  {s.tagline && <p className="text-xs text-zinc-400 truncate">{s.tagline}</p>}
                  {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="text-[11px] text-orange-400 font-bold">{s.domain || s.url}</a>}
                </div>
                <button onClick={() => remove(s.id)} aria-label={`Elimina ${s.name}`} className="p-2 text-zinc-600 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <label className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500">Stadio
                  <select aria-label="Stadio" className={`${input} mt-1`} value={s.stage} onChange={(e) => update(s.id, { stage: e.target.value })}>
                    {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500">Revenue/mese € (dichiarata)
                  <input aria-label="Revenue auto-dichiarata" type="number" min={0} step={1} className={`${input} mt-1`}
                    defaultValue={s.revenue_self_cents != null ? s.revenue_self_cents / 100 : ''}
                    placeholder="0"
                    onBlur={(e) => {
                      const v = e.target.value === '' ? null : Math.round(Number(e.target.value) * 100);
                      if (e.target.value !== '' && (!Number.isInteger(v) || (v as number) < 0)) return;
                      update(s.id, { revenue_self_cents: v });
                    }} />
                </label>
              </div>
              <p className="text-[11px] text-zinc-600 mt-3">Dichiarata: <strong className="text-zinc-300">{s.revenue_self_cents != null ? `€${(s.revenue_self_cents / 100).toLocaleString('it-IT')}` : '—'}</strong> · Verificata: <strong className="text-zinc-500">non collegata (M3)</strong></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
