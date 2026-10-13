import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember, authorsFor, blockedIds, displayName } from '@/lib/room/community';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';
import { isAdminEmail } from '@/lib/room/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const kind = new URL(req.url).searchParams.get('kind');
  let q = supabaseAdmin.from('network_posts').select('*').order('created_at', { ascending: false }).limit(50);
  if (kind === 'offro' || kind === 'cerco') q = q.eq('kind', kind);
  const { data } = await q;
  const blocked = await blockedIds(user.id);
  const visible = (data || []).filter((n: { user_id: string }) => !blocked.has(n.user_id));
  const authors = await authorsFor(visible.map((n: { user_id: string }) => n.user_id));
  return NextResponse.json({
    posts: visible.map((n: Record<string, unknown>) => ({
      ...n, author: displayName(authors[n.user_id as string]), mine: n.user_id === user.id,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const rl = await rateLimit(rateLimitKey(req, `network:${user.id}`), 10, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = body.kind === 'cerco' ? 'cerco' : body.kind === 'offro' ? 'offro' : '';
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : '';
  if (!kind || !title) return NextResponse.json({ message: 'Tipo e titolo richiesti' }, { status: 400 });
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 2000) : '';
  const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, 200) : '';
  const { data, error: ins } = await supabaseAdmin.from('network_posts').insert({
    user_id: user.id, kind, title, body: text, contact: contact || null,
  }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore pubblicazione' }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { user } = await requireMember(req);
  if (!user) return unauthorized();
  const id = new URL(req.url).searchParams.get('id');
  const { data: n } = await supabaseAdmin.from('network_posts').select('user_id').eq('id', id).maybeSingle();
  if (!n) return NextResponse.json({ message: 'Annuncio non trovato' }, { status: 404 });
  if (n.user_id !== user.id && !isAdminEmail(user.email)) return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
  await supabaseAdmin.from('network_posts').delete().eq('id', id);
  return NextResponse.json({ message: 'Annuncio eliminato' });
}
