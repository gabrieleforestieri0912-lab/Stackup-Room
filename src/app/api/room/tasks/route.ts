import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, ownStartup } from '@/lib/room/api';
import { cleanStr, PRIORITIES } from '@/lib/room/m2';
import { validDate } from '@/lib/room/m2';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const startupId = new URL(req.url).searchParams.get('startup_id');
  let q = supabaseAdmin.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
  if (startupId) {
    if (!(await ownStartup(user.id, startupId))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
    q = q.eq('startup_id', startupId);
  }
  const { data } = await q;
  return NextResponse.json({ tasks: data || [] });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = cleanStr(body.title, 200);
  const startupId = typeof body.startup_id === 'string' ? body.startup_id : '';
  if (!title || !startupId) return NextResponse.json({ message: 'Titolo e startup richiesti' }, { status: 400 });
  if (!(await ownStartup(user.id, startupId))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });

  const priority = (PRIORITIES as readonly string[]).includes(String(body.priority)) ? body.priority : 'med';
  const due = body.due_date == null || body.due_date === '' ? null : body.due_date;
  if (due && !validDate(due)) return NextResponse.json({ message: 'Scadenza non valida' }, { status: 400 });

  const { data, error: ins } = await supabaseAdmin.from('tasks').insert({
    user_id: user.id, startup_id: startupId, title, priority, due_date: due,
  }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore creazione task' }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}
