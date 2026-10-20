'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { roomAuthHeaders } from '@/lib/auth-token';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Send, Mic, Trash2, Flag, Reply, Pencil } from 'lucide-react';
import { roomInput as input } from '../ui';

type Reaction = { emoji: string; count: number; mine: boolean };
type Msg = {
  id: string; body: string; gif_url: string | null; audio_path: string | null;
  audio_seconds: number | null; created_at: string; author: string; mine: boolean; reactions: Reaction[];
  reply_to: string | null; edited_at: string | null;
  reply: { author: string; body: string; hidden: boolean } | null;
};

const EMOJI = ['🔥', '🚀', '💡', '🙌'];

async function authed(path: string, init?: RequestInit) {
  return fetch(path, { ...init, headers: { ...(init?.headers || {}), ...(await roomAuthHeaders()) } });
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

function VoiceNote({ path, seconds }: { path: string; seconds: number | null; mine: boolean }) {
  const { url, load } = useAudioPlayer(path);

  return (
    <span className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-2 flex-wrap">
        <button
          onClick={async () => {
            const u = await load();
            if (u) new Audio(u).play().catch(() => {});
          }}
          className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-[11px] font-bold hover:border-room"
          aria-label={`Riproduci nota vocale${seconds ? ` di ${seconds} secondi` : ''}`}
        >
          ▶ {seconds ? `${seconds}s` : 'Audio'}
        </button>
      </span>
      {url && <audio controls src={url} className="h-7 max-w-[200px]" />}
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
    <span className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r) => (
        <button key={r.emoji} onClick={() => onReact(r.emoji)} aria-pressed={r.mine}
          className={`px-1.5 py-0.5 text-[11px] rounded-md border transition-colors ${r.mine ? 'border-room bg-room/15 text-room-bright' : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'}`}>
          {r.emoji} {r.count}
        </button>
      ))}
      <span className="contents">
        {EMOJI.filter((e) => !reactions.some((r) => r.emoji === e)).map((e) => (
          <button key={e} onClick={() => onReact(e)} aria-label={`Reagisci con ${e}`}
            className="px-1 py-0.5 text-[11px] rounded-md border border-transparent hover:border-zinc-700 hover:bg-zinc-900 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">{e}</button>
        ))}
      </span>
    </span>
  );
}

export default function ChatTab({ onPresence }: { onPresence?: (p: { online: number; typing: number }) => void }) {
  const { user } = useAuth();
  const userId = user?.id || user?._id || null;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
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

  // Presenza: chiave stabile = utente (un tab o dieci, conta uno) + "sta scrivendo" altrui.
  // Solo conteggi, nessuna identità esposta.
  useEffect(() => {
    if (!userId) {
      setOnline(1);
      setTyping(0);
      return;
    }
    const chan = supabase.channel('room-chat', { config: { presence: { key: userId } } });
    const sync = () => {
      const state = chan.presenceState() as Record<string, Array<{ typing?: boolean }>>;
      setOnline(Math.max(1, Object.keys(state).length));
      setTyping(
        Object.entries(state).filter(([k]) => k !== userId).filter(([, metas]) => metas.some((p) => p.typing)).length,
      );
    };
    chan.on('presence', { event: 'sync' }, sync).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        chanRef.current = chan;
        chan.track({ typing: false });
      }
    });
    return () => { supabase.removeChannel(chan); chanRef.current = null; };
  }, [userId]);

  const signalTyping = () => {
    chanRef.current?.track({ typing: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => chanRef.current?.track({ typing: false }), 2500);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [msgs.length]);

  useEffect(() => {
    onPresence?.({ online, typing });
  }, [online, typing, onPresence]);

  const send = async (extra?: { audio_path?: string; audio_seconds?: number }) => {
    if (!text.trim() && !extra?.audio_path) return;
    const bodyText = text;
    // Ottimistico: mostra subito il messaggio
    const tempId = `temp-${Date.now()}`;
    const optimistic: Msg = {
      id: tempId, body: bodyText, gif_url: null, audio_path: extra?.audio_path || null,
      audio_seconds: extra?.audio_seconds || null, created_at: new Date().toISOString(),
      author: user?.name || user?.email || 'Tu', mine: true, reactions: [],
      reply_to: replyTo?.id || null, edited_at: null, reply: replyTo ? { author: replyTo.author, body: replyTo.body, hidden: false } : null,
    };
    setMsgs((prev) => [...prev, optimistic]);
    setText(''); setReplyTo(null);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const r = await authed('/api/room/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: bodyText, reply_to: replyTo?.id || null, ...extra }),
    });
    if (r.ok) {
      load(true);
    } else {
      setMsgs((prev) => prev.filter((m) => m.id !== tempId));
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
        const r = await authed('/api/room/voice', { method: 'POST', body: fd });
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

  if (loading) return <div className="flex justify-center items-center min-h-[calc(100dvh-320px)]" role="status" aria-label="Caricamento"><Loader2 className="animate-spin text-room" /></div>;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto flex-1 min-h-[calc(100dvh-260px)]">
      <ul className="flex-1 min-h-[320px] space-y-2 mb-4 overflow-y-auto pr-1" aria-live="polite" aria-label="Messaggi chat">
        {msgs.length === 0 && (
          <li className="flex flex-col items-center justify-center text-center min-h-[320px] h-full border border-dashed border-zinc-800 rounded-2xl py-16 px-6">
            <p className="text-sm text-zinc-400 font-bold">Nessun messaggio negli ultimi 7 giorni.</p>
            <p className="text-sm text-zinc-500 mt-1">Rompi il ghiaccio 👇</p>
          </li>
        )}
        {msgs.map((m, i) => {
          const prev = i > 0 ? msgs[i - 1] : null;
          const grouped = Boolean(prev && prev.author === m.author && prev.mine === m.mine
            && new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 5 * 60 * 1000);
          return (
          <li key={m.id} className={`relative group flex items-start gap-3 px-2 py-1 -mx-2 rounded-lg hover:bg-zinc-900/50 transition-colors animate-in fade-in duration-150 ${grouped ? 'mt-0' : 'mt-2'}`}>
            <span className={`shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-[11px] font-black mt-0.5 ${m.mine ? 'bg-room/20 border border-room/40 text-room-bright' : 'bg-zinc-800 border border-zinc-700 text-zinc-300'} ${grouped ? 'invisible' : ''}`}>
              {m.mine && user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar utente
                <img src={user.avatar} alt="Tu" className="w-full h-full object-cover" />
              ) : (
                m.author.replace(/^@/, '').slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="flex-1 min-w-0">
            {grouped ? (
              <span className="absolute left-0 top-0 w-9 text-center text-[9px] text-zinc-600 leading-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden>
                {new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[13px] font-bold ${m.mine ? 'text-room-bright' : 'text-white'}`}>{m.author}</span>
              <time className="text-[10px] text-zinc-600">{new Date(m.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}{m.edited_at ? ' · modificato' : ''}</time>
              <span className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
            )}
            {m.reply && (
              <div className="flex items-center gap-1.5 mb-0.5 text-[11px] text-zinc-500">
                <span className="w-4 h-3 border-l-2 border-t-2 border-zinc-700 rounded-tl-md -mb-1" aria-hidden />
                <span className="font-bold text-zinc-400">{m.reply.author}</span>
                <span className="truncate max-w-[240px]">{m.reply.hidden ? <em>messaggio nascosto (autore bloccato)</em> : m.reply.body || <em>allegato</em>}</span>
              </div>
            )}
            {editingId === m.id ? (
              <div className="flex gap-2">
                <input aria-label="Modifica messaggio" autoFocus className={input} value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={2000}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m.id); if (e.key === 'Escape') setEditingId(null); }} />
                <button onClick={() => saveEdit(m.id)} className="px-3 py-2 bg-room text-[#0B0D12] text-xs font-bold rounded-xl">OK</button>
              </div>
            ) : (
              m.body && <p className="text-[13px] leading-snug text-zinc-200 break-words">{renderBody(m.body)}</p>
            )}
            {m.audio_path && <div className="mt-2"><VoiceNote path={m.audio_path} seconds={m.audio_seconds} mine={m.mine} /></div>}
            <Reactions reactions={m.reactions} onReact={async (emoji) => {
              await authed(`/api/room/chat/${m.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) });
              load(true);
            }} />
            </div>
          </li>
          );
        })}
        <div ref={bottomRef} />
      </ul>

      {replyTo && (
        <div className="flex items-center gap-2 border border-zinc-800 rounded-xl px-3 py-2 mb-2 text-xs text-zinc-400">
          <span className="flex-1 truncate">Rispondi a <strong className="text-room-bright">{replyTo.author}</strong>: {replyTo.body.slice(0, 80) || 'allegato'}</span>
          <button onClick={() => setReplyTo(null)} aria-label="Annulla risposta" className="font-bold text-zinc-500 hover:text-white">×</button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input aria-label="Scrivi un messaggio" className={input} value={text} onChange={(e) => { setText(e.target.value); signalTyping(); }} placeholder="Scrivi alla room... (usa @handle per menzionare)" maxLength={2000} />
        <button type="button" onClick={toggleRec} aria-label={recording ? 'Ferma registrazione' : 'Registra nota vocale'} aria-pressed={recording}
          className={`px-3 py-2 border text-xs font-bold rounded-xl ${recording ? 'bg-red-600 border-red-600 text-white animate-pulse' : 'bg-zinc-900 border-zinc-700'}`}>
          <Mic size={14} />
        </button>
        <button aria-label="Invia" className="px-4 py-2 bg-room text-[#0B0D12] rounded-xl font-bold"><Send size={16} /></button>
      </form>
    </div>
  );
}
