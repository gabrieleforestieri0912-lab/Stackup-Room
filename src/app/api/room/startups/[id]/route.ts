import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, ownStartup } from '@/lib/room/api';
import { cleanStr, extractDomain, STAGES } from '@/lib/room/m2';
import { isValidUrlOrEmpty } from '@/lib/room/validation';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const { id } = await ctx.params;
  if (!(await ownStartup(user.id, id))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if ('name' in body) {
    const n = cleanStr(body.name, 80);
    if (!n) return NextResponse.json({ message: 'Nome richiesto' }, { status: 400 });
    patch.name = n;
  }
  if ('url' in body) {
    const u = cleanStr(body.url, 500);
    if (!isValidUrlOrEmpty(u)) return NextResponse.json({ message: 'Link non valido' }, { status: 400 });
    patch.url = u || null;
    patch.domain = u ? extractDomain(u) : null;
  }
  if ('tagline' in body) patch.tagline = cleanStr(body.tagline, 200) || null;
  if ('logo_url' in body) patch.logo_url = cleanStr(body.logo_url, 1000) || null;
  if ('stage' in body) {
    if (!(STAGES as readonly string[]).includes(String(body.stage))) return NextResponse.json({ message: 'Stadio non valido' }, { status: 400 });
    patch.stage = body.stage;
  }
  if ('revenue_self_cents' in body) {
    const r = body.revenue_self_cents == null || body.revenue_self_cents === '' ? null : Number(body.revenue_self_cents);
    if (r != null && (!Number.isInteger(r) || r < 0)) return NextResponse.json({ message: 'Revenue non valida' }, { status: 400 });
    patch.revenue_self_cents = r;
  }
  if ('archived' in body) patch.archived = body.archived === true;
  patch.updated_at = new Date().toISOString();

  const { data, error: upErr } = await supabaseAdmin.from('startups').update(patch).eq('id', id).select().single();
  if (upErr) return NextResponse.json({ message: 'Errore salvataggio' }, { status: 500 });
  return NextResponse.json({ startup: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const { id } = await ctx.params;
  if (!(await ownStartup(user.id, id))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
  await supabaseAdmin.from('startups').delete().eq('id', id);
  return NextResponse.json({ message: 'Startup eliminata' });
}
