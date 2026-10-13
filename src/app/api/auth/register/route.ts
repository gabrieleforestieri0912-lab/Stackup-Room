import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { rateLimit, rateLimitKey } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(rateLimitKey(req, 'register'), 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { message: `Troppe richieste. Riprova tra ${retryAfter} secondi.` },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || !email || !password) {
    return NextResponse.json({ message: 'Nome, email e password richiesti' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ message: 'La password deve essere di almeno 8 caratteri' }, { status: 400 });
  }

  try {
    const emailLower = email.toLowerCase();
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: emailLower,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (signUpError || !signUpData?.user) {
      return NextResponse.json(
        { message: signUpError?.message || 'Errore durante la registrazione' },
        { status: 400 },
      );
    }

    const userId = signUpData.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: emailLower,
        name,
        avatar: null,
        auth_method: 'local',
      })
      .select()
      .single();

    if (profileError) {
      console.error('[register] profile creation error:', profileError);
      return NextResponse.json({ message: 'Errore creazione profilo' }, { status: 500 });
    }

    // Crea una sessione immediata per il nuovo utente così il client
    // può fare login automatico (l'email è già confermata da createUser).
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email: emailLower,
      password,
    });

    if (sessionError) {
      console.warn('[register] signInWithPassword error (non bloccante):', sessionError);
    }

    const token = sessionData?.session?.access_token ?? '';
    const refreshToken = sessionData?.session?.refresh_token ?? '';

    return NextResponse.json({
      user: {
        _id: profile.id,
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar || undefined,
        authMethod: profile.auth_method,
        handle: profile.handle || null,
        onboardingCompleted: Boolean(profile.onboarding_completed),
        enrolledCourses: [] as string[],
        certificates: [] as { courseId: string; certificateId: string; completedAt: string }[],
        studyStreak: 0,
        studyHours: 0,
        exp: 0,
        createdAt: profile.created_at,
      },
      token,
      refreshToken,
      requiresEmailConfirmation: false,
    });
  } catch (error) {
    console.error('[register] error:', error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
