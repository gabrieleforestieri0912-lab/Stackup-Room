import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
  }

  const token = authHeader.substring('Bearer '.length);
  const authUser = await getAuthUser(token);
  if (!authUser) {
    return NextResponse.json({ message: 'Token non valido' }, { status: 401 });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!profile) {
      return NextResponse.json({ message: 'Utente non trovato' }, { status: 404 });
    }

    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('course_id')
      .eq('user_id', authUser.id);

    const { data: certs } = await supabaseAdmin
      .from('certificates')
      .select('course_id, certificate_id, completed_at')
      .eq('user_id', authUser.id);

    const user = {
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
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[me] error:', error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
