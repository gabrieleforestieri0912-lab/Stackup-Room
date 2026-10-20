import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember, EMOJI } from '@/lib/room/community';
import { isAdminEmail } from '@/lib/room/admin';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Reazione a un messaggio (toggle).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `chat-react:${user.id}`), 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const emoji = typeof body.emoji === 'string' ? body.emoji : '';
  if (!(EMOJI as readonly string[]).includes(emoji)) return NextResponse.json({ message: 'Reazione non valida' }, { status: 400 });
  const { data: msg } = await supabaseAdmin.from('chat_messages').select('id').eq('id', id).maybeSingle();
  if (!msg) return NextResponse.json({ message: 'Messaggio non trovato' }, { status: 404 });

  const { data: existing } = await supabaseAdmin.from('chat_reactions').select('*').eq('message_id', id).eq('user_id', user.id).eq('emoji', emoji).maybeSingle();
  if (existing) {
    await supabaseAdmin.from('chat_reactions').delete().eq('message_id', id).eq('user_id', user.id).eq('emoji', emoji);
    return NextResponse.json({ reacted: false });
  }
  await supabaseAdmin.from('chat_reactions').insert({ message_id: id, user_id: user.id, emoji });
  return NextResponse.json({ reacted: true });
}

// Modifica testo proprio entro 15 minuti (marca edited_at).
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: msg } = await supabaseAdmin.from('chat_messages').select('user_id,body,created_at').eq('id', id).maybeSingle();
  if (!msg) return NextResponse.json({ message: 'Messaggio non trovato' }, { status: 404 });
  if (msg.user_id !== user.id) return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
  if (Date.now() - new Date(msg.created_at).getTime() > 15 * 60 * 1000) {
    return NextResponse.json({ message: 'Modificabile solo entro 15 minuti.' }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : '';
  if (!text) return NextResponse.json({ message: 'Testo richiesto' }, { status: 400 });
  const { data, error: up } = await supabaseAdmin.from('chat_messages').update({ body: text, edited_at: new Date().toISOString() }).eq('id', id).select().single();
  if (up) return NextResponse.json({ message: 'Errore salvataggio' }, { status: 500 });
  return NextResponse.json({ message: data });
}

// Elimina messaggio proprio (o admin).
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: msg } = await supabaseAdmin.from('chat_messages').select('user_id,audio_path').eq('id', id).maybeSingle();
  if (!msg) return NextResponse.json({ message: 'Messaggio non trovato' }, { status: 404 });
  const admin = isAdminEmail(user.email);
  if (msg.user_id !== user.id && !admin) return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
  if (msg.audio_path) await supabaseAdmin.storage.from('voice-notes').remove([msg.audio_path]);
  await supabaseAdmin.from('chat_messages').delete().eq('id', id);
  return NextResponse.json({ message: 'Messaggio eliminato' });
}
