import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember } from '@/lib/room/community';
import { transcribeAudio, aiAllowed } from '@/lib/room/coach';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Trascrive una nota vocale dell'utente. Solo con consenso AI: l'audio lascia i nostri
// server verso il provider STT. Senza: 403 e la nota resta inviabile senza trascrizione.
export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const { data: profile } = await supabaseAdmin.from('profiles').select('ai_consent').eq('id', user.id).maybeSingle();
  if (!aiAllowed(profile)) {
    return NextResponse.json({ message: 'NEED_CONSENT', detail: 'Abilita le funzioni AI per trascrivere. La nota resta inviabile senza trascrizione.' }, { status: 403 });
  }
  const rl = await rateLimit(rateLimitKey(req, `stt:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe trascrizioni. Riprova più tardi.' }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const path = typeof body.audio_path === 'string' ? body.audio_path : '';
  if (!path || path.includes('..') || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ message: 'Audio non valido' }, { status: 400 });
  }
  const { data: file, error: dl } = await supabaseAdmin.storage.from('voice-notes').download(path);
  if (dl || !file) return NextResponse.json({ message: 'Audio non trovato' }, { status: 404 });
  try {
    const text = await transcribeAudio(Buffer.from(await file.arrayBuffer()), file.type || 'audio/webm');
    return NextResponse.json({ transcript: text });
  } catch (e) {
    const code = e instanceof Error ? e.message : 'STT_FAILED';
    if (code === 'STT_NOT_CONFIGURED') {
      return NextResponse.json({ message: 'Trascrizione non configurata (manca provider STT lato server). La nota resta inviabile senza trascrizione.' }, { status: 501 });
    }
    return NextResponse.json({ message: 'Trascrizione fallita. Riprova più tardi.' }, { status: 502 });
  }
}
