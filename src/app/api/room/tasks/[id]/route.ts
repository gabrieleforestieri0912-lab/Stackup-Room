import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, recordShip, unauthorized } from '@/lib/room/api';
import { cleanStr, PRIORITIES, TASK_STATUS, validDate } from '@/lib/room/m2';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: existing } = await supabaseAdmin.from('tasks').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ message: 'Task non trovato' }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if ('title' in body) {
    const t = cleanStr(body.title, 200);
    if (!t) return NextResponse.json({ message: 'Titolo richiesto' }, { status: 400 });
    patch.title = t;
  }
  if ('priority' in body) {
    if (!(PRIORITIES as readonly string[]).includes(String(body.priority))) return NextResponse.json({ message: 'Priorità non valida' }, { status: 400 });
    patch.priority = body.priority;
  }
  if ('status' in body) {
    if (!(TASK_STATUS as readonly string[]).includes(String(body.status))) return NextResponse.json({ message: 'Stato non valido' }, { status: 400 });
    patch.status = body.status;
  }
  if ('due_date' in body) {
    const d = body.due_date == null || body.due_date === '' ? null : body.due_date;
    if (d && !validDate(d)) return NextResponse.json({ message: 'Scadenza non valida' }, { status: 400 });
    patch.due_date = d;
  }

  const { data, error: up } = await supabaseAdmin.from('tasks').update(patch).eq('id', id).select().single();
  if (up) return NextResponse.json({ message: 'Errore salvataggio' }, { status: 500 });
  if (patch.status === 'done') await recordShip(user.id, 'task_done', existing.startup_id);
  return NextResponse.json({ task: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  const { data: existing } = await supabaseAdmin.from('tasks').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!existing) return NextResponse.json({ message: 'Task non trovato' }, { status: 404 });
  await supabaseAdmin.from('tasks').delete().eq('id', id);
  return NextResponse.json({ message: 'Task eliminato' });
}
