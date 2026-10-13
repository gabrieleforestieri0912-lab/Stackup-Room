import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

/**
 * Callback legacy: l'identità è letta dal JWT, mai dal body.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length)
    : null;

  if (!token) {
    return NextResponse.json({ message: 'Token mancante' }, { status: 401 });
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ message: 'Token non valido' }, { status: 401 });
    }

    const email = user.email;
    if (!email) {
      return NextResponse.json({ message: 'Email non presente nel token' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      const providerAvatar = (user.user_metadata?.avatar_url ||
        user.user_metadata?.picture) as string | undefined;
      if (!existing.avatar && providerAvatar) {
        await supabaseAdmin
          .from('profiles')
          .update({ avatar: providerAvatar })
          .eq('id', existing.id);
      }

      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('course_id')
        .eq('user_id', existing.id);

      const { data: certs } = await supabaseAdmin
        .from('certificates')
        .select('course_id, certificate_id, completed_at')
        .eq('user_id', existing.id);

      return NextResponse.json({
        user: {
          _id: existing.id,
          id: existing.id,
          name: existing.name,
          email: existing.email,
          avatar: existing.avatar || undefined,
          authMethod: existing.auth_method,
          handle: existing.handle || null,
          onboardingCompleted: Boolean(existing.onboarding_completed),
          enrolledCourses: (enrollments || []).map((e: { course_id: string }) => e.course_id),
          certificates: (certs || []).map(
            (c: { course_id: string; certificate_id: string; completed_at: string }) => ({
              courseId: c.course_id,
              certificateId: c.certificate_id,
              completedAt: c.completed_at,
            }),
          ),
          studyStreak: existing.study_streak || 0,
          studyHours: existing.study_hours || 0,
          exp: existing.exp || 0,
          createdAt: existing.created_at,
        },
        token: '',
      });
    }

    const nameFromProvider = (user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split('@')[0]) as string;
    const avatarFromProvider = (user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null) as string | null;
    const provider = (user.app_metadata?.provider || 'email') as string;

    const { data: newProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user.id,
        email: email.toLowerCase(),
        name: nameFromProvider,
        avatar: avatarFromProvider,
        auth_method: provider,
      })
      .select()
      .single();

    if (profileError) {
      console.error('[supabase-callback] profile creation error:', profileError);
      return NextResponse.json(
        { message: 'Errore durante la creazione del profilo' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      user: {
        _id: newProfile.id,
        id: newProfile.id,
        name: newProfile.name,
        email: newProfile.email,
        avatar: newProfile.avatar || undefined,
        authMethod: newProfile.auth_method,
        handle: newProfile.handle || null,
        onboardingCompleted: false,
        enrolledCourses: [] as string[],
        certificates: [] as { courseId: string; certificateId: string; completedAt: string }[],
        studyStreak: 0,
        studyHours: 0,
        exp: 0,
        createdAt: newProfile.created_at,
      },
      token: '',
    });
  } catch (error) {
    console.error('[supabase-callback] error:', error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
