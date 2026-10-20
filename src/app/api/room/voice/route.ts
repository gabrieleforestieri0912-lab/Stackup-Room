import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember, blockedIds } from '@/lib/room/community';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const MAX_BYTES = 5 * 1024 * 1024;

// Upload nota vocale (storage privato). Ritorna il path da usare nel messaggio.
export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
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
  // L'estensione NON viene dal MIME dichiarato dal client (falsificabile):
  // si sceglie dalla allowlist in base al MIME, altrimenti 'webm'.
  const declared = (file.type || '').toLowerCase();
  const ext = declared.includes('ogg') ? 'ogg'
    : declared.includes('mp4') || declared.includes('m4a') ? 'mp4'
      : declared.includes('wav') ? 'wav'
        : 'webm';
  const path = `${user.id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: up } = await supabaseAdmin.storage.from('voice-notes').upload(path, buf, {
    contentType: file.type || 'audio/webm',
    upsert: false,
  });
  if (up) return NextResponse.json({ message: 'Upload fallito' }, { status: 500 });
  return NextResponse.json({ audio_path: path }, { status: 201 });
}

// Link firmato a scadenza breve (15 min) per riprodurre una nota vocale.
//
// Il bucket `voice-notes` è privato e i path contengono l'UUID di chi ha
// caricato la nota. Senza un controllo esplicito un membro autenticato
// potrebbe firmare (e ascoltare) QUALSIASI file del bucket.
//
// Il path è firmabile se e solo se:
//  - appartiene all'utente che chiede (caricamento proprio), oppure
//  - è referenziato da un messaggio di chat visibile al richiedente
//    (le note vocali in chat sono condivise per design: vedi ChatTab).
// In entrambi i casi l'autore bloccato viene escluso.
export async function GET(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const path = new URL(req.url).searchParams.get('path');
  if (!path || path.includes('..') || path.includes('//')) {
    return NextResponse.json({ message: 'Path non valido' }, { status: 400 });
  }

  const ownFile = path.startsWith(`${user.id}/`);
  if (!ownFile) {
    // Deve essere una nota vocale effettivamente pubblicata in chat.
    const { data: msgs } = await supabaseAdmin
      .from('chat_messages')
      .select('id,user_id')
      .eq('audio_path', path)
      .limit(1);
    const msg = (msgs || [])[0];
    if (!msg) return NextResponse.json({ message: 'Audio non disponibile' }, { status: 404 });
    const blocked = await blockedIds(user.id);
    if (blocked.has(msg.user_id)) return NextResponse.json({ message: 'Audio non disponibile' }, { status: 404 });
  }

  const { data, error: sign } = await supabaseAdmin.storage.from('voice-notes').createSignedUrl(path, 900);
  if (sign || !data?.signedUrl) return NextResponse.json({ message: 'Audio non disponibile' }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl });
}
