import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const MAX_BYTES = 5 * 1024 * 1024;
const SEVERITIES = ['annoying', 'blocks', 'unusable'];
const AREAS = ['today', 'club', 'coach', 'you', 'membership', 'other'];

// Segnalazione bug (tabella feedback, kind='bug', visibile solo all'admin via RLS).
// Aperta a tutti gli utenti autenticati: un bug si può avere anche senza abbonamento.
export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `feedback:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe segnalazioni. Riprova più tardi.' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const title = String(form?.get('title') || '').trim().slice(0, 200);
  const steps = String(form?.get('steps') || '').trim().slice(0, 1000);
  const severity = String(form?.get('severity') || '');
  const area = String(form?.get('area') || '');
  if (!title) return NextResponse.json({ message: 'Manca il titolo del bug.' }, { status: 400 });
  if (!SEVERITIES.includes(severity) || !AREAS.includes(area)) {
    return NextResponse.json({ message: 'Dati della segnalazione non validi.' }, { status: 400 });
  }

  let screenshotPath: string | null = null;
  const shot = form?.get('screenshot');
  if (shot instanceof Blob && shot.size > 0) {
    if (shot.size > MAX_BYTES) return NextResponse.json({ message: 'Lo screenshot può essere al massimo di 5MB.' }, { status: 400 });
    if (shot.type && !shot.type.startsWith('image/')) return NextResponse.json({ message: 'Lo screenshot deve essere un\'immagine.' }, { status: 400 });
    const path = `${user.id}/${Date.now()}.png`;
    const { error: up } = await supabaseAdmin.storage.from('feedback-shots').upload(
      path, Buffer.from(await shot.arrayBuffer()), { contentType: shot.type || 'image/png', upsert: false },
    );
    if (up) return NextResponse.json({ message: 'Upload dello screenshot fallito.' }, { status: 500 });
    screenshotPath = path;
  }

  const body = JSON.stringify({ title, steps, severity, area });
  const { error: ins } = await supabaseAdmin.from('feedback').insert({
    user_id: user.id, kind: 'bug', body, screenshot_path: screenshotPath,
  });
  if (ins) return NextResponse.json({ message: 'Invio non riuscito. Riprova.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
