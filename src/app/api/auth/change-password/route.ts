import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '../../../../lib/supabase-admin';
import { rateLimit, rateLimitKey } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(rateLimitKey(req, 'change-password'), 5, 3600_000);
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
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { message: 'Password attuale e nuova richieste' },
      { status: 400 },
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { message: 'La nuova password deve essere di almeno 8 caratteri' },
      { status: 400 },
    );
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { message: 'La nuova password deve essere diversa da quella attuale' },
      { status: 400 },
    );
  }

  try {
    // Verifica password attuale con un sign-in "usa e getta"
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: authUser.email || '',
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json({ message: 'Password attuale non corretta' }, { status: 401 });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('[change-password] update error:', updateError);
      return NextResponse.json(
        { message: "Errore durante l'aggiornamento della password" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Password aggiornata con successo' });
  } catch (error) {
    console.error('[change-password] error:', error);
    return NextResponse.json({ message: 'Errore del server' }, { status: 500 });
  }
}
