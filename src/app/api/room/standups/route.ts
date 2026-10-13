import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, ownStartup, recordShip, unauthorized } from '@/lib/room/api';
import { cleanStr, validDate } from '@/lib/room/m2';

export const runtime = 'nodejs';

// Standup giornaliero per startup (upsert su user+startup+giorno). Privato.
export async function GET(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const startupId = sp.get('startup_id');
  const day = sp.get('day') || new Date().toISOString().slice(0, 10);
  if (!validDate(day)) return NextResponse.json({ message: 'Giorno non valido' }, { status: 400 });
  let q = supabaseAdmin.from('standups').select('*').eq('user_id', user.id).eq('day', day);
  if (startupId) {
    if (!(await ownStartup(user.id, startupId))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
    q = q.eq('startup_id', startupId);
  }
  const { data } = await q;
  return NextResponse.json({ standups: data || [] });
}

export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const startupId = typeof body.startup_id === 'string' ? body.startup_id : '';
  const day = typeof body.day === 'string' && body.day ? body.day : new Date().toISOString().slice(0, 10);
  if (!startupId || !validDate(day)) return NextResponse.json({ message: 'Startup e giorno richiesti' }, { status: 400 });
  if (!(await ownStartup(user.id, startupId))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });

  const row = {
    user_id: user.id, startup_id: startupId, day,
    done: cleanStr(body.done, 2000), todo: cleanStr(body.todo, 2000), blockers: cleanStr(body.blockers, 2000),
  };
  const { data, error: up } = await supabaseAdmin.from('standups').upsert(row, { onConflict: 'user_id,startup_id,day' }).select().single();
  if (up) return NextResponse.json({ message: 'Errore salvataggio standup' }, { status: 500 });
  await recordShip(user.id, 'standup', startupId);
  return NextResponse.json({ standup: data });
}
