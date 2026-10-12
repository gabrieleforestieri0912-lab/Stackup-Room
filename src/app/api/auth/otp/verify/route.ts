import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';
import { EMAIL_RE } from '@/lib/room/validation';
import { hashOtp } from '@/lib/room/otp';

export const runtime = 'nodejs';

function buildUserPayload(profile: Record<string, unknown>, enrollments: string[]) {
  return {
    _id: profile.id, id: profile.id, name: profile.name, email: profile.email,
    avatar: (profile.avatar_url as string) || (profile.avatar as string) || undefined,
    authMethod: (profile.auth_method as string) || 'otp',
    handle: (profile.handle as string) || null,
    onboardingCompleted: Boolean(profile.onboarding_completed),
    enrolledCourses: enrollments,
    certificates: [], studyStreak: profile.study_streak || 0,
    studyHours: profile.study_hours || 0, exp: profile.exp || 0,
    createdAt: profile.created_at,
  };
}

// Verifica OTP -> crea utente se nuovo (passwordless), restituisce sessione.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!email || !EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: 'Email o codice non validi' }, { status: 400 });
  }

  const { allowed, retryAfter } = await rateLimit(rateLimitKey(req, `otp-verify:${email}`), 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ message: `Troppe richieste. Riprova tra ${retryAfter} secondi.` }, { status: 429 });
  }

  try {
    const { data: row } = await supabaseAdmin.from('otp_codes')
      .select('*').eq('email', email).is('consumed_at', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ message: 'Codice scaduto. Richiedine uno nuovo.' }, { status: 401 });
    }
    if ((row.attempts || 0) >= 5) {
      return NextResponse.json({ message: 'Troppi tentativi. Richiedi un nuovo codice.' }, { status: 429 });
    }
    if (row.code_hash !== hashOtp(code, email)) {
      await supabaseAdmin.from('otp_codes').update({ attempts: (row.attempts || 0) + 1 }).eq('id', row.id);
      return NextResponse.json({ message: 'Codice non valido' }, { status: 401 });
    }
    await supabaseAdmin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);

    // Utente esistente?
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = existing?.users.find((u) => u.email?.toLowerCase() === email);

    let userId: string;
    if (authUser) {
      userId = authUser.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
      if (error || !data?.user) throw error || new Error('createUser failed');
      userId = data.user.id;
      const { data: link } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email });
      void link;
      await supabaseAdmin.from('profiles').insert({ id: userId, email, name: email.split('@')[0], auth_method: 'otp' });
    }

    // Sessione: magiclink consumato via admin -> creiamo un link e lo scambiamo? Semplice: generateLink + signIn via OTP non disponibile admin-side.
    // Strategia: usiamo generateLink magiclink e restituiamo l'action_link hash; il client lo apre per stabilire la sessione.
    const { data: magic, error: magicErr } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email });
    if (magicErr) throw magicErr;

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
    const { data: enrollments } = await supabaseAdmin.from('enrollments').select('course_id').eq('user_id', userId);

    return NextResponse.json({
      actionLink: magic.properties?.action_link ?? null,
      emailOtpToken: magic.properties?.email_otp ?? null,
      user: profile ? buildUserPayload(profile, (enrollments || []).map((e: { course_id: string }) => e.course_id)) : null,
      onboardingCompleted: Boolean(profile?.onboarding_completed),
    });
  } catch (e) {
    console.error('[otp/verify] error:', e);
    return NextResponse.json({ message: 'Errore verifica codice' }, { status: 500 });
  }
}
