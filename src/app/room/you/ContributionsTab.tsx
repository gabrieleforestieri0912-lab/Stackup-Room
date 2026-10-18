'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { roomAuthHeaders } from '@/lib/auth-token';
import { Loader2 } from 'lucide-react';
import { roomInput as input } from '../ui';

type Link = { id: string; startup_id: string; stripe_account_id: string; livemode: boolean; status: string };
type Startup = { id: string; name: string };


export default function ContributionsTab() {
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
  const [ghPreview, setGhPreview] = useState<null | {
    profile: { login: string; name: string | null; bio: string | null; avatar_url: string; html_url: string; public_repos: number; followers: number; following: number };
    repos: Array<{ name: string; html_url: string; description: string | null; stargazers_count: number; language: string | null; updated_at: string }>;
  }>(null);
  const [ghPreviewState, setGhPreviewState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [ghPreviewErr, setGhPreviewErr] = useState('');

  const load = async () => {
    const h = await roomAuthHeaders();
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

  const ghQuery = ghUser.trim().replace(/^@/, '');
  const ghTyping = ghQuery.length >= 2;

  useEffect(() => {
    const query = ghUser.trim().replace(/^@/, '');
    if (query.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setGhPreviewState('loading');
      try {
        const r = await fetch(`/api/room/github/profile?username=${encodeURIComponent(query)}`, {
          headers: await roomAuthHeaders(),
          signal: ctrl.signal,
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          setGhPreview(null);
          setGhPreviewErr(d.message || 'Errore');
          setGhPreviewState('error');
          return;
        }
        setGhPreview(d);
        setGhPreviewState('ok');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setGhPreview(null);
          setGhPreviewErr('GitHub non raggiungibile');
          setGhPreviewState('error');
        }
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [ghUser]);

  const refresh = async (startupId: string) => {
    setErr(''); setMsg('');
    const r = await fetch('/api/room/stripe/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
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
      method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ link_id: opts.linkId, key_id: opts.keyId }),
    });
    load();
  };

  const saveRk = async () => {
    setErr(''); setMsg('');
    if (!sid) { setErr('Seleziona una startup.'); return; }
    if (!rkValue.startsWith('rk_live_')) { setErr('Solo chiavi rk_live_ sono accettate (niente rk_test).'); return; }
    const r = await fetch('/api/room/stripe/key', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
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
    const r = await fetch('/api/room/github', { method: 'POST', headers: await roomAuthHeaders() });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(d.message || 'Errore'); return; }
    setMsg(`GitHub sincronizzato (${d.days} giorni con attività).`);
    load();
  };

  if (loading) return <div className="flex justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-extrabold tracking-tight">Fonti collegate.</h2>
        <p className="text-sm text-zinc-400 mt-1">Sola lettura. Mai dati di carta: solo MRR riassuntivo e conteggi pubblici.</p>
      </div>
      {err && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}
      {msg && <div className="p-3 bg-room/10 border border-room/20 text-room-bright text-xs font-bold rounded-xl" role="status">{msg}</div>}

      <section className="bg-black border border-zinc-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-3">Stripe → MRR verificato</h2>
        {startups.length === 0 ? (
          <p className="text-sm text-zinc-500">Crea prima una startup. <a href="/room/you?tab=startup" className="text-room font-bold">Vai alle startup →</a></p>
        ) : (
          <>
          <div className="flex gap-2 mb-1">
            <input aria-label="Chiave ristretta Stripe" type="password" autoComplete="off" placeholder="rk_live_… (sola lettura)" value={rkValue} onChange={(e) => setRkValue(e.target.value.trim())} className="flex-1 px-4 py-2.5 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl" />
            <button onClick={saveRk} className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room whitespace-nowrap">Salva chiave</button>
          </div>
          <select aria-label="Startup da collegare" className={`${input} mb-4`} value={sid} onChange={(e) => setSid(e.target.value)}>
            {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <p className="text-[11px] text-zinc-600 mb-4">Crea la chiave da Stripe → Developers → API keys → Restricted key, con soli permessi in lettura. Solo rk_live: le chiavi rk_test non vengono accettate.</p>
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
              method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
              body: JSON.stringify({ github_username: ghUser }),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) { setErr(d.message || 'Errore'); return; }
            setMsg('Username GitHub salvato.');
          }} className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room whitespace-nowrap">Salva</button>
        </div>
        <button onClick={syncGh} className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-sm font-bold rounded-xl hover:border-room mb-4">Sincronizza ora</button>
        {ghTyping && ghPreviewState === 'loading' && (
          <div className="flex items-center gap-3 border border-zinc-800 rounded-2xl p-4 mb-4" role="status" aria-label="Caricamento profilo GitHub">
            <div className="skeleton w-12 h-12 !rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-2/3" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        )}
        {ghTyping && ghPreviewState === 'error' && (
          <p className="text-xs font-bold text-red-400 mb-4" role="alert">⚠ {ghPreviewErr} — controlla lo username.</p>
        )}
        {ghTyping && ghPreviewState === 'ok' && ghPreview && ghPreview.profile.login.toLowerCase() === ghQuery.toLowerCase() && (
          <div className="border border-room/30 bg-room/5 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              {ghPreview.profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar da URL arbitrario
                <img src={ghPreview.profile.avatar_url} alt={`Avatar GitHub di ${ghPreview.profile.login}`} className="w-12 h-12 rounded-full object-cover border border-room/40 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-room/20 flex items-center justify-center text-room font-black shrink-0" aria-hidden>
                  {ghPreview.profile.login.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">
                  {ghPreview.profile.name || ghPreview.profile.login}{' '}
                  <span className="text-room-bright font-semibold">✓ connesso</span>
                </p>
                <a href={ghPreview.profile.html_url} target="_blank" rel="noreferrer" className="text-xs text-zinc-400 hover:text-room truncate block">
                  @{ghPreview.profile.login}
                </a>
                {ghPreview.profile.bio && <p className="text-xs text-zinc-500 truncate mt-0.5">{ghPreview.profile.bio}</p>}
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="text-zinc-400"><strong className="text-white">{ghPreview.profile.public_repos}</strong> repo</span>
              <span className="text-zinc-400"><strong className="text-white">{ghPreview.profile.followers}</strong> follower</span>
              <span className="text-zinc-400"><strong className="text-white">{ghPreview.profile.following}</strong> seguiti</span>
            </div>
            {ghPreview.repos.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {ghPreview.repos.map((r) => (
                  <li key={r.html_url || r.name}>
                    <a href={r.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm border border-zinc-800 bg-black/40 rounded-xl px-3 py-2 hover:border-room/40 transition-colors">
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-[13px] text-zinc-100 truncate">{r.name}</span>
                        {r.description && <span className="block text-[11px] text-zinc-500 truncate">{r.description}</span>}
                      </span>
                      {r.language && <span className="text-[10px] font-bold text-zinc-400 shrink-0">{r.language}</span>}
                      <span className="text-[11px] font-bold text-gold shrink-0">★ {r.stargazers_count}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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

