import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, unauthorized } from '@/lib/room/api';
import { cleanStr, extractDomain, logoUrlFor, STAGES } from '@/lib/room/m2';
import { isValidUrlOrEmpty } from '@/lib/room/validation';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const { data } = await supabaseAdmin.from('startups').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return NextResponse.json({ startups: data || [] });
}

export async function POST(req: NextRequest) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const name = cleanStr(body.name, 80);
  if (!name) return NextResponse.json({ message: 'Nome startup richiesto' }, { status: 400 });
  const url = cleanStr(body.url, 500);
  if (!isValidUrlOrEmpty(url)) return NextResponse.json({ message: 'Link non valido' }, { status: 400 });
  const stage = typeof body.stage === 'string' && (STAGES as readonly string[]).includes(body.stage) ? body.stage : 'idea';

  const countRes = await supabaseAdmin.from('startups').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  if ((countRes.count || 0) >= 20) return NextResponse.json({ message: 'Limite di 20 startup raggiunto' }, { status: 400 });

  const domain = url ? extractDomain(url) : null;
  const explicitLogo = cleanStr(body.logo_url, 1000);
  const revenue = body.revenue_self_cents == null || body.revenue_self_cents === '' ? null : Number(body.revenue_self_cents);
  if (revenue != null && (!Number.isInteger(revenue) || revenue < 0 || revenue > 1_000_000_000_00)) {
    return NextResponse.json({ message: 'Revenue auto-dichiarata non valida' }, { status: 400 });
  }

  const { data, error: insErr } = await supabaseAdmin.from('startups').insert({
    user_id: user.id, name, domain, url: url || null,
    tagline: cleanStr(body.tagline, 200) || null,
    logo_url: logoUrlFor(domain, explicitLogo || null),
    stage, revenue_self_cents: revenue,
  }).select().single();
  if (insErr) return NextResponse.json({ message: 'Errore creazione startup' }, { status: 500 });
  return NextResponse.json({ startup: data }, { status: 201 });
}
