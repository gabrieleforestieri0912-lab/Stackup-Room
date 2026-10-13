import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, ownStartup, recordShip, unauthorized } from '@/lib/room/api';
import { cleanStr, validDate } from '@/lib/room/m2';

export const runtime = 'nodejs';

// Tracker personalizzati: metriche giornaliere per startup (numero o sì/no).
export async function GET(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const sp = new URL(req.url).searchParams;
  const startupId = sp.get('startup_id');
  const days = Math.min(60, Math.max(7, Number(sp.get('days')) || 14));
  let q = supabaseAdmin.from('custom_trackers').select('*').eq('user_id', user.id).order('created_at');
  if (startupId) {
    if (!(await ownStartup(user.id, startupId))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
    q = q.eq('startup_id', startupId);
  }
  const { data: trackers } = await q;
  const ids = (trackers || []).map((t: { id: string }) => t.id);
  let entries: Record<string, Array<{ day: string; value_num: number }>> = {};
  if (ids.length > 0) {
    const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
    const { data } = await supabaseAdmin.from('tracker_entries').select('tracker_id,day,value_num').in('tracker_id', ids).gte('day', since).order('day');
    for (const e of data || []) {
      if (!entries[e.tracker_id]) entries[e.tracker_id] = [];
      entries[e.tracker_id].push({ day: e.day, value_num: Number(e.value_num) });
    }
  }
  return NextResponse.json({ trackers: trackers || [], entries });
}

export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = cleanStr(body.name, 60);
  const startupId = typeof body.startup_id === 'string' ? body.startup_id : '';
  const kind = body.kind === 'boolean' ? 'boolean' : 'number';
  if (!name || !startupId) return NextResponse.json({ message: 'Nome e startup richiesti' }, { status: 400 });
  if (!(await ownStartup(user.id, startupId))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
  const { data, error: ins } = await supabaseAdmin.from('custom_trackers').insert({
    user_id: user.id, startup_id: startupId, name, kind, unit: cleanStr(body.unit, 20) || null,
  }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore creazione tracker' }, { status: 500 });
  return NextResponse.json({ tracker: data }, { status: 201 });
}

// Registra il valore di oggi (upsert). Loggare = giorno shippato.
export async function PUT(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const trackerId = typeof body.tracker_id === 'string' ? body.tracker_id : '';
  const day = typeof body.day === 'string' && body.day ? body.day : new Date().toISOString().slice(0, 10);
  if (!validDate(day)) return NextResponse.json({ message: 'Giorno non valido' }, { status: 400 });
  const { data: t } = await supabaseAdmin.from('custom_trackers').select('id,kind,startup_id').eq('id', trackerId).eq('user_id', user.id).maybeSingle();
  if (!t) return NextResponse.json({ message: 'Tracker non trovato' }, { status: 404 });
  let value = Number(body.value);
  if (!Number.isFinite(value)) return NextResponse.json({ message: 'Valore non valido' }, { status: 400 });
  if (t.kind === 'boolean') value = value ? 1 : 0;
  else value = Math.min(1000000, Math.max(0, Math.round(value * 100) / 100));
  const { error: up } = await supabaseAdmin.from('tracker_entries').upsert(
    { tracker_id: trackerId, user_id: user.id, day, value_num: value },
    { onConflict: 'tracker_id,day' },
  );
  if (up) return NextResponse.json({ message: 'Errore salvataggio' }, { status: 500 });
  await recordShip(user.id, 'tracker', t.startup_id);
  return NextResponse.json({ message: 'Registrato' });
}

export async function DELETE(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const id = new URL(req.url).searchParams.get('id');
  const { data: t } = await supabaseAdmin.from('custom_trackers').select('id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!t) return NextResponse.json({ message: 'Tracker non trovato' }, { status: 404 });
  await supabaseAdmin.from('custom_trackers').delete().eq('id', id);
  return NextResponse.json({ message: 'Tracker eliminato' });
}
