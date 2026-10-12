'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAccessToken } from '@/lib/auth-token';

const SKILL_PRESETS = ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Python', 'Marketing', 'Vendite', 'Design', 'SEO', 'Copywriting'];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [situation, setSituation] = useState('');
  const [goals, setGoals] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSkill = (s: string) => setSkills((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s].slice(0, 20)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/room/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, handle, birth_date: birthDate, situation, goals, skills }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Errore salvataggio');
      router.push('/room');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore');
    } finally {
      setLoading(false);
    }
  };

  const input = 'w-full px-4 py-3.5 bg-black border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all font-medium text-zinc-100 text-sm rounded-xl';
  const label = 'block text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 mb-1.5';

  return (
    <main className="min-h-screen bg-black text-zinc-100 px-4 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4 rounded-xl">
            <Rocket size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Founder background.</h1>
          <p className="text-sm text-zinc-400 mt-1">Serve al coach AI per darti consigli mirati. Devi avere almeno 16 anni.</p>
        </div>
        {error && <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{error}</div>}
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="ob-name">Nome</label>
              <input id="ob-name" required className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" maxLength={80} />
            </div>
            <div>
              <label className={label} htmlFor="ob-handle">Handle univoco</label>
              <input id="ob-handle" required className={input} value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24))} placeholder="adalov" minLength={3} maxLength={24} />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="ob-birth">Data di nascita (16+ anni)</label>
            <input id="ob-birth" type="date" required className={input} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="ob-sit">La tua situazione</label>
            <textarea id="ob-sit" required rows={3} className={input} value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="Solo founder, lavoro part-time, prima startup..." maxLength={1000} />
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
            <label className={label} htmlFor="ob-goals">Obiettivi (12 mesi)</label>
            <textarea id="ob-goals" required rows={3} className={input} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Lanciare la v1 e arrivare a 1k€ MRR..." maxLength={1000} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 rounded-xl flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Salvataggio...' : 'Entra nella Room'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
