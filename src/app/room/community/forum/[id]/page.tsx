'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { getAccessToken } from '@/lib/auth-token';
import { Loader2 } from 'lucide-react';

type Reaction = { emoji: string; count: number; mine: boolean };
type Post = { id: string; body: string; created_at: string; author: string; mine: boolean; reactions: Reaction[] };
const EMOJI = ['🔥', '🚀', '💡', '🙌'];
const auth = async () => ({ Authorization: `Bearer ${await getAccessToken()}` });
const input = 'w-full px-4 py-2.5 bg-black border border-zinc-800 focus:border-orange-500 outline-none text-zinc-100 text-sm rounded-xl';

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
      const r = await fetch(`/api/room/forum/${id}`, { headers: await auth() });
      if (r.ok) {
        const d = await r.json();
        setTopic(d.topic);
        setPosts(d.posts);
      }
      setLoading(false);
    })();
  }, [id]);

  const react = async (target: string, targetId: string, emoji: string) => {
    await fetch(`/api/room/forum/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ target_type: target, target_id: targetId, emoji }),
    });
    const r = await fetch(`/api/room/forum/${id}`, { headers: await auth() });
    if (r.ok) {
      const d = await r.json();
      setTopic(d.topic);
      setPosts(d.posts);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    const r = await fetch('/api/room/forum', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...(await auth()) },
      body: JSON.stringify({ topic_id: id, body: reply }),
    });
    if (r.ok) {
      setReply('');
      const d = await fetch(`/api/room/forum/${id}`, { headers: await auth() }).then((x) => x.json());
      setPosts(d.posts);
    }
  };

  if (loading) return <div className="flex justify-center py-20" role="status"><Loader2 className="animate-spin text-orange-500" /></div>;
  if (!topic) return <p className="text-sm text-zinc-400">Topic non trovato. <Link href="/room/community" className="text-orange-400 font-bold">Torna indietro</Link></p>;

  return (
    <div>
      <Link href="/room/community" className="text-xs font-bold text-orange-400">← Forum</Link>
      <h1 className="text-xl font-extrabold mt-2">{topic.title}</h1>
      <p className="text-[11px] text-zinc-500">{topic.author} · {topic.tag}</p>
      {topic.body && <p className="text-sm text-zinc-300 mt-3">{topic.body}</p>}
      <div className="flex gap-1 mt-2">
        {EMOJI.map((e) => {
          const mine = topic.reactions.find((r) => r.emoji === e);
          return (
            <button key={e} onClick={() => react('topic', id!, e)}
              className={`px-2 py-0.5 text-xs rounded-lg border ${mine?.mine ? 'border-orange-500 bg-orange-600/20' : 'border-zinc-800'}`}>
              {e} {mine?.count || ''}
            </button>
          );
        })}
      </div>

      <ul className="space-y-2 mt-6">
        {posts.map((p) => (
          <li key={p.id} className="border border-zinc-800 rounded-2xl p-3">
            <p className="text-[11px] font-bold text-orange-300">{p.author}</p>
            <p className="text-sm text-zinc-200 mt-1 break-words">{p.body}</p>
            <div className="flex gap-1 mt-1.5">
              {EMOJI.map((e) => {
                const mine = p.reactions.find((r) => r.emoji === e);
                return (
                  <button key={e} onClick={() => react('post', p.id, e)} aria-pressed={Boolean(mine?.mine)}
                    className={`px-2 py-0.5 text-xs rounded-lg border ${mine?.mine ? 'border-orange-500 bg-orange-600/20' : 'border-zinc-800'}`}>
                    {e} {mine?.count || ''}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
        {posts.length === 0 && <li className="text-sm text-zinc-500 text-center py-6">Nessuna risposta. Scrivi la prima 👇</li>}
      </ul>

      <form onSubmit={send} className="flex gap-2 mt-4">
        <input aria-label="Scrivi una risposta" className={input} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Rispondi..." maxLength={5000} />
        <button className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl">Invia</button>
      </form>
    </div>
  );
}
