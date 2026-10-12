import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';
import { EMAIL_RE } from '@/lib/room/validation';
import { generateOtp, hashOtp, sendOtpEmail } from '@/lib/room/otp';

export const runtime = 'nodejs';

// Richiede un codice OTP via email (passwordless). Rate limit 5/min per IP+email.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ message: 'Email non valida' }, { status: 400 });
  }

  const { allowed, retryAfter } = await rateLimit(rateLimitKey(req, `otp:${email}`), 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ message: `Troppe richieste. Riprova tra ${retryAfter} secondi.` }, { status: 429 });
  }

  try {
    // Invalida codici precedenti ancora validi
    await supabaseAdmin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('email', email).is('consumed_at', null);

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from('otp_codes').insert({
      email,
      code_hash: hashOtp(code, email),
      expires_at: expiresAt,
    });
    if (error) throw error;

    await sendOtpEmail(email, code);
    return NextResponse.json({ message: 'Codice inviato. Controlla la tua email.' });
  } catch (e) {
    console.error('[otp/request] error:', e);
    return NextResponse.json({ message: 'Errore invio codice' }, { status: 500 });
  }
}
