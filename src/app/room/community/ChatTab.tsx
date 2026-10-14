'use client';

import { useCallback, useEffect, useRef, useState, FormEvent } from 'react';
import { getAccessToken } from '@/lib/auth-token';
import { supabase } from '@/lib/supabase';
import { Loader2, Send, Mic, Trash2, Flag, Reply, Pencil } from 'lucide-react';

type Reaction = { emoji: string; count: number; mine: boolean };
type Msg = {
  id: string; body: string; gif_url: string | null; audio_path: string | null;
  audio_seconds: number | null; created_at: string; author: string; mine: boolean; reactions: Reaction[];
  reply_to: string | null; edited_at: string | null;
  reply: { author: string; body: string; hidden: boolean } | null;
};

const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-room outline-none text-zinc-100 text-sm rounded-xl';
const EMOJI = ['🔥', '🚀', '💡', '🙌'];

async function authed(path: string, init?: RequestInit) {
  return fetch(path, { ...init, headers: { ...(init?.headers || {}), ...(await auth()) } });
}

function useAudioPlayer(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!path || url) return url;
    const r = await authed(`/api/room/voice?path=${encodeURIComponent(path)}`);
    if (!r.ok) return null;
    const u = await r.json().then((d) => d.url);
    setUrl(u);
    return u as string;
  }, [path, url]);
  return { url, load };
}

function VoiceNote({ path, seconds, mine }: { path: string; seconds: number | null; mine: boolean }) {
  const { url, load } = useAudioPlayer(path);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [sttErr, setSttErr] = useState('');

  const transcribe = async () => {
    setSttErr('');
    setTranscribing(true);
    try {
      const r = await authed('/api/room/coach/transcribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_path: path }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setSttErr(d.detail || d.message || 'Trascrizione non disponibile.');
        return;
      }
      setTranscript(d.transcript);
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <span className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-2 flex-wrap">
        <button
          onClick={async () => {
            const u = await load();
            if (u) new Audio(u).play().catch(() => {});
          }}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-bold hover:border-room"
          aria-label={`Riproduci nota vocale${seconds ? ` di ${seconds} secondi` : ''}`}
        >
          ▶ {seconds ? `${seconds}s` : 'Audio'}
        </button>
        {mine && !transcript && (
          <button onClick={transcribe} disabled={transcribing} className="px-3 py-1.5 border border-zinc-700 rounded-lg text-xs font-bold hover:border-room disabled:opacity-60">
            {transcribing ? 'Trascrivo...' : 'Trascrivi'}
          </button>
        )}
      </span>
      {url && <audio controls src={url} className="h-8 max-w-[220px]" />}
      {sttErr && <span className="text-[11px] text-zinc-500">{sttErr}</span>}
      {transcript && <span className="text-xs text-zinc-300 border-l-2 border-room pl-2 italic">{transcript}</span>}
    </span>
  );
}

function renderBody(body: string) {
  // Evidenzia @mention senza librerie esterne
  const parts = body.split(/(@[a-z0-9_]{3,24})/gi);
  return parts.map((p, i) =>
    /^@[a-z0-9_]{3,24}$/i.test(p)
      ? <strong key={i} className="text-room-bright">{p}</strong>
      : <span key={i}>{p}</span>,
  );
}

function Reactions({ reactions, onReact }: { reactions: Reaction[]; onReact: (e: string) => void }) {
  return (
    <span className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => (
        <button key={r.emoji} onClick={() => onReact(r.emoji)} aria-pressed={r.mine}
          className={`px-2 py-0.5 text-xs rounded-lg border ${r.mine ? 'border-room bg-room/20' : 'border-zinc-800 bg-zinc-950'}`}>
          {r.emoji} {r.count}
        </button>
      ))}
      {EMOJI.filter((e) => !reactions.some((r) => r.emoji === e)).map((e) => (
        <button key={e} onClick={() => onReact(e)} aria-label={`Reagisci con ${e}`} className="px-1.5 py-0.5 text-xs rounded-lg border border-transparent hover:border-zinc-700 opacity-60 hover:opacity-100">{e}</button>
      ))}
    </span>
  );
}

export default function ChatTab() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [gifQ, setGifQ] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [showGifs, setShowGifs] = useState(false);
  const [recording, setRecording] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [online, setOnline] = useState(1);
  const [typing, setTyping] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chanRef = useRef<{ track: (s: object) => void } | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const last = msgs.length > 0 ? msgs[msgs.length - 1].created_at : null;
    void last;
    const r = await authed('/api/room/chat?limit=50');
    if (r.ok) setMsgs(await r.json().then((d) => d.messages));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Presenza: online ora + "sta scrivendo" (solo conteggi, nessuna identità esposta)
  useEffect(() => {
    const chan = supabase.channel('room-chat', { config: { presence: { key: Math.random().toString(36).slice(2) } } });
    const sync = () => {
      const state = chan.presenceState() as Record<string, Array<{ typing?: boolean }>>;
      const all = Object.values(state).flat();
      setOnline(Math.max(1, all.length));
      setTyping(all.filter((p) => p.typing).length);
    };
    chan.on('presence', { event: 'sync' }, sync).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        chanRef.current = chan;
        chan.track({ typing: false });
      }
    });
    return () => { supabase.removeChannel(chan); chanRef.current = null; };
  }, []);

  const signalTyping = () => {
    chanRef.current?.track({ typing: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => chanRef.current?.track({ typing: false }), 2500);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [msgs.length]);

  const send = async (extra?: { gif_url?: string; audio_path?: string; audio_seconds?: number }) => {
    if (!text.trim() && !extra?.gif_url && !extra?.audio_path) return;
    const r = await authed('/api/room/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text, reply_to: replyTo?.id || null, ...extra }),
    });
    if (r.ok) {
      setText('');
      setShowGifs(false);
      setReplyTo(null);
      load(true);
    }
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    const r = await authed(`/api/room/chat/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editText }),
    });
    if (r.ok) {
      setEditingId(null);
      load(true);
    } else {
      alert('Modificabile solo entro 15 minuti.');
    }
  };

  const searchGifs = async (e: FormEvent) => {
    e.preventDefault();
    const r = await authed(`/api/room/gifs?q=${encodeURIComponent(gifQ || 'startup')}`);
    const d = await r.json().catch(() => ({}));
    setGifs(d.gifs || []);
    if (!r.ok && r.status === 501) setGifs([]);
  };

  const toggleRec = async () => {
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        if (blob.size === 0) return;
        const fd = new FormData();
        fd.append('audio', blob, 'voce.webm');
        const r = await authed('/api/room/chat/voice', { method: 'POST', body: fd });
        const d = await r.json().catch(() => ({}));
        if (r.ok) send({ audio_path: d.audio_path, audio_seconds: Math.round(blob.size / 16000) });
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      alert('Microfono non disponibile.');
    }
  };

  const report = async (id: string) => {
    const reason = window.prompt('Motivo (spam, odio, nsfw, altro)?', 'spam');
    if (!reason || !['spam', 'odio', 'nsfw', 'altro'].includes(reason)) return;
    await authed('/api/room/reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: 'chat', target_id: id, reason }),
    });
    alert('Segnalazione inviata. Grazie.');
  };

  const block = async (author: string) => {
    if (author === 'Anonimo' || !author.startsWith('@')) { alert('Non puoi bloccare un utente anonimo.'); return; }
    if (!window.confirm(`Bloccare ${author}? I suoi contenuti saranno nascosti.`)) return;
    await authed('/api/room/blocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: author }),
    });
    load(true);
  };

  if (loading) return <div className="flex justify-center py-16" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;

  return (
    <div>
      <p className="text-[11px] text-zinc-500 mb-2" role="status">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" aria-hidden />
        {online} online{typing > 0 ? ` · qualcuno sta scrivendo…` : ''}
      </p>
      <ul className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto pr-1" aria-live="polite" aria-label="Messaggi chat">
        {msgs.length === 0 && <li className="text-sm text-zinc-500 text-center py-8">Nessun messaggio negli ultimi 7 giorni. Rompi il ghiaccio 👇</li>}
        {msgs.map((m) => (
          <li key={m.id} className={`border rounded-2xl p-3 ${m.mine ? 'border-room/40 bg-room/5' : 'border-zinc-800 bg-black'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-room-bright">{m.author}</span>
              <time className="text-[10px] text-zinc-600">{new Date(m.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}{m.edited_at ? ' · modificato' : ''}</time>
              <span className="ml-auto flex gap-1">
                <button onClick={() => setReplyTo(m)} aria-label={`Rispondi a ${m.author}`} className="p-1 text-zinc-600 hover:text-room"><Reply size={12} /></button>
                {!m.mine && (
                  <>
                    <button onClick={() => report(m.id)} aria-label="Segnala messaggio" className="p-1 text-zinc-600 hover:text-room"><Flag size={12} /></button>
                    <button onClick={() => block(m.author)} aria-label="Blocca autore" className="px-1.5 text-[10px] font-bold text-zinc-600 hover:text-red-400">Blocca</button>
                  </>
                )}
                {m.mine && (
                  <>
                    {m.body && !m.audio_path && (
                      <button onClick={() => { setEditingId(m.id); setEditText(m.body); }} aria-label="Modifica messaggio" className="p-1 text-zinc-600 hover:text-room"><Pencil size={12} /></button>
                    )}
                    <button onClick={async () => {
                      if (!window.confirm('Eliminare il messaggio?')) return;
                      await authed(`/api/room/chat/${m.id}`, { method: 'DELETE' });
                      load(true);
                    }} aria-label="Elimina messaggio" className="p-1 text-zinc-600 hover:text-red-400"><Trash2 size={12} /></button>
                  </>
                )}
              </span>
            </div>
            {m.reply && (
              <div className="border-l-2 border-room pl-2 mb-1.5 text-xs text-zinc-400">
                <span className="font-bold text-room-bright">{m.reply.author}</span>{' '}
                {m.reply.hidden ? <em>messaggio nascosto (autore bloccato)</em> : m.reply.body || <em>allegato</em>}
              </div>
            )}
            {editingId === m.id ? (
              <div className="flex gap-2">
                <input aria-label="Modifica messaggio" autoFocus className={input} value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={2000}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m.id); if (e.key === 'Escape') setEditingId(null); }} />
                <button onClick={() => saveEdit(m.id)} className="px-3 py-2 bg-room text-[#0B0D12] text-xs font-bold rounded-xl">OK</button>
              </div>
            ) : (
              m.body && <p className="text-sm text-zinc-200 break-words">{renderBody(m.body)}</p>
            )}
            {m.gif_url && <img src={m.gif_url} alt="GIF" className="mt-2 rounded-xl max-h-48" loading="lazy" /* eslint-disable-line @next/next/no-img-element -- GIF esterne da domini arbitrari */ />}
            {m.audio_path && <div className="mt-2"><VoiceNote path={m.audio_path} seconds={m.audio_seconds} mine={m.mine} /></div>}
            <Reactions reactions={m.reactions} onReact={async (emoji) => {
              await authed(`/api/room/chat/${m.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) });
              load(true);
            }} />
          </li>
        ))}
        <div ref={bottomRef} />
      </ul>

      {showGifs && (
        <div className="border border-zinc-800 rounded-2xl p-3 mb-2">
          <form onSubmit={searchGifs} className="flex gap-2 mb-2">
            <input aria-label="Cerca GIF" className={input} value={gifQ} onChange={(e) => setGifQ(e.target.value)} placeholder="Cerca GIF..." />
            <button className="px-3 py-2 bg-zinc-900 border border-zinc-700 text-xs font-bold rounded-xl">Cerca</button>
          </form>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {gifs.map((g) => (
              <button key={g} onClick={() => send({ gif_url: g })} aria-label="Invia GIF">
                <img src={g} alt="" className="rounded-lg h-20 w-full object-cover" loading="lazy" /* eslint-disable-line @next/next/no-img-element -- GIF esterne da domini arbitrari */ />
              </button>
            ))}
            {gifs.length === 0 && <p className="col-span-3 text-xs text-zinc-500 text-center py-4">Cerca una GIF oppure configura TENOR_API_KEY.</p>}
          </div>
        </div>
      )}

      {replyTo && (
        <div className="flex items-center gap-2 border border-zinc-800 rounded-xl px-3 py-2 mb-2 text-xs text-zinc-400">
          <span className="flex-1 truncate">Rispondi a <strong className="text-room-bright">{replyTo.author}</strong>: {replyTo.body.slice(0, 80) || 'allegato'}</span>
          <button onClick={() => setReplyTo(null)} aria-label="Annulla risposta" className="font-bold text-zinc-500 hover:text-white">×</button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input aria-label="Scrivi un messaggio" className={input} value={text} onChange={(e) => { setText(e.target.value); signalTyping(); }} placeholder="Scrivi alla room... (usa @handle per menzionare)" maxLength={2000} />
        <button type="button" onClick={() => setShowGifs(!showGifs)} aria-label="Aggiungi GIF" aria-pressed={showGifs} className="px-3 py-2 bg-zinc-900 border border-zinc-700 text-xs font-bold rounded-xl">GIF</button>
        <button type="button" onClick={toggleRec} aria-label={recording ? 'Ferma registrazione' : 'Registra nota vocale'} aria-pressed={recording}
          className={`px-3 py-2 border text-xs font-bold rounded-xl ${recording ? 'bg-red-600 border-red-600 text-white animate-pulse' : 'bg-zinc-900 border-zinc-700'}`}>
          <Mic size={14} />
        </button>
        <button aria-label="Invia" className="px-4 py-2 bg-room text-[#0B0D12] rounded-xl font-bold"><Send size={16} /></button>
      </form>
    </div>
  );
}
