import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, recordShip, unauthorized } from '@/lib/room/api';
import { cleanStr } from '@/lib/room/m2';
import { isValidUrlOrEmpty } from '@/lib/room/validation';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: existing } = await supabaseAdmin.from('goals').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ message: 'Obiettivo non trovato' }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if ('title' in body) {
    const t = cleanStr(body.title, 200);
    if (!t) return NextResponse.json({ message: 'Titolo richiesto' }, { status: 400 });
    patch.title = t;
  }
  if ('status' in body) {
    if (!['open', 'done'].includes(String(body.status))) return NextResponse.json({ message: 'Stato non valido' }, { status: 400 });
    patch.status = body.status;
  }
  if ('proof_url' in body) {
    const u = cleanStr(body.proof_url, 1000);
    if (!isValidUrlOrEmpty(u)) return NextResponse.json({ message: 'URL prova non valido' }, { status: 400 });
    patch.proof_url = u || null;
  }
  if ('proof_note' in body) patch.proof_note = cleanStr(body.proof_note, 1000) || null;
  if ('screenshot_path' in body) patch.screenshot_path = cleanStr(body.screenshot_path, 500) || null;

  const { data, error: up } = await supabaseAdmin.from('goals').update(patch).eq('id', id).select().single();
  if (up) return NextResponse.json({ message: 'Errore salvataggio' }, { status: 500 });
  if (patch.status === 'done') await recordShip(user.id, 'goal', existing.startup_id);
  return NextResponse.json({ goal: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: existing } = await supabaseAdmin.from('goals').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ message: 'Obiettivo non trovato' }, { status: 404 });
  await supabaseAdmin.from('goals').delete().eq('id', id);
  return NextResponse.json({ message: 'Obiettivo eliminato' });
}
