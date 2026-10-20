import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, supabaseAuth } from '@/lib/supabase-admin';
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

/**
 * Cerca l'utente auth per email.
 *
 * `admin.listUsers()` senza paginazione restituisce solo i primi 50 utenti:
 * oltre la 50esima posizione l'utente non veniva trovato e il login OTP
 * falliva. Qui si guarda prima nel profilo (indicizzato per email) e, come
 * fallback, si scandiscono le pagine di listUsers.
 */
async function findAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (profile?.id) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(profile.id as string);
    if (data?.user) return { id: data.user.id };
  }
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return { id: found.id };
    if (data.users.length < 1000) break;
  }
  return null;
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
    let authUser = await findAuthUserByEmail(email);

    let userId: string;
    if (authUser) {
      userId = authUser.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
      if (error || !data?.user) throw error || new Error('createUser failed');
      userId = data.user.id;
      await supabaseAdmin.from('profiles').insert({ id: userId, email, name: email.split('@')[0], auth_method: 'otp' });
    }
    // La sessione viene stabilita lato SERVER.
    //
    // Prima il server restituiva al browser `actionLink` / `emailOtpToken`:
    // erano bearer credential (link magici) che transitavano nel body della
    // risposta — quindi in log di proxy/APM, cache e DevTools — e potevano
    // essere usati per accedere all'account senza password. Ora il magic link
    // viene scambiato qui, sul server, e al client arriva solo la sessione
    // (access token + refresh token), come nel flusso login con password.
    const { data: magic, error: magicErr } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email });
    if (magicErr || !magic?.properties) throw magicErr || new Error('generateLink failed');

    // Lo scambio avviene con la anon key (path documentato di Supabase per
    // `verifyOtp`); il client admin è il fallback. Si prova prima l'email_otp
    // (stesso percorso del vecchio flusso client-side), poi il token_hash.
    const attempts: Array<() => Promise<{ data: { session: { access_token: string; refresh_token: string } | null } | null; error: Error | null }>> = [];
    if (magic.properties.email_otp) {
      attempts.push(() => supabaseAuth.auth.verifyOtp({ email, token: magic.properties.email_otp as string, type: 'email' }));
    }
    attempts.push(() => supabaseAuth.auth.verifyOtp({ token_hash: magic.properties.hashed_token, type: 'email' }));
    attempts.push(() => supabaseAdmin.auth.verifyOtp({ email, token: magic.properties.email_otp as string, type: 'email' }));
    attempts.push(() => supabaseAdmin.auth.verifyOtp({ token_hash: magic.properties.hashed_token, type: 'email' }));

    let session: { access_token: string; refresh_token: string } | null = null;
    let sessionErr: Error | null = null;
    for (const attempt of attempts) {
      const res = await attempt();
      session = res.data?.session ?? null;
      sessionErr = res.error ?? null;
      if (session) break;
    }
    if (!session) {
      throw sessionErr || new Error('session exchange failed');
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
    const { data: enrollments } = await supabaseAdmin.from('enrollments').select('course_id').eq('user_id', userId);

    return NextResponse.json({
      token: session.access_token,
      refreshToken: session.refresh_token,
      user: profile ? buildUserPayload(profile, (enrollments || []).map((e: { course_id: string }) => e.course_id)) : null,
      onboardingCompleted: Boolean(profile?.onboarding_completed),
    });
  } catch (e) {
    console.error('[otp/verify] error:', e);
    return NextResponse.json({ message: 'Errore verifica codice' }, { status: 500 });
  }
}
