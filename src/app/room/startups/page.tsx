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
    return <div aria-hidden className="w-10 h-10 rounded-xl bg-room/20 text-room flex items-center justify-center font-extrabold">{s.name.charAt(0).toUpperCase()}</div>;
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
  const [links, setLinks] = useState<Array<{ id: string; startup_id: string; stripe_account_id: string; livemode: boolean }>>([]);
  const [keys, setKeys] = useState<Array<{ id: string; startup_id: string; key_last4: string; livemode: boolean }>>([]);
  const [verified, setVerified] = useState<Record<string, { mrr_cents: number; currency: string }>>({});
  const [stripeOk, setStripeOk] = useState(true);
  const [rkFor, setRkFor] = useState<string | null>(null);
  const [rkValue, setRkValue] = useState('');

  const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });

  const load = async () => {
    setLoading(true);
    const h = await auth();
    const res = await fetch('/api/room/startups', { headers: h });
    if (res.ok) setItems(await res.json().then((d) => d.startups));
    const sl = await fetch('/api/room/stripe/links', { headers: h });
    if (sl.ok) {
      const d = await sl.json();
      setLinks(d.links || []);
      setKeys(d.keys || []);
      setVerified(d.verified || {});
    } else {
      setStripeOk(false);
    }
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

  const connectStripe = async (startupId: string) => {
    setErr('');
    const res = await fetch('/api/room/stripe/connect', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: startupId }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(d.message || 'Stripe non configurato'); return; }
    window.location.assign(d.url);
  };

  const refreshStripe = async (startupId: string) => {
    setErr(''); setMsg('');
    const res = await fetch('/api/room/stripe/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: startupId }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(d.message || 'Errore'); return; }
    setMsg('Revenue verificata aggiornata.');
    load();
  };

  const unlinkStripe = async (opts: { linkId?: string; keyId?: string }) => {
    if (!window.confirm('Scollegare Stripe da questa startup?')) return;
    await fetch('/api/room/stripe/refresh', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ link_id: opts.linkId, key_id: opts.keyId }),
    });
    load();
  };

  const saveRk = async (startupId: string) => {
    setErr(''); setMsg('');
    if (!rkValue.startsWith('rk_live_') && !rkValue.startsWith('rk_test_')) {
      setErr('Incolla una chiave ristretta (rk_live_… o rk_test_…).');
      return;
    }
    const res = await fetch('/api/room/stripe/key', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: startupId, key: rkValue }),
    });
    const d = await res.json().catch(() => ({}));
    setRkValue('');
    setRkFor(null);
    if (!res.ok) { setErr(d.message || 'Errore'); return; }
    setMsg('Chiave collegata.');
    load();
  };

  const input = 'w-full px-4 py-3 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl';

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;

  return (
    <div>
      <p className="text-room-bright text-xs font-semibold uppercase tracking-[0.12em] mb-2">Portfolio</p>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Le tue startup.</h1>
      <p className="text-sm text-zinc-400 mb-6">Revenue sotto = auto-dichiarata. Collega Stripe per quella verificata (✓), ben distinta.</p>
      {err && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}
      {msg && <div className="mb-4 p-3 bg-room/10 border border-room/20 text-room-bright text-xs font-bold rounded-xl" role="status">{msg}</div>}

      <form onSubmit={create} className="bg-black border border-zinc-800 rounded-2xl p-5 space-y-3 mb-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <input aria-label="Nome startup" required className={input} placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <input aria-label="Link sito" className={input} placeholder="https://... (logo auto dal dominio)" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <input aria-label="Tagline" className={input} placeholder="Tagline (una riga)" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={200} />
        <button className="w-full py-3 bg-room text-[#0B0D12] text-sm font-bold rounded-xl hover:bg-room-bright flex items-center justify-center gap-2">
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
                  {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="text-[11px] text-room font-bold">{s.domain || s.url}</a>}
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
              <p className="text-[11px] text-zinc-600 mt-3">Dichiarata: <strong className="text-zinc-300">{s.revenue_self_cents != null ? `€${(s.revenue_self_cents / 100).toLocaleString('it-IT')}` : '—'}</strong></p>
              {stripeOk && (
                <div className="mt-3 border border-zinc-800 rounded-xl p-3">
                  {(() => {
                    const link = links.find((l) => l.startup_id === s.id);
                    const key = keys.find((k) => k.startup_id === s.id);
                    const v = verified[s.id];
                    if (link) {
                      return (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex-1 text-zinc-300">
                            ✓ Verificata: <strong className="text-room-bright">{v ? `€${(v.mrr_cents / 100).toLocaleString('it-IT')}/mese` : '…'}</strong>
                            <span className="text-zinc-600"> ···{link.stripe_account_id.slice(-6)}{link.livemode ? '' : ' (test)'}</span>
                          </span>
                          <button onClick={() => refreshStripe(s.id)} className="px-2.5 py-1.5 font-bold bg-zinc-900 border border-zinc-700 rounded-lg">Aggiorna</button>
                          <button onClick={() => unlinkStripe({ linkId: link.id })} className="px-2.5 py-1.5 font-bold text-red-400">Scollega</button>
                        </div>
                      );
                    }
                    if (key) {
                      return (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="flex-1 text-zinc-300">
                            ✓ Verificata: <strong className="text-room-bright">{v ? `€${(v.mrr_cents / 100).toLocaleString('it-IT')}/mese` : '…'}</strong>
                            <span className="text-zinc-600"> rk_···{key.key_last4}{key.livemode ? '' : ' (test)'}</span>
                          </span>
                          <button onClick={() => refreshStripe(s.id)} className="px-2.5 py-1.5 font-bold bg-zinc-900 border border-zinc-700 rounded-lg">Aggiorna</button>
                          <button onClick={() => unlinkStripe({ keyId: key.id })} className="px-2.5 py-1.5 font-bold text-red-400">Scollega</button>
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        <button onClick={() => connectStripe(s.id)} className="w-full py-2 text-xs font-bold bg-zinc-900 border border-zinc-700 rounded-lg hover:border-room">
                          Collega con Stripe (OAuth)
                        </button>
                        {rkFor === s.id ? (
                          <div className="flex gap-2">
                            <input aria-label="Chiave ristretta Stripe" type="password" autoComplete="off" placeholder="rk_live_… (sola lettura)" value={rkValue} onChange={(e) => setRkValue(e.target.value.trim())} className="flex-1 px-3 py-2 bg-black border border-zinc-700 focus:border-room outline-none text-zinc-100 text-xs rounded-lg" />
                            <button onClick={() => saveRk(s.id)} className="px-3 py-2 text-xs font-bold bg-room text-[#0B0D12] rounded-lg">Salva</button>
                            <button onClick={() => { setRkFor(null); setRkValue(''); }} className="px-2 text-xs text-zinc-500">×</button>
                          </div>
                        ) : (
                          <button onClick={() => setRkFor(s.id)} className="w-full text-[11px] font-bold text-zinc-500 hover:text-room">
                            oppure incolla una chiave ristretta rk_
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
