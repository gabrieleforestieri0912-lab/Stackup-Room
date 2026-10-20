'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ArrowLeft, ArrowRight, Check, Camera, CheckCircle2, XCircle, AlertCircle, Plus, Github } from 'lucide-react';
import { getAccessToken } from '@/lib/auth-token';
import { useAuth } from '@/context/AuthContext';
import { initials, avatarGradient } from '@/lib/avatar';
import { extractDomain, logoUrlFor } from '@/lib/room/m2';

const SITUATIONS = ['Solo founder full-time', 'Founder part-time', 'Dipendente che valida un\u2019idea', 'Studente', 'Freelance verso prodotto'] as const;
const GOALS12 = ['Lanciare l\u2019MVP', 'Primi 10 clienti', '1.000€ MRR', '10.000€ MRR', 'Raccogliere fondi'] as const;
const SKILL_PRESETS = ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Python', 'Marketing', 'Vendite', 'Design', 'SEO'] as const;

const STEPS = ['Profilo', 'Percorso', 'Startup', 'GitHub', 'Obiettivo'] as const;

type StartupDraft = { domain: string; name: string; tagline: string; auto: boolean };

function deriveName(domain: string): string {
  const d = extractDomain(domain);
  if (!d) return '';
  const label = (d.split('.')[0] || '').replace(/[-_]+/g, ' ').trim();
  return label.replace(/\b\w/g, (c) => c.toUpperCase());
}

const LOC_INPUT = 'relative w-full';
const LOC_FIELD = 'w-full px-3.5 py-2.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all text-zinc-100 text-sm rounded-xl';

type LocSug = { full: string; main: string; rest: string };

// Campo località con completamento stile Google Maps: mentre scrivi vedi il
// suggerimento in grigio dopo il testo digitato (Tab o → per accettarlo) e
// l'elenco dei risultati sotto. Dati reali da Open-Meteo (gratuito, senza chiave).
function LocalityInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [sugs, setSugs] = useState<LocSug[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) { setSugs([]); setOpen(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=it&format=json`);
        const d = (await r.json()) as { results?: Array<{ name: string; admin1?: string; country?: string }> };
        const list: LocSug[] = (d.results || []).map((x) => {
          const full = [x.name, x.admin1, x.country].filter(Boolean).join(', ');
          return { full, main: x.name, rest: full.slice(x.name.length) };
        });
        setSugs(list);
        setOpen(list.length > 0);
        setHi(0);
      } catch {
        setSugs([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  // Chiudi il menu quando si clicca fuori
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const accept = (s: LocSug) => {
    onChange(s.full);
    setOpen(false);
    // Riporta il cursore alla fine dopo il completamento
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(s.full.length, s.full.length); }
    });
  };

  // Completamento inline: coda grigia del primo suggerimento dopo il testo digitato
  const q = value;
  const ghost = open && sugs.length > 0 && q.trim().length >= 2 && sugs[0].full.toLowerCase().startsWith(q.toLowerCase()) && sugs[0].full !== q
    ? sugs[0].full.slice(q.length)
    : '';

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown' && sugs.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHi((h) => (h + 1) % sugs.length);
      return;
    }
    if (e.key === 'ArrowUp' && sugs.length > 0 && open) {
      e.preventDefault();
      setHi((h) => (h - 1 + sugs.length) % sugs.length);
      return;
    }
    if (e.key === 'Tab' && ghost) { e.preventDefault(); accept(sugs[0]); return; }
    if (e.key === 'ArrowRight' && ghost && inputRef.current?.selectionStart === q.length) {
      e.preventDefault(); accept(sugs[0]); return;
    }
    if (e.key === 'Enter' && open && sugs.length > 0) {
      e.preventDefault();
      accept(sugs[hi] || sugs[0]);
    }
  };

  return (
    <div ref={boxRef} className={LOC_INPUT}>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          className={LOC_FIELD}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (sugs.length) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="Milano, Lombardia, Italia"
          maxLength={120}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${id}-sugs`}
          autoComplete="off"
        />
        {/* Fantasma del completamento, sovrapposto al campo (parte digitata trasparente) */}
        {ghost && (
          <div aria-hidden
            className="pointer-events-none absolute inset-0 px-3.5 py-2.5 text-sm rounded-xl whitespace-pre overflow-hidden border border-transparent">
            <span className="text-transparent">{value}</span>
            <span className="text-zinc-600">{ghost}</span>
          </div>
        )}
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" aria-hidden>
            <Loader2 size={14} className="animate-spin" />
          </span>
        )}
      </div>
      {open && sugs.length > 0 && (
        <ul id={`${id}-sugs`} role="listbox"
          className="absolute z-20 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
          {sugs.map((s, i) => (
            <li key={s.full} role="option" aria-selected={i === hi}>
              <button type="button" tabIndex={-1}
                onMouseEnter={() => setHi(i)}
                onClick={() => accept(s)}
                className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors ${i === hi ? 'bg-zinc-900' : ''}`}>
                <span className="font-bold text-white">{s.main}</span>
                <span className="text-zinc-500">{s.rest}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LogoPreview({ url, name }: { url: string | null; name: string }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="w-9 h-9 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center font-black shrink-0" aria-hidden>
        {(name.charAt(0) || '?').toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo da Google favicons
    <img src={url} alt="" onError={() => setErr(true)} className="w-9 h-9 rounded-lg object-contain bg-zinc-900 shrink-0" />
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [locality, setLocality] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [ghStatus, setGhStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [ghError, setGhError] = useState('');
  const [ghProfile, setGhProfile] = useState<null | {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
  }>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const [situation, setSituation] = useState<string>(SITUATIONS[0]);
  const [goals, setGoals] = useState<string>(GOALS12[0]);
  const [skills, setSkills] = useState<string[]>([]);
  const [startups, setStartups] = useState<StartupDraft[]>([{ domain: '', name: '', tagline: '', auto: true }]);
  const [goalTitle, setGoalTitle] = useState('');
  const [tasks, setTasks] = useState<string[]>(['']);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) { router.push('/login'); return; }
      const res = await fetch('/api/room/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { router.push('/login'); return; }
      const p = await res.json().then((d) => d.profile);
      if (p?.onboarding_completed) router.push('/room');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verifica disponibilità handle con debounce (dopo che l'utente smette di digitare).
  useEffect(() => {
    if (handle.length < 3) { setHandleStatus('idle'); return; }
    if (!/^[a-z0-9_]{3,24}$/.test(handle)) { setHandleStatus('invalid'); return; }
    setHandleStatus('checking');
    const t = setTimeout(async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(`/api/room/handle?handle=${encodeURIComponent(handle)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) { setHandleStatus('idle'); return; }
        const d = await res.json();
        setHandleStatus(d.available ? 'available' : 'taken');
      } catch {
        setHandleStatus('idle');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [handle]);

  // Modificare lo username invalida la connessione GitHub (serve riconnettere).
  useEffect(() => {
    setGhStatus('idle');
    setGhError('');
    setGhProfile(null);
  }, [github]);

  const connectGitHub = async () => {
    const q = github.trim().replace(/^@/, '');
    if (!q) { setGhStatus('error'); setGhError('Inserisci il tuo username GitHub.'); return; }
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(q)) { setGhStatus('error'); setGhError('Username non valido (lettere, numeri, trattini).'); return; }
    setGhStatus('checking');
    setGhError('');
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/room/github/profile?username=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGhStatus('error');
        setGhError(data.message || 'Connessione a GitHub fallita.');
        return;
      }
      const p = data.profile;
      setGhProfile({
        login: String(p?.login || q),
        name: p?.name ?? null,
        avatar_url: String(p?.avatar_url || ''),
        html_url: String(p?.html_url || `https://github.com/${q}`),
        public_repos: Number(p?.public_repos || 0),
        followers: Number(p?.followers || 0),
      });
      setGhStatus('connected');
    } catch {
      setGhStatus('error');
      setGhError('GitHub non raggiungibile, riprova più tardi.');
    }
  };

  const toggleSkill = (s: string) => setSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s].slice(0, 9)));

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo immagini (PNG, JPG, WEBP).'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Immagine troppo grande (max 2MB).'); return; }
    setError('');
    setUploadingAvatar(true);
    try {
      const token = await getAccessToken();
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch('/api/room/avatar', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload fallito');
      setAvatarUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload fallito');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const filledStartups = startups.filter((s) => s.domain.trim() || s.name.trim() || s.tagline.trim());
  const hasStartups = filledStartups.length > 0;
  // Se non aggiungi startup si salta lo step "Obiettivo" (legato a una startup).
  const visibleSteps = hasStartups ? STEPS : STEPS.slice(0, -1);
  const isLastStep = step >= visibleSteps.length - 1;

  const updateStartup = (i: number, patch: Partial<StartupDraft>) =>
    setStartups((p) => p.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const onDomainChange = (i: number, raw: string) =>
    setStartups((p) => p.map((s, j) => {
      if (j !== i) return s;
      const domain = raw.trim();
      return { ...s, domain, name: s.auto ? deriveName(domain) : s.name };
    }));

  const validStep = (): string => {
    if (step === 0) {
      if (!name.trim()) return 'Inserisci il tuo nome.';
      if (handle.length < 3) return 'L\'handle deve avere almeno 3 caratteri.';
      if (!/^[a-z0-9_]{3,24}$/.test(handle)) return 'Handle: 3-24 caratteri (minuscole, numeri, _).';
      if (handleStatus === 'taken') return 'Questo handle è già in uso.';
      if (handleStatus === 'checking') return 'Attendi la verifica dell\'handle...';
      if (!birthDate) return 'Inserisci la data di nascita (16+ anni).';
      if (!locality.trim()) return 'Inserisci la tua località.';
      if (!bio.trim()) return 'Scrivi qualcosa su di te (bio).';
      return '';
    }
    if (step === 2) {
      for (const s of filledStartups) {
        if (!extractDomain(s.domain)) return 'Dominio non valido (es. esempio.com).';
        if (!s.name.trim()) return 'Inserisci il nome della startup.';
      }
      return '';
    }
    if (step === 3) {
      if (ghStatus !== 'connected') return 'Connetti il tuo account GitHub per proseguire.';
      return '';
    }
    if (step === 4) {
      if (!goalTitle.trim()) return 'Definisci il primo obiettivo.';
      if (tasks.map((t) => t.trim()).filter(Boolean).length === 0) return 'Aggiungi almeno una task iniziale.';
      return '';
    }
    return '';
  };

  const next = () => {
    const err = validStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, visibleSteps.length - 1));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validStep();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/room/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name, handle, birth_date: birthDate,
          locality, bio, github_username: github, avatar_url: avatarUrl,
          situation, goals, skills,
          startups: filledStartups.map((s) => {
            const domain = extractDomain(s.domain) || '';
            return {
              name: s.name.trim(),
              domain,
              url: domain ? `https://${domain}` : '',
              tagline: s.tagline.trim(),
            };
          }),
          goal_title: hasStartups ? goalTitle : '',
          tasks: hasStartups ? tasks.map((t) => t.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Errore salvataggio');
      router.push('/room/planner');
    } catch (err2) {
      setError(err2 instanceof Error ? err2.message : 'Errore');
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full px-3.5 py-2.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all text-zinc-100 text-sm rounded-xl';
  const label = 'block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1';
  const selectWrap = 'grid gap-2';

  return (
    <main className="min-h-dvh bg-black text-zinc-100 px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <Image src="/stackup.png" alt="Stackup Room" width={44} height={44} priority className="w-11 h-11 object-contain mx-auto mb-2" />
          <h1 className="text-xl font-extrabold tracking-tight">Configura la Room.</h1>
        </div>

        <ol className="flex gap-1.5 mb-5" aria-label="Avanzamento onboarding">
          {visibleSteps.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-orange-600' : 'bg-zinc-800'}`} />
              <p className={`text-[10px] font-bold mt-1 ${i === step ? 'text-orange-300' : 'text-zinc-600'}`}>{i + 1}. {s}</p>
            </li>
          ))}
        </ol>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{error}</div>}

        <form onSubmit={isLastStep ? submit : (e) => { e.preventDefault(); next(); }}>
          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 flex items-center gap-4">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Anteprima immagine profilo" className="w-16 h-16 rounded-full object-cover border border-orange-500/40" />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black"
                      style={{ background: avatarGradient(name || handle || 'stackup') }}
                    >
                      {initials(name)}
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                      <Loader2 size={18} className="animate-spin text-orange-400" />
                    </div>
                  )}
                </div>
                <div>
                  <span className={label}>Immagine profilo</span>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="mt-1 inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:border-orange-500/50 transition-colors disabled:opacity-60"
                  >
                    <Camera size={14} /> {avatarUrl ? 'Cambia immagine' : 'Carica immagine'}
                  </button>
                  <p className="text-[10px] text-zinc-500 mt-1">PNG, JPG o WEBP · max 2MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ''; }}
                />
              </div>
              <div>
                <label className={label} htmlFor="ob-name">Nome</label>
                <input id="ob-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" maxLength={80} />
              </div>
              <div>
                <label className={label} htmlFor="ob-handle">Handle (min 3)</label>
                <input
                  id="ob-handle"
                  aria-describedby="ob-handle-status"
                  className={input}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24))}
                  placeholder="adalov"
                  minLength={3}
                />
                <p
                  id="ob-handle-status"
                  role="status"
                  aria-live="polite"
                  className={`mt-1 flex items-center gap-1 text-[10px] font-bold ${
                    handleStatus === 'available' ? 'text-emerald-400' :
                    handleStatus === 'taken' ? 'text-red-400' :
                    handleStatus === 'checking' ? 'text-zinc-500' : 'text-zinc-600'
                  }`}
                >
                  {handleStatus === 'available' && <><CheckCircle2 size={12} /> Disponibile</>}
                  {handleStatus === 'taken' && <><XCircle size={12} /> Già in uso</>}
                  {handleStatus === 'checking' && <><Loader2 size={12} className="animate-spin" /> Verifica...</>}
                  {handleStatus === 'invalid' && <><AlertCircle size={12} /> Formato non valido</>}
                  {handleStatus === 'idle' && <><AlertCircle size={12} /> Almeno 3 caratteri</>}
                </p>
              </div>
              <div>
                <label className={label} htmlFor="ob-birth">Data di nascita (16+ anni)</label>
                <input id="ob-birth" type="date" className={input} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="ob-loc">Dove ti trovi <span className="text-red-400">*</span></label>
                <LocalityInput id="ob-loc" value={locality} onChange={setLocality} />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="ob-bio">Su di te <span className="text-red-400">*</span></label>
                <textarea id="ob-bio" rows={3} className={`${input} resize-none`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Due righe su cosa stai costruendo e cosa cerchi." maxLength={500} />
                <p className="mt-1 text-[10px] text-zinc-600">{bio.trim().length}/500</p>
              </div>
              <div className="sm:col-span-2 mt-1 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-500">
                <span className="truncate">
                  Accesso con <b className="text-zinc-300">{user?.email || '—'}</b>
                  {user?.authMethod ? ` · ${{ google: 'Google', github: 'GitHub', otp: 'codice email', local: 'email' }[user.authMethod] || user.authMethod}` : ''}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="font-black uppercase tracking-widest text-zinc-400 hover:text-orange-400 transition-colors"
                >
                  Cambia account
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={selectWrap}>
              <div>
                <label className={label} htmlFor="ob-sit">La tua situazione</label>
                <select id="ob-sit" className={input} value={situation} onChange={(e) => setSituation(e.target.value)}>
                  {SITUATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="ob-goals">Obiettivo 12 mesi</label>
                <select id="ob-goals" className={input} value={goals} onChange={(e) => setGoals(e.target.value)}>
                  {GOALS12.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <span className={label}>Competenze (tocca per selezionare)</span>
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_PRESETS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)} aria-pressed={skills.includes(s)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${skills.includes(s) ? 'bg-orange-600 border-orange-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              <p className="text-[11px] text-zinc-500">
                Aggiungi le tue startup (anche solo il dominio). Puoi anche proseguire senza e aggiungerle più tardi.
              </p>
              {startups.map((s, i) => {
                const domain = extractDomain(s.domain);
                return (
                  <div key={i} className="relative grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                    {startups.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Rimuovi startup ${i + 1}`}
                        onClick={() => setStartups((p) => p.filter((_, j) => j !== i))}
                        className="absolute right-2 top-2 px-1.5 text-lg leading-none text-zinc-600 hover:text-red-400 font-bold"
                      >
                        ×
                      </button>
                    )}
                    <div>
                      <label className={label} htmlFor={`ob-dom-${i}`}>Dominio</label>
                      <input
                        id={`ob-dom-${i}`}
                        inputMode="url"
                        className={input}
                        value={s.domain}
                        onChange={(e) => onDomainChange(i, e.target.value)}
                        placeholder="esempio.com"
                        maxLength={255}
                      />
                    </div>
                    {domain && (
                      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black p-2.5">
                        <LogoPreview url={logoUrlFor(domain, null)} name={s.name || domain} />
                        <div className="min-w-0 flex-1">
                          <input
                            aria-label="Nome startup"
                            className="w-full border-0 bg-transparent p-0 text-sm font-bold text-white outline-none placeholder:text-zinc-600"
                            value={s.name}
                            onChange={(e) => updateStartup(i, { name: e.target.value, auto: false })}
                            placeholder="Nome startup"
                            maxLength={80}
                          />
                          <p className="truncate text-[11px] text-zinc-500">{domain}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className={label} htmlFor={`ob-tag-${i}`}>Tagline</label>
                      <input
                        id={`ob-tag-${i}`}
                        className={input}
                        value={s.tagline}
                        onChange={(e) => updateStartup(i, { tagline: e.target.value })}
                        placeholder="Una riga su cosa fai (facoltativa)"
                        maxLength={200}
                      />
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setStartups((p) => [...p, { domain: '', name: '', tagline: '', auto: true }])}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2.5 text-sm font-bold text-zinc-400 transition-colors hover:border-orange-500/50 hover:text-orange-400"
              >
                <Plus size={16} /> Aggiungi startup
              </button>
            </div>
          )}

          {step === 3 && (
            <div className={selectWrap}>
              <div>
                <label className={label} htmlFor="ob-gh">Username GitHub</label>
                <div className="flex gap-2">
                  <input
                    id="ob-gh"
                    className={input}
                    value={github}
                    onChange={(e) => setGithub(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 39))}
                    placeholder="octocat"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={connectGitHub}
                    disabled={ghStatus === 'checking' || !github.trim()}
                    className="shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:border-orange-500/50 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {ghStatus === 'checking' ? <Loader2 size={15} className="animate-spin" /> : <Github size={15} />}
                    {ghStatus === 'checking' ? 'Verifica...' : 'Connetti'}
                  </button>
                </div>
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-1.5 flex items-center gap-1 text-[10px] font-bold ${
                    ghStatus === 'connected' ? 'text-emerald-400' :
                    ghStatus === 'error' ? 'text-red-400' :
                    ghStatus === 'checking' ? 'text-zinc-500' : 'text-zinc-600'
                  }`}
                >
                  {ghStatus === 'connected' && <><CheckCircle2 size={12} /> Connesso</>}
                  {ghStatus === 'error' && <><XCircle size={12} /> {ghError}</>}
                  {ghStatus === 'checking' && <><Loader2 size={12} className="animate-spin" /> Connessione a GitHub...</>}
                  {ghStatus === 'idle' && <><AlertCircle size={12} /> Inserisci lo username e premi Connetti</>}
                </p>
              </div>

              {ghStatus === 'connected' && ghProfile && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-3">
                    {ghProfile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ghProfile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-emerald-500/40 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black shrink-0">
                        {ghProfile.login.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{ghProfile.name || ghProfile.login}</p>
                      <a href={ghProfile.html_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium truncate">
                        @{ghProfile.login}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-[11px] text-zinc-400 font-medium">
                    <span><b className="text-zinc-200">{ghProfile.public_repos}</b> repo</span>
                    <span><b className="text-zinc-200">{ghProfile.followers}</b> follower</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className={selectWrap}>
              <div>
                <label className={label} htmlFor="ob-goal">Primo obiettivo</label>
                <input id="ob-goal" className={input} value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Es. landing online entro venerdì" maxLength={200} />
              </div>
              <div>
                <span className={label}>Prime task (min 1, max 5)</span>
                <div className="space-y-1.5">
                  {tasks.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input aria-label={`Task ${i + 1}`} className={input} value={t} onChange={(e) => setTasks((p) => p.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Task ${i + 1}...`} maxLength={200} />
                      {tasks.length > 1 && (
                        <button type="button" aria-label={`Rimuovi task ${i + 1}`} onClick={() => setTasks((p) => p.filter((_, j) => j !== i))} className="px-2.5 text-zinc-500 hover:text-red-400 font-bold">×</button>
                      )}
                    </div>
                  ))}
                </div>
                {tasks.length < 5 && (
                  <button type="button" onClick={() => setTasks((p) => [...p, ''])} className="mt-1.5 text-xs font-bold text-orange-400">+ Aggiungi task</button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            {step > 0 && (
              <button type="button" onClick={() => { setError(''); setStep((s) => s - 1); }} className="px-4 py-3 bg-zinc-900 border border-zinc-700 font-bold rounded-xl flex items-center gap-2 text-sm">
                <ArrowLeft size={16} /> Indietro
              </button>
            )}
            {!isLastStep ? (
              <button type="submit" disabled={step === 3 && ghStatus !== 'connected'} className="flex-1 py-3 bg-orange-600 text-white text-sm font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                Continua <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="flex-1 py-3 bg-orange-600 text-white text-sm font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 rounded-xl flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {loading ? 'Creazione...' : 'Entra nella Room'}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
