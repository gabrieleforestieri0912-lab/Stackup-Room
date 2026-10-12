import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, recordShip } from '@/lib/room/api';
import { computeStreak } from '@/lib/room/streak';

export const runtime = 'nodejs';

// Streak di shipping: stato oggi + serie corrente/lunga + heatmap (ultimi 120 giorni). Privato.
export async function GET(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const { data } = await supabaseAdmin.from('ship_days').select('day').eq('user_id', user.id).order('day', { ascending: false }).limit(400);
  const days = (data || []).map((d: { day: string }) => d.day);
  const streak = computeStreak(days);
  return NextResponse.json({ ...streak, heatmap: days.slice(0, 120) });
}

// Segna oggi come shippato (manuale).
export async function POST(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const startupId = typeof body.startup_id === 'string' && body.startup_id ? body.startup_id : null;
  if (startupId) {
    const { data } = await supabaseAdmin.from('startups').select('id').eq('id', startupId).eq('user_id', user.id).maybeSingle();
    if (!data) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
  }
  await recordShip(user.id, 'manual', startupId);
  return NextResponse.json({ message: 'Oggi segnato come shippato.' });
}
