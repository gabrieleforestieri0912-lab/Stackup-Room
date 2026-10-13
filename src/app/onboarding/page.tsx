'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, ArrowRight, Rocket, Check } from 'lucide-react';
import { getAccessToken } from '@/lib/auth-token';

const SKILL_PRESETS = ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Python', 'Marketing', 'Vendite', 'Design', 'SEO', 'Copywriting'];
const STAGES = ['idea', 'building', 'launched', 'scaling'] as const;

const STEPS = ['Profilo', 'Background', 'Startup', 'Obiettivo'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — profilo
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [locality, setLocality] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  // Step 2 — background
  const [situation, setSituation] = useState('');
  const [goals, setGoals] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  // Step 3 — startup attiva
  const [sName, setSName] = useState('');
  const [sUrl, setSUrl] = useState('');
  const [sTagline, setSTagline] = useState('');
  const [sStage, setSStage] = useState<string>('idea');
  // Step 4 — obiettivo + task
  const [goalTitle, setGoalTitle] = useState('');
  const [tasks, setTasks] = useState<string[]>(['']);

  // Chi ha già completato non rifà l'onboarding
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

  const toggleSkill = (s: string) => setSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s].slice(0, 20)));

  const validStep = (): string => {
    if (step === 0) {
      if (!name.trim()) return 'Inserisci il tuo nome.';
      if (!/^[a-z0-9_]{3,24}$/.test(handle)) return 'Handle: 3-24 caratteri (minuscole, numeri, _).';
      if (!birthDate) return 'Inserisci la data di nascita (16+ anni).';
      if (github && !/^[a-zA-Z0-9-]{1,39}$/.test(github)) return 'Username GitHub non valido.';
      return '';
    }
    if (step === 1) {
      if (!situation.trim() || !goals.trim()) return 'Racconta situazione e obiettivi: servono al coach.';
      return '';
    }
    if (step === 2) {
      if (!sName.trim()) return 'Come si chiama la tua startup attiva?';
      if (sUrl && !/^https?:\/\/.+\..+/.test(sUrl)) return 'Link startup non valido (https://...).';
      return '';
    }
    const clean = tasks.map((t) => t.trim()).filter(Boolean);
    if (!goalTitle.trim()) return 'Definisci il primo obiettivo.';
    if (clean.length === 0) return 'Aggiungi almeno una task iniziale.';
    return '';
  };

  const next = () => {
    const err = validStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
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
          name, handle, birth_date: birthDate, locality, bio, github_username: github,
          situation, goals, skills,
          startup: { name: sName, url: sUrl, tagline: sTagline, stage: sStage },
          goal_title: goalTitle,
          tasks: tasks.map((t) => t.trim()).filter(Boolean),
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

  const input = 'w-full px-4 py-3.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl';
  const label = 'block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5';

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-4 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4 rounded-xl">
            <Rocket size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Configura la Room.</h1>
          <p className="text-sm text-zinc-400 mt-1">Profilo, startup attiva, obiettivo e prime task. Devi avere almeno 16 anni.</p>
        </div>

        <ol className="flex gap-1.5 mb-8" aria-label="Avanzamento onboarding">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-orange-600' : 'bg-zinc-800'}`} />
              <p className={`text-[10px] font-bold mt-1 ${i === step ? 'text-orange-300' : 'text-zinc-600'}`}>{i + 1}. {s}</p>
            </li>
          ))}
        </ol>

        {error && <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{error}</div>}

        <form onSubmit={step === STEPS.length - 1 ? submit : (e) => { e.preventDefault(); next(); }}>
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={label} htmlFor="ob-name">Nome</label>
                  <input id="ob-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" maxLength={80} />
                </div>
                <div>
                  <label className={label} htmlFor="ob-handle">Handle univoco</label>
                  <input id="ob-handle" className={input} value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24))} placeholder="adalov" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={label} htmlFor="ob-birth">Nascita (16+)</label>
                  <input id="ob-birth" type="date" className={input} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="ob-loc">Località</label>
                  <input id="ob-loc" className={input} value={locality} onChange={(e) => setLocality(e.target.value)} placeholder="Milano, IT" maxLength={120} />
                </div>
              </div>
              <div>
                <label className={label} htmlFor="ob-bio">Bio (facoltativa)</label>
                <textarea id="ob-bio" rows={2} className={input} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Solo founder, ex ... " maxLength={500} />
              </div>
              <div>
                <label className={label} htmlFor="ob-gh">Username GitHub (facoltativo)</label>
                <input id="ob-gh" className={input} value={github} onChange={(e) => setGithub(e.target.value.trim())} placeholder="octocat" maxLength={39} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={label} htmlFor="ob-sit">La tua situazione</label>
                <textarea id="ob-sit" rows={3} className={input} value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="Solo founder, part-time, prima startup..." maxLength={1000} />
              </div>
              <div>
                <span className={label}>Competenze</span>
                <div className="flex flex-wrap gap-2">
                  {SKILL_PRESETS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)} aria-pressed={skills.includes(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${skills.includes(s) ? 'bg-orange-600 border-orange-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={label} htmlFor="ob-goals">Obiettivi 12 mesi</label>
                <textarea id="ob-goals" rows={3} className={input} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Lanciare la v1 e arrivare a 1k€ MRR..." maxLength={1000} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={label} htmlFor="ob-sname">Startup attiva (online)</label>
                <input id="ob-sname" className={input} value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Nome della startup" maxLength={80} />
              </div>
              <div>
                <label className={label} htmlFor="ob-surl">Link sito</label>
                <input id="ob-surl" inputMode="url" className={input} value={sUrl} onChange={(e) => setSUrl(e.target.value.trim())} placeholder="https://... (logo automatico dal dominio)" maxLength={500} />
              </div>
              <div>
                <label className={label} htmlFor="ob-stag">Tagline</label>
                <input id="ob-stag" className={input} value={sTagline} onChange={(e) => setSTagline(e.target.value)} placeholder="Una riga: cosa fa" maxLength={200} />
              </div>
              <div>
                <span className={label}>Stadio</span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Stadio startup">
                  {STAGES.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={sStage === s} onClick={() => setSStage(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${sStage === s ? 'bg-orange-600 border-orange-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={label} htmlFor="ob-goal">Primo obiettivo</label>
                <input id="ob-goal" className={input} value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Es. Pubblicare la landing entro venerdì" maxLength={200} />
              </div>
              <div>
                <span className={label}>Prime task (almeno 1, max 5)</span>
                <div className="space-y-2">
                  {tasks.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input aria-label={`Task ${i + 1}`} className={input} value={t} onChange={(e) => setTasks((p) => p.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Task ${i + 1}...`} maxLength={200} />
                      {tasks.length > 1 && (
                        <button type="button" aria-label={`Rimuovi task ${i + 1}`} onClick={() => setTasks((p) => p.filter((_, j) => j !== i))} className="px-3 text-zinc-500 hover:text-red-400 font-bold">×</button>
                      )}
                    </div>
                  ))}
                </div>
                {tasks.length < 5 && (
                  <button type="button" onClick={() => setTasks((p) => [...p, ''])} className="mt-2 text-xs font-bold text-orange-400">+ Aggiungi task</button>
                )}
              </div>
              <p className="text-[11px] text-zinc-600">Al termine atterri nel Planner con obiettivo e task già pronti.</p>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button type="button" onClick={() => { setError(''); setStep((s) => s - 1); }} className="px-5 py-3.5 bg-zinc-900 border border-zinc-700 font-bold rounded-xl flex items-center gap-2 text-sm">
                <ArrowLeft size={16} /> Indietro
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button type="submit" className="flex-1 py-3.5 bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 rounded-xl flex items-center justify-center gap-2">
                Continua <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 rounded-xl flex items-center justify-center gap-2">
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
