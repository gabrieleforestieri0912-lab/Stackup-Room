import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember, authorsFor, blockedIds, displayName, EMOJI } from '@/lib/room/community';

export const runtime = 'nodejs';

// Dettaglio topic + risposte + reazioni.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: topic } = await supabaseAdmin.from('forum_topics').select('*').eq('id', id).maybeSingle();
  if (!topic) return NextResponse.json({ message: 'Topic non trovato' }, { status: 404 });
  const { data: posts } = await supabaseAdmin.from('forum_posts').select('*').eq('topic_id', id).order('created_at');
  const blocked = await blockedIds(user.id);
  const visible = (posts || []).filter((p: { user_id: string }) => !blocked.has(p.user_id));
  const authors = await authorsFor([topic.user_id, ...visible.map((p: { user_id: string }) => p.user_id)]);

  const { data: reacts } = await supabaseAdmin.from('forum_reactions').select('target_id,emoji,user_id').eq('target_type', 'topic').eq('target_id', id);
  const { data: postReacts } = await supabaseAdmin.from('forum_reactions').select('target_id,emoji,user_id').eq('target_type', 'post').in('target_id', visible.map((p: { id: string }) => p.id));
  const agg = (rows: Array<{ target_id: string; emoji: string; user_id: string }>) => {
    const m: Record<string, Array<{ emoji: string; count: number; mine: boolean }>> = {};
    const by = new Map<string, Map<string, { count: number; mine: boolean }>>();
    for (const r of rows || []) {
      if (!by.has(r.target_id)) by.set(r.target_id, new Map());
      const e = by.get(r.target_id)!.get(r.emoji) || { count: 0, mine: false };
      e.count += 1;
      if (r.user_id === user.id) e.mine = true;
      by.get(r.target_id)!.set(r.emoji, e);
    }
    for (const [tid, mm] of by) m[tid] = [...mm.entries()].map(([emoji, v]) => ({ emoji, ...v }));
    return m;
  };
  const topicR = agg(reacts || [])[id] || [];
  const postR = agg(postReacts || []);

  return NextResponse.json({
    topic: { ...topic, author: displayName(authors[topic.user_id]), mine: topic.user_id === user.id, reactions: topicR },
    posts: visible.map((p: Record<string, unknown>) => ({
      ...p, author: displayName(authors[p.user_id as string]), mine: p.user_id === user.id, reactions: postR[p.id as string] || [],
    })),
  });
}

// Reazione a topic o risposta (toggle).
export async function POST(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const target = body.target_type === 'post' ? 'post' : 'topic';
  const targetId = typeof body.target_id === 'string' ? body.target_id : '';
  const emoji = typeof body.emoji === 'string' ? body.emoji : '';
  if (!(EMOJI as readonly string[]).includes(emoji) || !targetId) return NextResponse.json({ message: 'Reazione non valida' }, { status: 400 });

  const { data: existing } = await supabaseAdmin.from('forum_reactions').select('*').eq('target_type', target).eq('target_id', targetId).eq('user_id', user.id).eq('emoji', emoji).maybeSingle();
  if (existing) {
    await supabaseAdmin.from('forum_reactions').delete().eq('target_type', target).eq('target_id', targetId).eq('user_id', user.id).eq('emoji', emoji);
    return NextResponse.json({ reacted: false });
  }
  await supabaseAdmin.from('forum_reactions').insert({ target_type: target, target_id: targetId, user_id: user.id, emoji });
  return NextResponse.json({ reacted: true });
}
