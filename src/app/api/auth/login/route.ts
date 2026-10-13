import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { rateLimit, rateLimitKey } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(rateLimitKey(req, 'login'), 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { message: `Troppe richieste. Riprova tra ${retryAfter} secondi.` },
      { status: 429 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ message: 'Email e password richieste' }, { status: 400 });
  }

  try {
    const emailLower = email.toLowerCase();
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: emailLower,
      password,
    });

    if (signInError || !signInData?.user) {
      return NextResponse.json({ message: 'Credenziali non valide' }, { status: 401 });
    }

    const userId = signInData.user.id;
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ message: 'Profilo non trovato' }, { status: 404 });
    }

    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId);

    const { data: certs } = await supabaseAdmin
      .from('certificates')
      .select('course_id, certificate_id, completed_at')
      .eq('user_id', userId);

    const token = signInData.session?.access_token ?? '';

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
        enrolledCourses: (enrollments || []).map((e: { course_id: string }) => e.course_id),
        certificates: (certs || []).map(
          (c: { course_id: string; certificate_id: string; completed_at: string }) => ({
            courseId: c.course_id,
            certificateId: c.certificate_id,
            completedAt: c.completed_at,
          }),
        ),
        studyStreak: profile.study_streak || 0,
        studyHours: profile.study_hours || 0,
        exp: profile.exp || 0,
        createdAt: profile.created_at,
      },
      token,
      refreshToken: signInData.session?.refresh_token ?? '',
    });
  } catch (error) {
    console.error('[login] error:', error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
