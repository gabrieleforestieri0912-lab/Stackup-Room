'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { roomAuthHeaders } from '@/lib/auth-token';
import { roomInput as input, roomNarrow } from '../ui';
import { Loader2, Check } from 'lucide-react';

const IMPORTANCE = [
  { id: 'nice', label: 'Carino da avere' },
  { id: 'helpful', label: 'Mi aiuterebbe molto' },
  { id: 'critical', label: 'Non posso farne a meno' },
] as const;

const kicker = 'text-[11px] font-mono font-black uppercase tracking-[0.16em] text-zinc-500 mb-2';

export default function FeatureRequestPage() {
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [importance, setImportance] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
      active ? 'bg-room text-[#0B0D12] border-room' : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
    }`;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!title.trim()) { setErr('Scrivi in una riga cosa vorresti costruire.'); return; }
    if (!importance) { setErr('Scegli quanto conta per te.'); return; }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('kind', 'idea');
      fd.append('title', title);
      fd.append('steps', problem);
      fd.append('severity', importance);
      const r = await fetch('/api/room/feedback', { method: 'POST', headers: await roomAuthHeaders(), body: fd });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(String(d.message || 'Invio non riuscito. Riprova.'));
        return;
      }
      setDone(true);
    } catch {
      setErr('Invio non riuscito. Controlla la connessione e riprova.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={roomNarrow}>
      {/* Testata */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) window.history.back(); else window.location.href = '/room'; }}
          aria-label="Torna indietro" title="Torna indietro"
          className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:border-room hover:text-white transition-all">
          ←
        </button>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Richiedi una funzione</h1>
      </div>

      {done ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-room/15 border border-room/40 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-room" />
          </div>
          <h2 className="text-lg font-extrabold text-white">Grazie, ricevuto.</h2>
          <p className="text-sm text-zinc-400 mt-1.5">
            Le richieste del club decidono la roadmap: ti scriviamo quando la funzione esce.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link href="/room" className="flex-1 py-3 bg-zinc-900 border border-zinc-700 hover:border-room text-white font-bold rounded-xl transition-all text-center">
              Torna alla Room
            </Link>
            <button onClick={() => { setDone(false); setTitle(''); setProblem(''); setImportance(''); }}
              className="px-5 py-3 text-zinc-500 hover:text-zinc-300 font-bold text-sm transition-colors">
              Altra richiesta
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm text-zinc-400 mb-5">Dicci cosa costruire dopo — il club vive di queste richieste.</p>

          {err && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}

          <fieldset className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-5">
            {/* Titolo */}
            <div>
              <label htmlFor="fr-title" className={kicker}>Cosa dovremmo costruire?</label>
              <input id="fr-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Una riga — la funzione in breve" maxLength={200} />
            </div>

            {/* Problema */}
            <div>
              <div className="flex items-baseline gap-2">
                <label htmlFor="fr-problem" className={`${kicker} flex-1`}>Quale problema risolverebbe?</label>
                <span className="text-[11px] font-mono font-bold text-zinc-600">{problem.length}/1000</span>
              </div>
              <textarea id="fr-problem" rows={5} maxLength={1000} className={input}
                placeholder="Raccontaci il momento in cui la useresti — cosa fa male oggi?"
                value={problem} onChange={(e) => setProblem(e.target.value)} />
            </div>

            {/* Importanza */}
            <div>
              <p className={kicker} id="fr-imp-label">Quanto conta?</p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="fr-imp-label">
                {IMPORTANCE.map((s) => (
                  <button key={s.id} type="button" onClick={() => setImportance(s.id)} aria-pressed={importance === s.id}
                    className={chip(importance === s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <button disabled={sending}
            className={`w-full mt-5 py-4 rounded-2xl font-bold text-[15px] transition-all ${sending ? 'opacity-60' : ''} bg-room text-[#0B0D12] hover:bg-room-bright`}>
            {sending ? <Loader2 size={18} className="animate-spin mx-auto" aria-label="Invio in corso" /> : 'Invia richiesta'}
          </button>
        </form>
      )}
    </div>
  );
}
