import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember } from '@/lib/room/community';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const MAX_BYTES = 5 * 1024 * 1024;

// Upload nota vocale (storage privato). Ritorna il path da usare nel messaggio.
export async function POST(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `voice:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe note vocali. Riprova più tardi.' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('audio');
  if (!(file instanceof Blob)) return NextResponse.json({ message: 'File audio mancante' }, { status: 400 });
  if (file.size === 0 || file.size > MAX_BYTES) return NextResponse.json({ message: 'Audio fino a 5MB' }, { status: 400 });
  if (file.type && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
    return NextResponse.json({ message: 'Formato non supportato' }, { status: 400 });
  }
  const ext = (file.type.split('/')[1] || 'webm').split(';')[0].slice(0, 8);
  const path = `${user.id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: up } = await supabaseAdmin.storage.from('voice-notes').upload(path, buf, {
    contentType: file.type || 'audio/webm',
    upsert: false,
  });
  if (up) return NextResponse.json({ message: 'Upload fallito' }, { status: 500 });
  return NextResponse.json({ audio_path: path }, { status: 201 });
}

// Link firmato a scadenza breve (15 min) per riprodurre una nota vocale dei 7 giorni.
export async function GET(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const path = new URL(req.url).searchParams.get('path');
  if (!path || path.includes('..')) return NextResponse.json({ message: 'Path non valido' }, { status: 400 });
  const { data, error: sign } = await supabaseAdmin.storage.from('voice-notes').createSignedUrl(path, 900);
  if (sign || !data?.signedUrl) return NextResponse.json({ message: 'Audio non disponibile' }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl });
}
