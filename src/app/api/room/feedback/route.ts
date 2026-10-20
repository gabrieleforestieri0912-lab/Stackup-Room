import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const MAX_BYTES = 5 * 1024 * 1024;
const AREAS = ['today', 'room', 'club', 'coach', 'you', 'membership', 'other'];
const SEVERITIES: Record<string, string[]> = {
  bug: ['annoying', 'blocks', 'unusable'],
  idea: ['nice', 'helpful', 'critical'],
};

// Feedback (tabella feedback, visibile solo all'admin via RLS):
// kind='bug' → segnalazione difetto; kind='idea' → richiesta di funzionalità.
// Aperti a tutti gli utenti autenticati.
export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `feedback:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe segnalazioni. Riprova più tardi.' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const kind = String(form?.get('kind') || 'bug');
  const title = String(form?.get('title') || '').trim().slice(0, 200);
  const steps = String(form?.get('steps') || '').trim().slice(0, 1000);
  const severity = String(form?.get('severity') || '');
  const area = String(form?.get('area') || '');
  if (!(kind in SEVERITIES)) return NextResponse.json({ message: 'Tipo di feedback non valido.' }, { status: 400 });
  if (!title) return NextResponse.json({ message: 'Manca il titolo.' }, { status: 400 });
  if (!SEVERITIES[kind].includes(severity)) {
    return NextResponse.json({ message: 'Dati della segnalazione non validi.' }, { status: 400 });
  }
  if (kind === 'bug' && !AREAS.includes(area)) {
    return NextResponse.json({ message: 'Devi indicare dove è successo.' }, { status: 400 });
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

  const body = JSON.stringify({ title, steps, severity, ...(kind === 'bug' ? { area } : {}) });
  const { error: ins } = await supabaseAdmin.from('feedback').insert({
    user_id: user.id, kind, body, screenshot_path: screenshotPath,
  });
  if (ins) return NextResponse.json({ message: 'Invio non riuscito. Riprova.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
