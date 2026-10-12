import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/room/api';
import { fetchMrr, connectClientId } from '@/lib/room/stripe';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Ricalcola lo snapshot MRR verificato per una startup collegata (rate limit 10/h).
export async function POST(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const rl = await rateLimit(rateLimitKey(req, `stripe-refresh:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const startupId = typeof body.startup_id === 'string' ? body.startup_id : '';
  const { data: link } = await supabaseAdmin.from('stripe_links').select('*').eq('startup_id', startupId).eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (!link) return NextResponse.json({ message: 'Nessun account collegato' }, { status: 404 });

  try {
    const mrr = await fetchMrr(link.stripe_account_id);
    const { data } = await supabaseAdmin.from('revenue_snapshots').insert({
      startup_id: startupId, source: 'stripe', mrr_cents: mrr.mrr_cents, currency: mrr.currency, period: 'all',
    }).select().single();
    await supabaseAdmin.from('leaderboard_audit').insert({
      user_id: user.id, action: 'stripe.refresh', meta: { startup_id: startupId, mrr_cents: mrr.mrr_cents },
      ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
    });
    return NextResponse.json({ snapshot: data });
  } catch (e) {
    console.error('[stripe/refresh] error:', e);
    return NextResponse.json({ message: 'Lettura Stripe fallita' }, { status: 502 });
  }
}

// Scollega un account in ogni momento (best-effort deauthorize lato Stripe).
export async function DELETE(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const linkId = typeof body.link_id === 'string' ? body.link_id : '';
  const { data: link } = await supabaseAdmin.from('stripe_links').select('*').eq('id', linkId).eq('user_id', user.id).maybeSingle();
  if (!link) return NextResponse.json({ message: 'Collegamento non trovato' }, { status: 404 });

  if (connectClientId()) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.oauth.deauthorize({ client_id: connectClientId(), stripe_user_id: link.stripe_account_id });
    } catch (e) {
      console.warn('[stripe/unlink] deauthorize failed (non bloccante):', e);
    }
  }
  await supabaseAdmin.from('stripe_links').delete().eq('id', linkId);
  await supabaseAdmin.from('leaderboard_audit').insert({
    user_id: user.id, action: 'stripe.unlink', meta: { startup_id: link.startup_id },
    ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
  });
  return NextResponse.json({ message: 'Account scollegato' });
}
