import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

// Iscrizione diretta (senza pagamento) consentita solo per i corsi gratuiti.
// I corsi a pagamento vengono iscritti dal webhook Stripe dopo il checkout.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ message: 'slug mancante' }, { status: 400 });
  }

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
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, price')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (courseError) throw courseError;
    if (!course) {
      return NextResponse.json({ message: 'Corso non trovato' }, { status: 404 });
    }

    if (Number(course.price) > 0) {
      return NextResponse.json(
        { message: 'Questo corso è a pagamento: acquistalo per iscriverti.' },
        { status: 402 },
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('course_id', course.id)
      .maybeSingle();

    if (!existing) {
      const { error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .upsert(
          { user_id: authUser.id, course_id: course.id },
          { onConflict: 'user_id,course_id', ignoreDuplicates: true },
        );

      if (enrollError) throw enrollError;

      await supabaseAdmin.rpc('increment_enrollment_count', { course_id: course.id });
    }

    return NextResponse.json({ success: true, courseId: course.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
