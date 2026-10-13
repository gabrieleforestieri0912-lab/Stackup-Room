import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin, getAuthUser } from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === 'sk_test_your_stripe_key') {
    return NextResponse.json({ message: 'Stripe non configurato' }, { status: 500 });
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

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Il client può indicare SOLO gli id dei corsi (singolo o carrello).
  // Prezzo e titolo vengono SEMPRE letti dal database: mai dal client.
  const rawItems = Array.isArray(body.items) ? (body.items as Array<Record<string, unknown>>) : [];
  const singleCourseId = typeof body.courseId === 'string' ? body.courseId : '';

  const requestedIds = [
    ...new Set(
      singleCourseId
        ? [singleCourseId]
        : rawItems
            .map((i) => (i && typeof i.courseId === 'string' ? i.courseId : ''))
            .filter(Boolean),
    ),
  ];

  if (requestedIds.length === 0) {
    return NextResponse.json({ message: 'Nessun corso selezionato' }, { status: 400 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const stripe = new Stripe(stripeKey);

    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id, title, price')
      .in('id', requestedIds)
      .eq('is_published', true);

    if (coursesError) {
      console.error('[create-checkout] courses query error:', coursesError);
      return NextResponse.json({ message: 'Errore durante la creazione del checkout' }, { status: 500 });
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json(
        { message: 'Corso non trovato o non disponibile' },
        { status: 404 },
      );
    }

    // Esclude i corsi gratuiti: non si acquistano via Stripe
    const paidCourses = courses.filter((c) => Number(c.price) > 0);

    if (paidCourses.length === 0) {
      return NextResponse.json(
        { message: 'I corsi selezionati sono gratuiti: non serve acquistarli' },
        { status: 400 },
      );
    }

    const line_items = paidCourses.map((course) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: course.title },
        unit_amount: Math.round(Number(course.price) * 100),
      },
      quantity: 1,
    }));

    const courseIdsMeta = paidCourses.map((c) => c.id);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${baseUrl}/room/corsi?success=true`,
      cancel_url: `${baseUrl}/courses?canceled=true`,
      customer_email: authUser.email,
      metadata: {
        userId: authUser.id,
        courseIds: courseIdsMeta.join(','),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('[create-checkout] error:', error);
    return NextResponse.json({ message: 'Errore creazione checkout' }, { status: 500 });
  }
}
