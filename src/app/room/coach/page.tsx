'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2, Send, Trash2 } from 'lucide-react';

type Mode = 'standup' | 'planner' | 'advisor' | 'ask';
type ChatMsg = { role: 'user' | 'assistant'; content: string };
type Session = { id: string; mode: Mode; created_at: string };

const MODES: Array<{ id: Mode; label: string; hint: string }> = [
  { id: 'standup', label: 'Standup coach', hint: 'Revisiona lo standup di oggi: colli di bottiglia + 3 priorità.' },
  { id: 'planner', label: 'Day planner', hint: 'Piano della giornata dai tuoi task, in blocchi orari.' },
  { id: 'advisor', label: 'Advisor', hint: 'Validazione idea, marketing, pricing, launch planning.' },
  { id: 'ask', label: 'Ask the club', hint: 'Bozza pronta da pubblicare nel forum.' },
];

const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl';

export default function CoachPage() {
  const [ctx, setCtx] = useState<{ consent: boolean; startups: Array<{ id: string; name: string }>; openTasks: number; todayStandup: boolean; usage: { used: number; limit: number } } | null>(null);
  const [mode, setMode] = useState<Mode>('standup');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const h = await auth();
    const [c, s] = await Promise.all([
      fetch('/api/room/coach/context', { headers: h }).then((r) => r.json()),
      fetch('/api/room/coach', { headers: h }).then((r) => r.json()),
    ]);
    setCtx(c);
    setSessions(s.sessions || []);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs.length]);

  const giveConsent = async () => {
    setErr('');
    const r = await fetch('/api/room/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ ai_consent: true }),
    });
    if (!r.ok) { setErr('Errore salvataggio consenso'); return; }
    load();
  };

  const openSession = async (id: string, m: Mode) => {
    const r = await fetch(`/api/room/coach/sessions/${id}`, { headers: await auth() });
    if (!r.ok) return;
    const d = await r.json();
    setSessionId(id);
    setMode(m);
    setMsgs(d.messages || []);
    setErr('');
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || streaming) return;
    setErr('');
    const text = draft.trim();
    setDraft('');
    setMsgs((p) => [...p, { role: 'user', content: text }]);
    setStreaming(true);
    try {
      const r = await fetch('/api/room/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
        body: JSON.stringify({ session_id: sessionId, mode, message: text }),
      });
      if (!r.ok || !r.body) throw new Error('HTTP');
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';
      setMsgs((p) => [...p, { role: 'assistant', content: '' }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const part of parts) {
          const line = part.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const d = JSON.parse(line.slice(6));
          if (d.session_id && !sessionId) {
            setSessionId(d.session_id);
            fetch('/api/room/coach', { headers: await auth() }).then((x) => x.json()).then((s) => setSessions(s.sessions || []));
          }
          if (d.error) {
            if (d.error === 'NEED_CONSENT') { setErr('Serve il consenso AI.'); load(); }
            else setErr(typeof d.error === 'string' ? d.error : 'Errore del coach.');
          }
          if (d.text) {
            acc += d.text;
            setMsgs((p) => {
              const c = [...p];
              c[c.length - 1] = { role: 'assistant', content: acc };
              return c;
            });
          }
        }
      }
    } catch {
      setErr('Il coach non risponde. Riprova più tardi.');
    } finally {
      setStreaming(false);
    }
  };

  const publishAsk = async (text: string) => {
    const title = window.prompt('Titolo per il forum:', text.split('\n')[0].slice(0, 120));
    if (!title) return;
    const r = await fetch('/api/room/forum', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ title, body: text, tag: 'ask' }),
    });
    if (r.ok) alert('Pubblicato in Ask the club.');
    else alert('Pubblicazione fallita.');
  };

  if (!ctx) return <div className="flex justify-center py-20" role="status"><Loader2 className="animate-spin text-room" /></div>;

  // Senza consenso: schermata esplicita + fallback offline (nessun AI coinvolto).
  if (!ctx.consent) {
    return (
      <div>
        <p className="text-room-bright text-xs font-semibold uppercase tracking-[0.12em] mb-2">Coach AI</p>
        <h1 className="text-2xl font-extrabold tracking-tight mb-4">Prima il consenso.</h1>
        <div className="border border-room/40 bg-room/5 rounded-2xl p-5 text-sm space-y-3">
          <p className="font-bold text-white">Cosa viene inviato e a chi:</p>
          <ul className="list-disc pl-5 text-zinc-300 space-y-1">
            <li>Tutte le startup attive, task aperti, standup, obiettivi e founder background.</li>
            <li>Destinatario: xkiro.com (gateway AI, modello Claude) — chiave solo sul nostro server, mai nel browser.</li>
            <li>La community (chat, forum, annunci, eventi) non viene MAI inviata. Solo l&apos;audio di una nota vocale, se tocchi “Trascrivi”.</li>
            <li>Limite: {ctx.usage.limit} messaggi/giorno. Revocabile in Impostazioni → Funzioni AI.</li>
          </ul>
          <button onClick={giveConsent} className="w-full py-3 bg-room text-[#0B0D12] font-bold rounded-xl hover:bg-room-bright">
            Ho capito, attiva il coach
          </button>
          {err && <p className="text-red-400 text-xs font-bold" role="alert">{err}</p>}
        </div>

        <div className="border border-zinc-800 rounded-2xl p-5 mt-4">
          <h2 className="font-bold text-white mb-2">Fallback offline (senza AI)</h2>
          <p className="text-sm text-zinc-400">Task aperti: <strong className="text-white">{ctx.openTasks}</strong> · Standup oggi: <strong className="text-white">{ctx.todayStandup ? 'fatto ✓' : 'da fare'}</strong></p>
          <p className="text-xs text-zinc-500 mt-2">Regola del giorno: un task importante al mattino, standup entro le 10, un obiettivo con prova entro sera. Le note vocali restano inviabili senza trascrizione.</p>
          <a href="/room/planner" className="inline-block mt-3 text-xs font-bold text-room">Apri il Planner →</a>
        </div>
      </div>
    );
  }

  const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant')?.content || '';

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-extrabold tracking-tight flex-1">Coach.</h1>
        <span className="text-[11px] text-zinc-500 font-mono">{ctx.usage.used}/{ctx.usage.limit} oggi</span>
      </div>
      <p className="text-xs text-zinc-500 mb-4">Conosce già startup, task, standup e background: non rispiegare tutto.</p>

      <div className="flex gap-2 mb-3 overflow-x-auto" role="tablist" aria-label="Modalità coach">
        {MODES.map((m) => (
          <button key={m.id} role="tab" aria-selected={mode === m.id}
            onClick={() => { setMode(m.id); setSessionId(null); setMsgs([]); setErr(''); }}
            title={m.hint}
            className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap ${mode === m.id ? 'bg-room text-[#0B0D12]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}>
            {m.label}
          </button>
        ))}
      </div>

      {sessions.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto" aria-label="Cronologia">
          {sessions.filter((s) => s.mode === mode).slice(0, 10).map((s) => (
            <span key={s.id} className="flex items-center gap-1 shrink-0">
              <button onClick={() => openSession(s.id, s.mode)}
                className={`px-2.5 py-1.5 text-[11px] rounded-lg border ${sessionId === s.id ? 'border-room text-room-bright' : 'border-zinc-800 text-zinc-500'}`}>
                {new Date(s.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
              </button>
              <button aria-label="Elimina sessione" className="text-zinc-700 hover:text-red-400" onClick={async () => {
                await fetch(`/api/room/coach?id=${s.id}`, { method: 'DELETE', headers: await auth() });
                setSessions((p) => p.filter((x) => x.id !== s.id));
                if (sessionId === s.id) { setSessionId(null); setMsgs([]); }
              }}><Trash2 size={12} /></button>
            </span>
          ))}
        </div>
      )}

      {err && <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl" role="alert">{err}</div>}

      <div className="space-y-3 mb-4 max-h-[45vh] overflow-y-auto" aria-live="polite" aria-label="Conversazione">
        {msgs.length === 0 && (
          <p className="text-sm text-zinc-500 border border-dashed border-zinc-800 rounded-2xl p-6 text-center">
            {MODES.find((m) => m.id === mode)?.hint}
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-2xl p-4 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 ml-8' : 'bg-black border border-zinc-800 text-zinc-200 mr-8'}`}>
            {m.content || (streaming ? '…' : '')}
            {mode === 'ask' && m.role === 'assistant' && m.content && (
              <button onClick={() => publishAsk(m.content)} className="block mt-3 px-3 py-1.5 text-xs font-bold bg-room text-[#0B0D12] rounded-lg">
                Pubblica in Ask the club
              </button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input aria-label="Messaggio al coach" className={input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Scrivi al coach..." maxLength={4000} disabled={streaming} />
        <button aria-label="Invia" disabled={streaming} className="px-4 py-2 bg-room text-[#0B0D12] rounded-xl font-bold disabled:opacity-60">
          {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
      {mode === 'ask' && lastAssistant === '' && (
        <p className="text-[11px] text-zinc-600 mt-2">Suggerimento: descrivi idea + cosa hai già provato + la domanda precisa.</p>
      )}
    </div>
  );
}
