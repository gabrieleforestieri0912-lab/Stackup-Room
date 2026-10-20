import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';
import { verifyRestrictedKey, fetchMrrForKey, maskKey } from '@/lib/room/stripe';
import { rateLimit, rateLimitKey, clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Collega una chiave ristretta read-only (rk_live_/rk_test_) a una startup.
// Il segreto resta solo lato server, mai restituito al client. Revocabile qui o da Stripe.
export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `stripe-key:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const startupId = typeof body.startup_id === 'string' ? body.startup_id : '';
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!startupId) return NextResponse.json({ message: 'Startup richiesta' }, { status: 400 });
  if (!key.startsWith('rk_live_')) {
    return NextResponse.json({ message: 'Solo chiavi rk_live_… accettate. Crea una chiave con soli permessi di lettura da Stripe → Developers → API keys.' }, { status: 400 });
  }
  const { data: s } = await supabaseAdmin.from('startups').select('id').eq('id', startupId).eq('user_id', user.id).maybeSingle();
  if (!s) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });

  let livemode = key.startsWith('rk_live_');
  try {
    const v = await verifyRestrictedKey(key);
    livemode = v.livemode;
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (code === 'KEY_INVALID') return NextResponse.json({ message: 'Chiave non valida o revocata.' }, { status: 401 });
    if (code === 'KEY_NO_READ') return NextResponse.json({ message: 'La chiave non ha permessi di lettura (servono Subscriptions e Invoices in lettura).' }, { status: 403 });
    return NextResponse.json({ message: 'Verifica Stripe fallita. Riprova.' }, { status: 502 });
  }

  const { error: up } = await supabaseAdmin.from('stripe_keys').upsert(
    { user_id: user.id, startup_id: startupId, secret: key, key_last4: maskKey(key), livemode, status: 'active' },
    { onConflict: 'startup_id' },
  );
  if (up) return NextResponse.json({ message: 'Errore salvataggio chiave' }, { status: 500 });

  try {
    const mrr = await fetchMrrForKey(key);
    await supabaseAdmin.from('revenue_snapshots').insert({
      startup_id: startupId, source: 'stripe', mrr_cents: mrr.mrr_cents, currency: mrr.currency, period: 'all',
    });
  } catch (e) {
    console.warn('[stripe/key] mrr fetch failed:', e);
  }

  await supabaseAdmin.from('leaderboard_audit').insert({
    user_id: user.id, action: 'stripe.key_link', meta: { startup_id: startupId, livemode },
    ip: clientIp(req),
  });
  return NextResponse.json({ message: 'Chiave collegata.', livemode }, { status: 201 });
}
