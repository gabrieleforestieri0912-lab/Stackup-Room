import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { verifyState, fetchMrr } from '@/lib/room/stripe';

export const runtime = 'nodejs';

// Callback OAuth Connect: scambia il code, collega l'account (solo ID, mai dati di carta)
// e salva il primo snapshot MRR verificato.
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const code = sp.get('code');
  const state = sp.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const fail = (msg: string) => NextResponse.redirect(`${appUrl}/room/you?tab=contributions&stripe=error&msg=${encodeURIComponent(msg)}`);

  if (!code || !state) return fail('Parametri mancanti');
  const verified = verifyState(state);
  if (!verified) return fail('Sessione scaduta, riprova');

  const { data: s } = await supabaseAdmin.from('startups').select('id').eq('id', verified.startupId).eq('user_id', verified.userId).maybeSingle();
  if (!s) return fail('Startup non trovata');

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const token = await stripe.oauth.token({ grant_type: 'authorization_code', code });
    const accountId = typeof token.stripe_user_id === 'string' ? token.stripe_user_id : null;
    if (!accountId) return fail('Account Stripe non ricevuto');

    await supabaseAdmin.from('stripe_links').upsert(
      { user_id: verified.userId, startup_id: verified.startupId, stripe_account_id: accountId, livemode: token.livemode === true, status: 'active' },
      { onConflict: 'startup_id,stripe_account_id' },
    );

    try {
      const mrr = await fetchMrr(accountId);
      await supabaseAdmin.from('revenue_snapshots').insert({
        startup_id: verified.startupId, source: 'stripe',
        mrr_cents: mrr.mrr_cents, currency: mrr.currency, period: 'all',
      });
    } catch (e) {
      console.warn('[stripe/callback] mrr fetch failed:', e);
    }

    await supabaseAdmin.from('leaderboard_audit').insert({
      user_id: verified.userId, action: 'stripe.link',
      meta: { startup_id: verified.startupId, livemode: token.livemode === true },
      ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
    });

    return NextResponse.redirect(`${appUrl}/room/you?tab=contributions&stripe=ok`);
  } catch (e) {
    console.error('[stripe/callback] error:', e);
    return fail('Collegamento fallito');
  }
}
