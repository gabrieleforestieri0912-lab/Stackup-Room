import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '../../../../lib/supabase-admin';
import { rateLimit, rateLimitKey } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(rateLimitKey(req, 'update-profile'), 10, 3600_000);
  if (!allowed) {
    return NextResponse.json({ message: `Troppe richieste. Riprova tra ${retryAfter} secondi.` }, { status: 429 });
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
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!name || !email) {
    return NextResponse.json({ message: 'Nome ed email richiesti' }, { status: 400 });
  }

  try {
    // Controllo unicità email (escludendo se stesso)
    const { data: conflict } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .neq('id', authUser.id)
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ message: 'Email già in uso' }, { status: 409 });
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ name, email })
      .eq('id', authUser.id);

    if (profileError) {
      console.error('[update-profile] profile error:', profileError);
      return NextResponse.json({ message: 'Errore aggiornamento profilo' }, { status: 500 });
    }

    // Aggiorna anche auth.users (per coerenza)
    if (authUser.email !== email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        email,
      });
      if (authError) {
        console.warn('[update-profile] auth email update non riuscito:', authError.message);
      }
    }

    return NextResponse.json({ message: 'Profilo aggiornato' });
  } catch (error) {
    console.error('[update-profile] error:', error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
