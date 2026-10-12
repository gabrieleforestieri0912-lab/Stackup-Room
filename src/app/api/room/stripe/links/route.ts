import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/room/api';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const { data: links } = await supabaseAdmin.from('stripe_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  const ids = (links || []).map((l: { startup_id: string }) => l.startup_id);
  let snaps: Record<string, { mrr_cents: number; currency: string; created_at: string }> = {};
  if (ids.length > 0) {
    const { data } = await supabaseAdmin.from('revenue_snapshots').select('*').eq('source', 'stripe').in('startup_id', ids).order('created_at', { ascending: false });
    for (const r of data || []) {
      if (!snaps[r.startup_id]) snaps[r.startup_id] = r;
    }
  }
  return NextResponse.json({ links: links || [], verified: snaps });
}
