import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember } from '@/lib/room/community';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `notifications:${user.id}`), 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const { data } = await supabaseAdmin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  const unread = (data || []).filter((n: { read: boolean }) => !n.read).length;
  return NextResponse.json({ notifications: data || [], unread });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `notifications-read:${user.id}`), 120, 60_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.all === true) {
    await supabaseAdmin.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    return NextResponse.json({ message: 'Tutte lette' });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  await supabaseAdmin.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ message: 'Letta' });
}
