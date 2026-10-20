'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { roomAuthHeaders } from '@/lib/auth-token';
import { Loader2 } from 'lucide-react';
import { roomInput as input } from '../../../ui';

type Reaction = { emoji: string; count: number; mine: boolean };
type Post = { id: string; body: string; created_at: string; author: string; mine: boolean; reactions: Reaction[] };

// Rimuove le emoji dal testo dei messaggi.
const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0E}\u{FE0F}\u{200D}\u{20E3}]/gu;
const stripEmoji = (t: string) => t.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();

export default function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [topic, setTopic] = useState<{ title: string; body: string; tag: string; author: string; reactions: Reaction[] } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { params.then((p) => setId(p.id)); }, [params]);
  useEffect(() => {
    if (!id) return;
    (async () => {
      const r = await fetch(`/api/room/forum/${id}`, { headers: await roomAuthHeaders() });
      if (r.ok) {
        const d = await r.json();
        setTopic(d.topic);
        setPosts(d.posts);
      }
      setLoading(false);
    })();
  }, [id]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = stripEmoji(reply);
    if (!body) return;
    const r = await fetch('/api/room/forum', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...(await roomAuthHeaders()) },
      body: JSON.stringify({ topic_id: id, body }),
    });
    if (r.ok) {
      setReply('');
      const d = await fetch(`/api/room/forum/${id}`, { headers: await roomAuthHeaders() }).then((x) => x.json());
      setPosts(d.posts);
    }
  };

  if (loading) return <div className="flex justify-center py-20" role="status"><Loader2 className="animate-spin text-room" /></div>;
  if (!topic) return <p className="text-sm text-zinc-400">Topic non trovato. <Link href="/room/community" className="text-room font-bold">Torna indietro</Link></p>;

  return (
    <div>
      <Link href="/room/community" className="text-xs font-bold text-room">← Forum</Link>
      <h1 className="text-xl font-extrabold mt-2 break-words">{topic.title}</h1>
      <p className="text-[11px] text-zinc-500">{topic.author} · {topic.tag}</p>
      {topic.body && <p className="text-sm text-zinc-300 mt-3 break-words [overflow-wrap:anywhere]">{stripEmoji(topic.body)}</p>}

      <ul className="space-y-2 mt-6 min-w-0">
        {posts.map((p) => (
          <li key={p.id} className="border border-zinc-800 rounded-2xl p-3 min-w-0">
            <p className="text-[11px] font-bold text-room-bright">{p.author}</p>
            <p className="text-sm text-zinc-200 mt-1 break-words [overflow-wrap:anywhere]">{stripEmoji(p.body)}</p>
          </li>
        ))}
        {posts.length === 0 && <li className="text-sm text-zinc-500 text-center py-6">Nessuna risposta. Scrivi la prima</li>}
      </ul>

      <form onSubmit={send} className="flex gap-2 mt-4">
        <input aria-label="Scrivi una risposta" className={input} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Rispondi..." maxLength={5000} />
        <button className="px-4 py-2 bg-room text-[#0B0D12] text-sm font-bold rounded-xl">Invia</button>
      </form>
    </div>
  );
}
