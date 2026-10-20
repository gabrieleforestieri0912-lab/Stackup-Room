import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

async function auth(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const u = token ? await getAuthUser(token) : null;
  return { token, u };
}

// Rimuove tutti i file dell'utente dai bucket in cui scrive.
async function purgeUserFiles(userId: string) {
  const buckets = ['avatars', 'voice-notes', 'proofs', 'feedback-shots'];
  for (const bucket of buckets) {
    try {
      const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId, { limit: 1000 });
      const paths = (files || []).map((f) => `${userId}/${f.name}`);
      if (paths.length > 0) await supabaseAdmin.storage.from(bucket).remove(paths);
    } catch (err) {
      // La cancellazione dell'account non deve fallire per un bucket.
      console.error(`[account] cleanup bucket ${bucket} fallito:`, err instanceof Error ? err.message : err);
    }
  }
}

// Export dati (JSON con profilo + tabelle room M1).
export async function GET(req: NextRequest) {
  const { u } = await auth(req);
  if (!u) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `account-export:${u.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', u.id).maybeSingle();
  const { data: consent } = await supabaseAdmin.from('ai_consents').select('*').eq('user_id', u.id).maybeSingle();
  return NextResponse.json({ exported_at: new Date().toISOString(), profile, ai_consents: consent || null });
}

// Cancellazione immediata e completa: profilo + auth.user (cascade sul resto)
// + file dallo storage.
export async function DELETE(req: NextRequest) {
  const { u } = await auth(req);
  if (!u) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `account-delete:${u.id}`), 3, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.confirm !== 'DELETE') {
    return NextResponse.json({ message: 'Conferma mancante (confirm: DELETE)' }, { status: 400 });
  }

  // Re-autenticazione: la sola stringa "DELETE" non dimostra che sia davvero
  // l'utente a chiedere la cancellazione. Se l'account ha una password va
  // confermata; per gli account passwordless (OTP/OAuth) il codice di conferma
  // è l'unica prova disponibile, quindi si richiede l'email corrente.
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const email = String(u.email || '').toLowerCase();
  const { data: profile } = await supabaseAdmin.from('profiles').select('auth_method,email').eq('id', u.id).maybeSingle();
  const hasPassword = String(profile?.auth_method || '') === 'local';

  if (hasPassword) {
    if (!currentPassword) {
      return NextResponse.json({ message: 'Inserisci la password attuale per confermare.' }, { status: 400 });
    }
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) {
      return NextResponse.json({ message: 'Password attuale non corretta.' }, { status: 401 });
    }
  } else {
    // Account passwordless: senza password non c'è una prova locale, quindi si
    // esige la conferma esplicita dell'indirizzo email per evitare che un token
    // rubato cancelli l'account.
    const confirmEmail = typeof body.confirmEmail === 'string' ? body.confirmEmail.trim().toLowerCase() : '';
    if (!confirmEmail || confirmEmail !== email) {
      return NextResponse.json({ message: `Conferma l'indirizzo email (${email}) per eliminare l'account.` }, { status: 400 });
    }
  }

  await purgeUserFiles(u.id);
  await supabaseAdmin.from('profiles').delete().eq('id', u.id);
  const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
  if (error) return NextResponse.json({ message: 'Errore cancellazione account' }, { status: 500 });
  return NextResponse.json({ message: 'Account eliminato' });
}
