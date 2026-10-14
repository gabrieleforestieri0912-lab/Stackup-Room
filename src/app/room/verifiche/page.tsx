'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2 } from 'lucide-react';

type Link = { id: string; startup_id: string; stripe_account_id: string; livemode: boolean; status: string };
type Startup = { id: string; name: string };

const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl';

function VerificheInner() {
  const sp = useSearchParams();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [keys, setKeys] = useState<Array<{ id: string; startup_id: string; key_last4: string; livemode: boolean; status: string }>>([]);
  const [verified, setVerified] = useState<Record<string, { mrr_cents: number; currency: string }>>({});
  const [sid, setSid] = useState('');
  const [rkValue, setRkValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(sp?.get('stripe') === 'ok' ? 'Account Stripe collegato.' : '');
  const [err, setErr] = useState(sp?.get('stripe') === 'error' ? (sp?.get('msg') || 'Collegamento fallito') : '');
  const [gh, setGh] = useState<Array<{ day: string; count: number }>>([]);
  const [ghUser, setGhUser] = useState('');

  const load = async () => {
    const h = await auth();
    const [s, l, g, p] = await Promise.all([
      fetch('/api/room/startups', { headers: h }).then((r) => r.json()),
      fetch('/api/room/stripe/links', { headers: h }).then((r) => r.json()),
      fetch('/api/room/github', { headers: h }).then((r) => r.json()),
      fetch('/api/room/profile', { headers: h }).then((r) => r.json()),
    ]);
    setStartups(s.startups || []);
    if (s.startups?.[0]) setSid(s.startups[0].id);
    setLinks(l.links || []);
    setKeys(l.keys || []);
    setVerified(l.verified || {});
    setGh(g.series || []);
    setGhUser(p.profile?.github_username || '');
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
    window.location.assign(d.url);
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

  const unlink = async (opts: { linkId?: string; keyId?: string }) => {
    if (!window.confirm('Scollegare Stripe?')) return;
    await fetch('/api/room/stripe/refresh', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ link_id: opts.linkId, key_id: opts.keyId }),
    });
    load();
  };

  const saveRk = async () => {
    setErr(''); setMsg('');
    if (!sid) { setErr('Seleziona una startup.'); return; }
    const r = await fetch('/api/room/stripe/key', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ startup_id: sid, key: rkValue.trim() }),
    });
    const d = await r.json().catch(() => ({}));
    setRkValue('');
    if (!r.ok) { setErr(d.message || 'Errore'); return; }
    setMsg('Chiave ristretta collegata.');
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

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-room-bright text-xs font-semibold uppercase tracking-[0.12em] mb-2">Verifiche</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Fonti collegate.</h1>
        <p className="text-sm text-zinc-400 mt-1">Sola lettura. Mai dati di carta: solo MRR riassuntivo e conteggi pubblici.</p>
      </div>
      {err && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}
      {msg && <div className="p-3 bg-room/10 border border-room/20 text-room-bright text-xs font-bold rounded-xl" role="status">{msg}</div>}

      <section className="bg-black border border-zinc-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-3">Stripe → MRR verificato</h2>
        {startups.length === 0 ? (
          <p className="text-sm text-zinc-500">Crea prima una startup. <a href="/room/startups" className="text-room font-bold">Vai al portfolio →</a></p>
        ) : (
          <>
          <div className="flex gap-2 mb-4">
            <select aria-label="Startup da collegare" className={input} value={sid} onChange={(e) => setSid(e.target.value)}>
              {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={connect} className="px-4 py-2.5 bg-room text-[#0B0D12] text-sm font-bold rounded-xl whitespace-nowrap">Collega (OAuth)</button>
          </div>
          <div className="flex gap-2 mb-1">
            <input aria-label="Chiave ristretta Stripe" type="password" autoComplete="off" placeholder="oppure rk_live_… / rk_test_… (sola lettura)" value={rkValue} onChange={(e) => setRkValue(e.target.value.trim())} className="flex-1 px-4 py-2.5 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl" />
            <button onClick={saveRk} className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room whitespace-nowrap">Salva chiave</button>
          </div>
          <p className="text-[11px] text-zinc-600 mb-4">Crea la chiave da Stripe → Developers → API keys → Restricted key, con soli permessi in lettura.</p>
          </>
        )}
        {links.length === 0 && keys.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun account collegato.</p>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center gap-2 text-sm border border-zinc-800 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">rk_···{k.key_last4} {k.livemode ? '' : '(test)'}</p>
                  <p className="text-xs text-zinc-400">
                    Verificato: <strong className="text-room-bright">{verified[k.startup_id] ? `€${(verified[k.startup_id].mrr_cents / 100).toLocaleString('it-IT')}/mese ✓` : '—'}</strong>
                  </p>
                </div>
                <button onClick={() => refresh(k.startup_id)} className="px-3 py-1.5 text-xs font-bold bg-zinc-900 border border-zinc-700 rounded-lg">Aggiorna</button>
                <button onClick={() => unlink({ keyId: k.id })} className="px-3 py-1.5 text-xs font-bold text-red-400">Scollega</button>
              </li>
            ))}
            {links.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm border border-zinc-800 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">···{l.stripe_account_id.slice(-6)} {l.livemode ? '' : '(test)'}</p>
                  <p className="text-xs text-zinc-400">
                    Verificato: <strong className="text-room-bright">{verified[l.startup_id] ? `€${(verified[l.startup_id].mrr_cents / 100).toLocaleString('it-IT')}/mese ✓` : '—'}</strong>
                  </p>
                </div>
                <button onClick={() => refresh(l.startup_id)} className="px-3 py-1.5 text-xs font-bold bg-zinc-900 border border-zinc-700 rounded-lg">Aggiorna</button>
                <button onClick={() => unlink({ linkId: l.id })} className="px-3 py-1.5 text-xs font-bold text-red-400">Scollega</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-black border border-zinc-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-1">GitHub → contributi pubblici</h2>
        <p className="text-xs text-zinc-500 mb-3">Solo username, nessun accesso OAuth: leggiamo solo i conteggi pubblici. Mai accesso al codice.</p>
        <div className="flex gap-2 mb-3">
          <input aria-label="Username GitHub" placeholder="octocat" value={ghUser} onChange={(e) => setGhUser(e.target.value.trim())} className="flex-1 px-4 py-2.5 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl" />
          <button onClick={async () => {
            setErr(''); setMsg('');
            const r = await fetch('/api/room/profile', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await auth()) },
              body: JSON.stringify({ github_username: ghUser }),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) { setErr(d.message || 'Errore'); return; }
            setMsg('Username GitHub salvato.');
          }} className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room whitespace-nowrap">Salva</button>
        </div>
        <button onClick={syncGh} className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room mb-4">Sincronizza ora</button>
        {gh.length === 0 ? (
          <p className="text-sm text-zinc-500">Nessun dato. Premi Sincronizza.</p>
        ) : (
          <div className="flex items-end gap-1 h-16" role="img" aria-label="Contributi GitHub ultimi 60 giorni">
            {gh.slice(0, 60).reverse().map((d) => (
              <div key={d.day} title={`${d.day}: ${d.count}`} className="flex-1 rounded-sm bg-room/70" style={{ height: `${Math.min(100, d.count * 20 + 8)}%`, opacity: d.count > 0 ? 1 : 0.2 }} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function VerifichePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-room" /></div>}>
      <VerificheInner />
    </Suspense>
  );
}
