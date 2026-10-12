import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

// Profilo pubblico founder: rispetta anonymous_mode e show_revenue. Nessuna auth richiesta.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ handle: string }> }) {
  const { handle } = await ctx.params;
  const h = (handle || '').toLowerCase();
  if (!h) return NextResponse.json({ message: 'Handle mancante' }, { status: 400 });
  const { data: p } = await supabaseAdmin.from('profiles').select('*').eq('handle', h).maybeSingle();
  if (!p) return NextResponse.json({ message: 'Profilo non trovato' }, { status: 404 });

  if (p.anonymous_mode) {
    return NextResponse.json({
      profile: {
        handle: p.handle, anonymous: true,
        study_streak: p.study_streak || 0,
        github_username: null, locality: null, bio: null, socials: {},
      },
    });
  }
  const { data: startups } = await supabaseAdmin.from('startups').select('id,name,tagline,stage,url,domain').eq('user_id', p.id).eq('archived', false).limit(20);
  let verified_total_cents = 0;
  let verified_currency = 'EUR';
  const sids = (startups || []).map((s: { id: string }) => s.id);
  if (p.show_revenue && sids.length > 0) {
    const { data: snaps } = await supabaseAdmin.from('revenue_snapshots').select('startup_id,mrr_cents,currency,created_at').eq('source', 'stripe').in('startup_id', sids).order('created_at', { ascending: false });
    const seen = new Set<string>();
    for (const r of snaps || []) {
      if (seen.has(r.startup_id)) continue;
      seen.add(r.startup_id);
      verified_total_cents += r.mrr_cents || 0;
      verified_currency = r.currency || verified_currency;
    }
  }
  const { data: gh } = await supabaseAdmin.from('github_cache').select('day,count').eq('user_id', p.id).order('day', { ascending: false }).limit(60);
  return NextResponse.json({
    profile: {
      handle: p.handle, name: p.name, locality: p.locality, bio: p.bio,
      avatar_url: p.avatar_url || p.avatar || null,
      socials: p.socials || {}, github_username: p.github_username || null,
      study_streak: p.study_streak || 0,
      show_revenue: Boolean(p.show_revenue),
      startups: startups || [],
      verified_total_cents: p.show_revenue ? verified_total_cents : null,
      verified_currency,
      github_series: gh || [],
    },
  });
}
