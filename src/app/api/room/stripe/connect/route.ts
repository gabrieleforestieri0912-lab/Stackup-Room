import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';
import { connectClientId, connectUrl } from '@/lib/room/stripe';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Avvia il collegamento Stripe read-only per una startup (OAuth Connect, scope read_only).
export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `stripe-connect:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  if (!connectClientId()) return NextResponse.json({ message: 'Stripe Connect non configurato' }, { status: 501 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const startupId = typeof body.startup_id === 'string' ? body.startup_id : '';
  const { data: s } = await supabaseAdmin.from('startups').select('id').eq('id', startupId).eq('user_id', user.id).maybeSingle();
  if (!s) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.json({ url: connectUrl(user.id, startupId, appUrl) });
}
