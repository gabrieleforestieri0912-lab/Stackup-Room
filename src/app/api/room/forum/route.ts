import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember, authorsFor, blockedIds, displayName, notify } from '@/lib/room/community';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';
import { isAdminEmail } from '@/lib/room/admin';

export const runtime = 'nodejs';
const TAGS = ['ask', 'show', 'discussione'] as const;

export async function GET(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const tag = new URL(req.url).searchParams.get('tag');
  let q = supabaseAdmin.from('forum_topics').select('*').order('created_at', { ascending: false }).limit(50);
  if (tag && (TAGS as readonly string[]).includes(tag)) q = q.eq('tag', tag);
  const { data: topics } = await q;
  const blocked = await blockedIds(user.id);
  const visible = (topics || []).filter((t: { user_id: string }) => !blocked.has(t.user_id));
  const ids = visible.map((t: { id: string }) => t.id);
  const counts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: posts } = await supabaseAdmin.from('forum_posts').select('topic_id').in('topic_id', ids);
    for (const p of posts || []) counts[p.topic_id] = (counts[p.topic_id] || 0) + 1;
  }
  const authors = await authorsFor(visible.map((t: { user_id: string }) => t.user_id));
  return NextResponse.json({
    topics: visible.map((t: Record<string, unknown>) => {
      // `user_id` non viene esposto (cfr. anonymous_mode).
      const { user_id: _userId, ...rest } = t;
      return {
        ...rest, author: displayName(authors[t.user_id as string]), mine: t.user_id === user.id, replies: counts[t.id as string] || 0,
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `forum:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 5000) : '';
  const tag = (TAGS as readonly string[]).includes(String(body.tag)) ? body.tag : 'discussione';
  if (!title) return NextResponse.json({ message: 'Titolo richiesto' }, { status: 400 });
  const { data, error: ins } = await supabaseAdmin.from('forum_topics').insert({ user_id: user.id, title, body: text, tag }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore creazione topic' }, { status: 500 });
  return NextResponse.json({ topic: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const id = new URL(req.url).searchParams.get('id');
  const { data: t } = await supabaseAdmin.from('forum_topics').select('user_id').eq('id', id).maybeSingle();
  if (!t) return NextResponse.json({ message: 'Topic non trovato' }, { status: 404 });
  if (t.user_id !== user.id && !isAdminEmail(user.email)) return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
  await supabaseAdmin.from('forum_topics').delete().eq('id', id);
  return NextResponse.json({ message: 'Topic eliminato' });
}

// Risposta a un topic (notifica l'autore).
export async function PUT(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `forum-reply:${user.id}`), 30, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const topicId = typeof body.topic_id === 'string' ? body.topic_id : '';
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 5000) : '';
  if (!topicId || !text) return NextResponse.json({ message: 'Risposta vuota' }, { status: 400 });
  const { data: topic } = await supabaseAdmin.from('forum_topics').select('id,user_id,title').eq('id', topicId).maybeSingle();
  if (!topic) return NextResponse.json({ message: 'Topic non trovato' }, { status: 404 });
  const { data, error: ins } = await supabaseAdmin.from('forum_posts').insert({ topic_id: topicId, user_id: user.id, body: text }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore invio risposta' }, { status: 500 });
  if (topic.user_id !== user.id) {
    await notify(topic.user_id, 'forum_reply', `Nuova risposta al tuo topic "${topic.title}"`, { type: 'topic', id: topicId });
  }
  return NextResponse.json({ post: data }, { status: 201 });
}
