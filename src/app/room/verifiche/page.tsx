'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2 } from 'lucide-react';

type Link = { id: string; startup_id: string; stripe_account_id: string; livemode: boolean; status: string };
type Startup = { id: string; name: string };

const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-orange-500 outline-none text-zinc-100 text-sm rounded-xl';

function VerificheInner() {
  const sp = useSearchParams();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [verified, setVerified] = useState<Record<string, { mrr_cents: number; currency: string }>>({});
  const [sid, setSid] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(sp?.get('stripe') === 'ok' ? 'Account Stripe collegato.' : '');
  const [err, setErr] = useState(sp?.get('stripe') === 'error' ? (sp?.get('msg') || 'Collegamento fallito') : '');
  const [gh, setGh] = useState<Array<{ day: string; count: number }>>([]);

  const load = async () => {
    const h = await auth();
    const [s, l, g] = await Promise.all([
      fetch('/api/room/startups', { headers: h }).then((r) => r.json()),
      fetch('/api/room/stripe/links', { headers: h }).then((r) => r.json()),
      fetch('/api/room/github', { headers: h }).then((r) => r.json()),
    ]);
    setStartups(s.startups || []);
    if (s.startups?.[0]) setSid(s.startups[0].id);
    setLinks(l.links || []);
    setVerified(l.verified || {});
    setGh(g.series || []);
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const connect = async () => {
    setErr(''); setMsg('');
    const r = await fetch('/api/room/stripe/connect', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: sid }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.message || 'Errore'); return; }
    window.location.href = d.url;
  };

  const refresh = async (startupId: string) => {
    setErr(''); setMsg('');
    const r = await fetch('/api/room/stripe/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: startupId }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.message || 'Errore'); return; }
    setMsg('MRR verificato aggiornato.');
    load();
  };

  const unlink = async (linkId: string) => {
    if (!window.confirm('Scollegare questo account Stripe?')) return;
    await fetch('/api/room/stripe/refresh', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ link_id: linkId }),
    });
    load();
  };

  const syncGh = async () => {
    setErr(''); setMsg('');
    const r = await fetch('/api/room/github', { method: 'POST', headers: await auth() });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.message || 'Errore'); return; }
    setMsg(`GitHub sincronizzato (${d.days} giorni con attività).`);
    load();
  };

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-orange-300 text-xs font-semibold uppercase tracking-[0.12em] mb-2">Verifiche</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Fonti collegate.</h1>
        <p className="text-sm text-zinc-400 mt-1">Sola lettura. Mai dati di carta: solo MRR riassuntivo e conteggi pubblici.</p>
      </div>
      {err && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}
      {msg && <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold rounded-xl" role="status">{msg}</div>}

      <section className="bg-black border border-zinc-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-3">Stripe → MRR verificato</h2>
        {startups.length === 0 ? (
          <p className="text-sm text-zinc-500">Crea prima una startup. <a href="/room/startups" className="text-orange-400 font-bold">Vai al portfolio →</a></p>
        ) : (
          <div className="flex gap-2 mb-4">
            <select aria-label="Startup da collegare" className={input} value={sid} onChange={(e) => setSid(e.target.value)}>
              {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={connect} className="px-4 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-xl whitespace-nowrap">Collega Stripe</button>
          </div>
        )}
        {links.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun account collegato.</p>
        ) : (
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm border border-zinc-800 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">···{l.stripe_account_id.slice(-6)} {l.livemode ? '' : '(test)'}</p>
                  <p className="text-xs text-zinc-400">
                    Verificato: <strong className="text-orange-300">{verified[l.startup_id] ? `€${(verified[l.startup_id].mrr_cents / 100).toLocaleString('it-IT')}/mese ✓` : '—'}</strong>
                  </p>
                </div>
                <button onClick={() => refresh(l.startup_id)} className="px-3 py-1.5 text-xs font-bold bg-zinc-900 border border-zinc-700 rounded-lg">Aggiorna</button>
                <button onClick={() => unlink(l.id)} className="px-3 py-1.5 text-xs font-bold text-red-400">Scollega</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-black border border-zinc-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-1">GitHub → contributi pubblici</h2>
        <p className="text-xs text-zinc-500 mb-3">Solo conteggi dai eventi pubblici. Imposta lo username in Impostazioni.</p>
        <button onClick={syncGh} className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-orange-500 mb-4">Sincronizza ora</button>
        {gh.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun dato. Premi Sincronizza.</p>
        ) : (
          <div className="flex items-end gap-1 h-16" role="img" aria-label="Contributi GitHub ultimi 60 giorni">
            {gh.slice(0, 60).reverse().map((d) => (
              <div key={d.day} title={`${d.day}: ${d.count}`} className="flex-1 rounded-sm bg-orange-600/70" style={{ height: `${Math.min(100, d.count * 20 + 8)}%`, opacity: d.count > 0 ? 1 : 0.2 }} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function VerifichePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>}>
      <VerificheInner />
    </Suspense>
  );
}
