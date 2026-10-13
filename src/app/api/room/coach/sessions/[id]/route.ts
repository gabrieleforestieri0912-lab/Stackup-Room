import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember } from '@/lib/room/community';

export const runtime = 'nodejs';

// Cronologia di una sessione (solo proprietario).
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: sess } = await supabaseAdmin.from('ai_sessions').select('id,mode,startup_id,created_at').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!sess) return NextResponse.json({ message: 'Sessione non trovata' }, { status: 404 });
  const { data: messages } = await supabaseAdmin.from('ai_messages').select('role,content,created_at').eq('session_id', id).order('created_at').limit(100);
  return NextResponse.json({ session: sess, messages: messages || [] });
}
