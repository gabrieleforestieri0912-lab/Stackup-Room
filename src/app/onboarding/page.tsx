'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { getAccessToken } from '@/lib/auth-token';

const SITUATIONS = ['Solo founder full-time', 'Founder part-time', 'Dipendente che valida un\u2019idea', 'Studente', 'Freelance verso prodotto'] as const;
const GOALS12 = ['Lanciare l\u2019MVP', 'Primi 10 clienti', '1.000€ MRR', '10.000€ MRR', 'Raccogliere fondi'] as const;
const STAGES = ['idea', 'building', 'launched', 'scaling'] as const;
const SKILL_PRESETS = ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Python', 'Marketing', 'Vendite', 'Design', 'SEO'] as const;

const STEPS = ['Profilo', 'Percorso', 'Startup', 'Obiettivo'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [situation, setSituation] = useState<string>(SITUATIONS[0]);
  const [goals, setGoals] = useState<string>(GOALS12[0]);
  const [skills, setSkills] = useState<string[]>([]);
  const [sName, setSName] = useState('');
  const [sUrl, setSUrl] = useState('');
  const [sStage, setSStage] = useState<string>('idea');
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

  const toggleSkill = (s: string) => setSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s].slice(0, 9)));

  const validStep = (): string => {
    if (step === 0) {
      if (!name.trim()) return 'Inserisci il tuo nome.';
      if (!/^[a-z0-9_]{3,24}$/.test(handle)) return 'Handle: 3-24 caratteri (minuscole, numeri, _).';
      if (!birthDate) return 'Inserisci la data di nascita (16+ anni).';
      return '';
    }
    if (step === 2) {
      if (!sName.trim()) return 'Come si chiama la tua startup attiva?';
      if (sUrl && !/^https?:\/\/.+\..+/.test(sUrl)) return 'Link startup non valido (https://...).';
      return '';
    }
    if (step === 3) {
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
          name, handle, birth_date: birthDate,
          situation, goals, skills,
          startup: { name: sName, url: sUrl, stage: sStage },
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

  const input = 'w-full px-3.5 py-2.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all text-zinc-100 text-sm rounded-xl';
  const label = 'block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1';
  const selectWrap = 'grid gap-2';

  return (
    <main className="min-h-dvh bg-black text-zinc-100 px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-4">
          <Image src="/stackup.png" alt="StackUp Room" width={44} height={44} priority className="w-11 h-11 object-contain mx-auto mb-2" />
          <h1 className="text-xl font-extrabold tracking-tight">Configura la Room.</h1>
        </div>

        <ol className="flex gap-1.5 mb-5" aria-label="Avanzamento onboarding">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-orange-600' : 'bg-zinc-800'}`} />
              <p className={`text-[10px] font-bold mt-1 ${i === step ? 'text-orange-300' : 'text-zinc-600'}`}>{i + 1}. {s}</p>
            </li>
          ))}
        </ol>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{error}</div>}

        <form onSubmit={step === STEPS.length - 1 ? submit : (e) => { e.preventDefault(); next(); }}>
          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="ob-name">Nome</label>
                <input id="ob-name" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" maxLength={80} />
              </div>
              <div>
                <label className={label} htmlFor="ob-handle">Handle</label>
                <input id="ob-handle" className={input} value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24))} placeholder="adalov" />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="ob-birth">Data di nascita (16+ anni)</label>
                <input id="ob-birth" type="date" className={input} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
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
            <div className={selectWrap}>
              <div>
                <label className={label} htmlFor="ob-sname">Startup attiva</label>
                <input id="ob-sname" className={input} value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Nome della startup" maxLength={80} />
              </div>
              <div>
                <label className={label} htmlFor="ob-surl">Sito (logo automatico)</label>
                <input id="ob-surl" inputMode="url" className={input} value={sUrl} onChange={(e) => setSUrl(e.target.value.trim())} placeholder="https://..." maxLength={500} />
              </div>
              <div>
                <label className={label} htmlFor="ob-stage">Stadio</label>
                <select id="ob-stage" className={input} value={sStage} onChange={(e) => setSStage(e.target.value)}>
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
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
            {step < STEPS.length - 1 ? (
              <button type="submit" className="flex-1 py-3 bg-orange-600 text-white text-sm font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 rounded-xl flex items-center justify-center gap-2">
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
