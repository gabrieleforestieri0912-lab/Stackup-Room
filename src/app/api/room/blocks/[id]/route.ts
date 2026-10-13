import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: existing } = await supabaseAdmin.from('time_blocks').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ message: 'Blocco non trovato' }, { status: 404 });
  await supabaseAdmin.from('time_blocks').delete().eq('id', id);
  return NextResponse.json({ message: 'Blocco eliminato' });
}
