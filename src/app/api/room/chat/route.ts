import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireMember, authorsFor, blockedIds, displayName } from '@/lib/room/community';
import { isValidUrlOrEmpty } from '@/lib/room/validation';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const WINDOW_MS = 7 * 24 * 3600 * 1000;

// Chat live (polling) con finestra mobile di 7 giorni. Testo, GIF, note vocali, reazioni.
export async function GET(req: NextRequest) {
  const { error, user, profile } = await requireMember(req);
  if (error || !user) return error;
  const sp = new URL(req.url).searchParams;
  const since = sp.get('since');
  const limit = Math.min(100, Math.max(1, Number(sp.get('limit')) || 50));

  // Prune opportunistica oltre i 7 giorni
  await supabaseAdmin.from('chat_messages').delete().lt('created_at', new Date(Date.now() - WINDOW_MS).toISOString());

  let q = supabaseAdmin.from('chat_messages').select('*').gte('created_at', new Date(Date.now() - WINDOW_MS).toISOString()).order('created_at', { ascending: false }).limit(limit);
  if (since) q = q.gt('created_at', since);
  const { data: msgs } = await q;
  const list = (msgs || []).reverse();

  const blocked = await blockedIds(user.id);
  const visible = list.filter((m: { user_id: string }) => !blocked.has(m.user_id));
  const ids = visible.map((m: { id: string }) => m.id);
  let reactions: Record<string, Array<{ emoji: string; count: number; mine: boolean }>> = {};
  if (ids.length > 0) {
    const { data: r } = await supabaseAdmin.from('chat_reactions').select('message_id,emoji,user_id').in('message_id', ids);
    const agg = new Map<string, Map<string, { count: number; mine: boolean }>>();
    for (const x of r || []) {
      if (!agg.has(x.message_id)) agg.set(x.message_id, new Map());
      const m = agg.get(x.message_id)!;
      const e = m.get(x.emoji) || { count: 0, mine: false };
      e.count += 1;
      if (x.user_id === user.id) e.mine = true;
      m.set(x.emoji, e);
    }
    for (const [mid, m] of agg) reactions[mid] = [...m.entries()].map(([emoji, v]) => ({ emoji, ...v }));
  }
  const authors = await authorsFor(visible.map((m: { user_id: string }) => m.user_id));
  return NextResponse.json({
    messages: visible.map((m: Record<string, unknown>) => ({
      ...m,
      author: displayName(authors[m.user_id as string]),
      mine: m.user_id === user.id,
      reactions: reactions[m.id as string] || [],
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  const rl = await rateLimit(rateLimitKey(req, `chat:${user.id}`), 20, 60_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Rallenta un attimo.' }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : '';
  const gif = typeof body.gif_url === 'string' ? body.gif_url.trim().slice(0, 1000) : '';
  const audio = typeof body.audio_path === 'string' ? body.audio_path.trim().slice(0, 500) : '';
  if (gif && !isValidUrlOrEmpty(gif)) return NextResponse.json({ message: 'GIF non valida' }, { status: 400 });
  if (!text && !gif && !audio) return NextResponse.json({ message: 'Messaggio vuoto' }, { status: 400 });
  if (audio) {
    const { data: exists } = await supabaseAdmin.storage.from('voice-notes').list('', { search: audio.split('/').pop() });
    if (!exists || exists.length === 0) return NextResponse.json({ message: 'Audio non trovato' }, { status: 400 });
  }

  const { data, error: ins } = await supabaseAdmin.from('chat_messages').insert({
    user_id: user.id, body: text, gif_url: gif || null, audio_path: audio || null,
    audio_seconds: typeof body.audio_seconds === 'number' ? Math.min(300, Math.max(1, Math.round(body.audio_seconds))) : null,
  }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore invio' }, { status: 500 });
  return NextResponse.json({ message: data }, { status: 201 });
}
