import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember, authorsFor, blockedIds, displayName, notify } from '@/lib/room/community';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';
import { isAdminEmail } from '@/lib/room/admin';
import { isValidUrlOrEmpty } from '@/lib/room/validation';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const { data } = await supabaseAdmin.from('events').select('*').gte('starts_at', new Date().toISOString()).order('starts_at').limit(50);
  const blocked = await blockedIds(user.id);
  const visible = (data || []).filter((e: { user_id: string }) => !blocked.has(e.user_id));
  const ids = visible.map((e: { id: string }) => e.id);
  const counts: Record<string, number> = {};
  const mine: Set<string> = new Set();
  if (ids.length > 0) {
    const { data: rsvps } = await supabaseAdmin.from('event_rsvps').select('event_id,user_id').in('event_id', ids);
    for (const r of rsvps || []) {
      counts[r.event_id] = (counts[r.event_id] || 0) + 1;
      if (r.user_id === user.id) mine.add(r.event_id);
    }
  }
  const authors = await authorsFor(visible.map((e: { user_id: string }) => e.user_id));
  return NextResponse.json({
    events: visible.map((e: Record<string, unknown>) => ({
      ...e, author: displayName(authors[e.user_id as string]), mine: e.user_id === user.id,
      rsvps: counts[e.id as string] || 0, attending: mine.has(e.id as string),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `events:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  const starts = typeof body.starts_at === 'string' ? body.starts_at : '';
  if (!title || !starts || Number.isNaN(new Date(starts).getTime())) return NextResponse.json({ message: 'Titolo e data richiesti' }, { status: 400 });
  const link = typeof body.link === 'string' ? body.link.trim().slice(0, 1000) : '';
  if (!isValidUrlOrEmpty(link)) return NextResponse.json({ message: 'Link non valido' }, { status: 400 });
  const { data, error: ins } = await supabaseAdmin.from('events').insert({
    user_id: user.id, title,
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '',
    starts_at: new Date(starts).toISOString(), link: link || null,
  }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore creazione evento' }, { status: 500 });
  return NextResponse.json({ event: data }, { status: 201 });
}

// Partecipazione (toggle + notifica all'organizzatore).
export async function PUT(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const eventId = typeof body.event_id === 'string' ? body.event_id : '';
  const { data: ev } = await supabaseAdmin.from('events').select('id,user_id,title').eq('id', eventId).maybeSingle();
  if (!ev) return NextResponse.json({ message: 'Evento non trovato' }, { status: 404 });
  const { data: existing } = await supabaseAdmin.from('event_rsvps').select('*').eq('event_id', eventId).eq('user_id', user.id).maybeSingle();
  if (existing) {
    await supabaseAdmin.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
    return NextResponse.json({ attending: false });
  }
  await supabaseAdmin.from('event_rsvps').insert({ event_id: eventId, user_id: user.id });
  if (ev.user_id !== user.id) await notify(ev.user_id, 'event_rsvp', `Nuovo partecipante al tuo evento "${ev.title}"`, { type: 'event', id: eventId });
  return NextResponse.json({ attending: true });
}

export async function DELETE(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const id = new URL(req.url).searchParams.get('id');
  const { data: ev } = await supabaseAdmin.from('events').select('user_id').eq('id', id).maybeSingle();
  if (!ev) return NextResponse.json({ message: 'Evento non trovato' }, { status: 404 });
  if (ev.user_id !== user.id && !isAdminEmail(user.email)) return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
  await supabaseAdmin.from('events').delete().eq('id', id);
  return NextResponse.json({ message: 'Evento eliminato' });
}
