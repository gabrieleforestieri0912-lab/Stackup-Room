import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `stripe-links:${user.id}`), 60, 60_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const { data: links } = await supabaseAdmin.from('stripe_links').select('id,startup_id,stripe_account_id,livemode,status').eq('user_id', user.id).order('created_at', { ascending: false });
  // Chiavi rk: MAI il segreto al client, solo maschera.
  const { data: keys } = await supabaseAdmin.from('stripe_keys').select('id,startup_id,key_last4,livemode,status').eq('user_id', user.id).order('created_at', { ascending: false });
  const ids = (links || []).map((l: { startup_id: string }) => l.startup_id);
  let snaps: Record<string, { mrr_cents: number; currency: string; created_at: string }> = {};
  if (ids.length > 0) {
    const { data } = await supabaseAdmin.from('revenue_snapshots').select('*').eq('source', 'stripe').in('startup_id', ids).order('created_at', { ascending: false });
    for (const r of data || []) {
      if (!snaps[r.startup_id]) snaps[r.startup_id] = r;
    }
  }
  return NextResponse.json({ links: links || [], keys: keys || [], verified: snaps });
}
