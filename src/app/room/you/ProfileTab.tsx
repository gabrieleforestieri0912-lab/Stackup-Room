'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAccessToken } from '@/lib/auth-token';
import { ArrowRight, Loader2, Trophy } from 'lucide-react';

type Profile = Record<string, unknown>;
type Cert = { id: string; courseTitle: string; completedAt: string; finalScore: number };

export default function ProfileTab() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');
  const [certs, setCerts] = useState<Cert[]>([]);

  const load = async () => {
    const token = await getAccessToken();
    if (!token) return;
    const [pr, ce] = await Promise.all([
      fetch('/api/room/profile', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/certificates', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => ({})),
    ]);
    if (pr.ok) setProfile(await pr.json().then((d) => d.profile));
    if (ce.success) setCerts(ce.data || []);
  };

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const set = (k: string, v: unknown) => setProfile((p) => ({ ...(p || {}), [k]: v }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr(''); setMsg(''); setSaving(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/room/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile?.name, handle: profile?.handle, locality: profile?.locality,
          bio: profile?.bio, socials: profile?.socials, github_username: profile?.github_username,
          avatar_url: profile?.avatar_url, anonymous_mode: profile?.anonymous_mode,
          show_revenue: profile?.show_revenue, ai_consent: profile?.ai_consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Errore salvataggio');
      setProfile(data.profile);
      setMsg('Profilo salvato.');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Errore');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setErr(''); setMsg('');
    const token = await getAccessToken();
    const res = await fetch('/api/room/account', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'stackup-room-export.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const deleteAccount = async () => {
    if (confirmDelete !== 'DELETE') { setErr('Scrivi DELETE per confermare.'); return; }
    if (!window.confirm('Eliminare definitivamente account e dati?')) return;
    const token = await getAccessToken();
    const res = await fetch('/api/room/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ confirm: 'DELETE' }),
    });
    if (!res.ok) { setErr('Errore cancellazione'); return; }
    await logout();
  };

  if (loading || !profile) {
    return <div className="flex items-center justify-center py-20" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;
  }

  const input = 'w-full px-4 py-3 bg-black border border-zinc-800 focus:border-room outline-none transition-all text-zinc-100 text-sm rounded-xl';
  const label = 'block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5';
  const socials = (profile.socials as Record<string, string>) || {};

  return (
    <div>
      <h2 className="text-[15px] font-extrabold tracking-tight mb-1">Profilo e impostazioni.</h2>
      <p className="text-sm text-zinc-400 mb-6">Profilo, privacy, consenso AI, export ed eliminazione.</p>
      {err && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}
      {msg && <div className="mb-4 p-3 bg-room/10 border border-room/20 text-room-bright text-xs font-bold rounded-xl" role="status">{msg}</div>}

      <form onSubmit={save} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={label} htmlFor="s-name">Nome</label><input id="s-name" className={input} value={String(profile.name || '')} onChange={(e) => set('name', e.target.value)} /></div>
          <div><label className={label} htmlFor="s-handle">Handle</label><input id="s-handle" className={input} value={String(profile.handle || '')} onChange={(e) => set('handle', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={label} htmlFor="s-loc">Località</label><input id="s-loc" className={input} value={String(profile.locality || '')} onChange={(e) => set('locality', e.target.value)} placeholder="Milano, IT" /></div>
          <div><label className={label} htmlFor="s-gh">Username GitHub</label><input id="s-gh" className={input} value={String(profile.github_username || '')} onChange={(e) => set('github_username', e.target.value)} placeholder="octocat" /></div>
        </div>
        <div><label className={label} htmlFor="s-bio">Bio</label><textarea id="s-bio" rows={3} className={input} value={String(profile.bio || '')} onChange={(e) => set('bio', e.target.value)} maxLength={500} /></div>
        <div><label className={label} htmlFor="s-av">Avatar URL</label><input id="s-av" type="url" className={input} value={String(profile.avatar_url || '')} onChange={(e) => set('avatar_url', e.target.value)} placeholder="https://..." /></div>
        <fieldset>
          <legend className={label}>Link social (URL completi)</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            {(['x', 'linkedin', 'website', 'youtube'] as const).map((k) => (
              <input key={k} aria-label={`Link ${k}`} className={input} placeholder={`https://... (${k})`} value={socials[k] || ''}
                onChange={(e) => set('socials', { ...socials, [k]: e.target.value })} />
            ))}
          </div>
        </fieldset>
        <div className="space-y-3 bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={Boolean(profile.anonymous_mode)} onChange={(e) => set('anonymous_mode', e.target.checked)} className="mt-1 accent-room" />
            <span><strong className="text-white">Anonymous Mode</strong><br /><span className="text-zinc-400 text-xs">Maschera identità su classifiche e community, stats mantenute.</span></span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={Boolean(profile.show_revenue)} onChange={(e) => set('show_revenue', e.target.checked)} className="mt-1 accent-room" />
            <span><strong className="text-white">Mostra revenue verificata</strong><br /><span className="text-zinc-400 text-xs">Solo numeri da fonti collegate, mai auto-dichiarati come verificati.</span></span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={Boolean(profile.ai_consent)} onChange={(e) => set('ai_consent', e.target.checked)} className="mt-1 accent-room" />
            <span><strong className="text-white">Funzioni AI (xKiro · Claude)</strong><br /><span className="text-zinc-400 text-xs">Consenso esplicito e revocabile. Invia startup, task, standup e background al provider AI. La community non è mai inviata. Senza consenso: coach offline e vocali senza trascrizione.</span></span>
          </label>
        </div>
        <button type="submit" disabled={saving} className="w-full py-3.5 bg-room text-[#0B0D12] font-bold hover:bg-room-bright transition-all shadow-lg shadow-room/20 disabled:opacity-60 rounded-xl flex items-center justify-center gap-2">
          {saving && <Loader2 size={18} className="animate-spin" />}
          {saving ? 'Salvataggio...' : 'Salva profilo'}
        </button>
      </form>

      <section className="mt-8" aria-label="Certificati">
        <h2 className="font-bold text-white mb-1">Certificati.</h2>
        <p className="text-sm text-zinc-400 mb-3">{certs.length > 0 ? `${certs.length} certificati ottenuti.` : 'Completa un corso al 100% per ottenere il certificato.'}</p>
        {certs.length > 0 && (
          <ul className="space-y-2">
            {certs.map((c) => (
              <li key={c.id}>
                <Link href={`/certificates/${c.id}`} className="flex items-center gap-3 bg-black border border-zinc-800 rounded-2xl p-4 hover:border-room/40 transition-all">
                  <Trophy size={18} className="text-gold shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-sm text-white truncate">{c.courseTitle || 'Corso'}</span>
                    <span className="block text-[11px] text-zinc-500">{new Date(c.completedAt).toLocaleDateString('it-IT')} · {c.finalScore}%</span>
                  </span>
                  <ArrowRight size={16} className="text-zinc-600 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 space-y-4">
        <button onClick={exportData} className="w-full py-3 bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm font-bold rounded-xl hover:border-room transition-all">
          Esporta i miei dati (JSON)
        </button>
        <div className="border border-red-500/30 rounded-xl p-4">
          <h2 className="text-sm font-bold text-red-400 mb-2">Zona pericolosa</h2>
          <p className="text-xs text-zinc-400 mb-3">Cancellazione immediata e completa di account e dati. Scrivi DELETE e conferma.</p>
          <input aria-label="Conferma cancellazione" className={input} placeholder="DELETE" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} />
          <button onClick={deleteAccount} className="mt-3 w-full py-3 bg-red-600/20 border border-red-500/40 text-red-300 text-sm font-bold rounded-xl hover:bg-red-600/30 transition-all">
            Elimina account
          </button>
        </div>
      </div>
    </div>
  );
}
