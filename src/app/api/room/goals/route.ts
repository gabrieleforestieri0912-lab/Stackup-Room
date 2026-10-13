import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, ownStartup, unauthorized } from '@/lib/room/api';
import { cleanStr } from '@/lib/room/m2';
import { isValidUrlOrEmpty } from '@/lib/room/validation';

export const runtime = 'nodejs';

// Obiettivi con prova di lavoro (URL, screenshot path, nota). Privati.
export async function GET(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const startupId = new URL(req.url).searchParams.get('startup_id');
  let q = supabaseAdmin.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (startupId) {
    if (!(await ownStartup(user.id, startupId))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
    q = q.eq('startup_id', startupId);
  }
  const { data } = await q;
  return NextResponse.json({ goals: data || [] });
}

export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = cleanStr(body.title, 200);
  const startupId = typeof body.startup_id === 'string' ? body.startup_id : '';
  if (!title || !startupId) return NextResponse.json({ message: 'Titolo e startup richiesti' }, { status: 400 });
  if (!(await ownStartup(user.id, startupId))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });

  const proofUrl = cleanStr(body.proof_url, 1000);
  if (!isValidUrlOrEmpty(proofUrl)) return NextResponse.json({ message: 'URL prova non valido' }, { status: 400 });

  const { data, error: ins } = await supabaseAdmin.from('goals').insert({
    user_id: user.id, startup_id: startupId, title,
    proof_url: proofUrl || null,
    proof_note: cleanStr(body.proof_note, 1000) || null,
    screenshot_path: cleanStr(body.screenshot_path, 500) || null,
  }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore creazione obiettivo' }, { status: 500 });
  return NextResponse.json({ goal: data }, { status: 201 });
}
