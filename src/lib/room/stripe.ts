import Stripe from 'stripe';
import { createHmac } from 'crypto';

const secret = () => process.env.STRIPE_SECRET_KEY!;
export const connectClientId = () => process.env.STRIPE_CONNECT_CLIENT_ID || '';

function stateSecret(): string {
  return process.env.OTP_PEPPER || process.env.STRIPE_WEBHOOK_SECRET || 'stackup-room-state';
}

export function signState(userId: string, startupId: string): string {
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = `${userId}.${startupId}.${exp}`;
  const sig = createHmac('sha256', stateSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyState(state: string): { userId: string; startupId: string } | null {
  try {
    const raw = Buffer.from(state, 'base64url').toString();
    const [userId, startupId, exp, sig] = raw.split('.');
    if (!userId || !startupId || !exp || !sig || Number(exp) < Date.now()) return null;
    const want = createHmac('sha256', stateSecret()).update(`${userId}.${startupId}.${exp}`).digest('hex');
    if (want !== sig) return null;
    return { userId, startupId };
  } catch {
    return null;
  }
}

export function connectUrl(userId: string, startupId: string, appUrl: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: connectClientId(),
    scope: 'read_only',
    redirect_uri: `${appUrl}/api/room/stripe/callback`,
    state: signState(userId, startupId),
  });
  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}

// MRR da abbonamenti attivi dell'account collegato (sola lettura: mai dati di carta).
// Normalizza gli intervalli a mensile. Ritorna il totale nella valuta dominante.
export async function fetchMrr(stripeAccountId: string): Promise<{ mrr_cents: number; currency: string }> {
  const stripe = new Stripe(secret());
  const totals = new Map<string, number>();
  let startingAfter: string | undefined;
  for (let page = 0; page < 10; page++) {
    const subs = await stripe.subscriptions.list(
      { status: 'active', limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) },
      { stripeAccount: stripeAccountId },
    );
    for (const s of subs.data) {
      for (const item of s.items.data) {
        const price = item.price;
        if (!price || !price.recurring || price.unit_amount == null) continue;
        const cur = (price.currency || 'eur').toUpperCase();
        const qty = item.quantity || 1;
        const monthly = monthlyFactor(price.recurring.interval, price.recurring.interval_count || 1);
        totals.set(cur, (totals.get(cur) || 0) + Math.round((price.unit_amount * qty * monthly) / 100) * 100 / 100);
      }
    }
    if (!subs.has_more || subs.data.length === 0) break;
    startingAfter = subs.data[subs.data.length - 1].id;
  }
  let currency = 'EUR';
  let mrr = 0;
  for (const [cur, val] of totals) {
    if (val > mrr) { mrr = val; currency = cur; }
  }
  // Fallback: fatture pagate ultimi 30gg (se nessun abbonamento attivo)
  if (mrr === 0) {
    const since = Math.floor((Date.now() - 30 * 86400000) / 1000);
    const inv = await stripe.invoices.list(
      { status: 'paid', limit: 100, created: { gte: since } },
      { stripeAccount: stripeAccountId },
    );
    for (const i of inv.data) {
      if (i.amount_paid == null) continue;
      const cur = (i.currency || 'eur').toUpperCase();
      totals.set(cur, (totals.get(cur) || 0) + i.amount_paid);
    }
    for (const [cur, val] of totals) {
      if (val > mrr) { mrr = val; currency = cur; }
    }
  }
  return { mrr_cents: Math.round(mrr), currency };
}

function monthlyFactor(interval: string, count: number): number {
  switch (interval) {
    case 'day': return 30 / count;
    case 'week': return (30 / 7) / count;
    case 'month': return 1 / count;
    case 'year': return 1 / (12 * count);
    default: return 0;
  }
}
