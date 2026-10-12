import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireMember, authorsFor, displayName } from '@/lib/room/community';

export const runtime = 'nodejs';

// Blocca un membro: nasconde tutti i suoi contenuti (liste filtrate lato server).
export async function GET(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  const { data } = await supabaseAdmin.from('blocks').select('blocked_id').eq('blocker_id', user.id);
  const authors = await authorsFor((data || []).map((b: { blocked_id: string }) => b.blocked_id));
  return NextResponse.json({
    blocked: (data || []).map((b: { blocked_id: string }) => ({ id: b.blocked_id, name: displayName(authors[b.blocked_id]) })),
  });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const targetHandle = typeof body.handle === 'string' ? body.handle.trim().toLowerCase().replace(/^@/, '') : '';
  if (!targetHandle) return NextResponse.json({ message: 'Handle mancante' }, { status: 400 });
  const { data: target } = await supabaseAdmin.from('profiles').select('id,handle').eq('handle', targetHandle).maybeSingle();
  if (!target || target.id === user.id) return NextResponse.json({ message: 'Membro non valido' }, { status: 400 });
  await supabaseAdmin.from('blocks').upsert({ blocker_id: user.id, blocked_id: target.id });
  return NextResponse.json({ message: `Hai bloccato @${targetHandle}. I suoi contenuti sono nascosti.` });
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  const id = new URL(req.url).searchParams.get('id');
  await supabaseAdmin.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', id);
  return NextResponse.json({ message: 'Blocco rimosso' });
}
