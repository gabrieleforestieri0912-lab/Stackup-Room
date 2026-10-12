import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireMember, REASONS, notify } from '@/lib/room/community';
import { isAdminEmail } from '@/lib/room/admin';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const TARGETS = ['chat', 'topic', 'post', 'network', 'event'] as const;

// Snippet server-side del contenuto segnalato (l'utente invia solo motivo + ID).
async function snippetFor(target: string, id: string): Promise<string> {
  try {
    if (target === 'chat') {
      const { data } = await supabaseAdmin.from('chat_messages').select('body').eq('id', id).maybeSingle();
      return String(data?.body || '').slice(0, 300);
    }
    if (target === 'topic') {
      const { data } = await supabaseAdmin.from('forum_topics').select('title,body').eq('id', id).maybeSingle();
      return `${data?.title || ''} — ${String(data?.body || '').slice(0, 200)}`.slice(0, 300);
    }
    if (target === 'post') {
      const { data } = await supabaseAdmin.from('forum_posts').select('body').eq('id', id).maybeSingle();
      return String(data?.body || '').slice(0, 300);
    }
    if (target === 'network') {
      const { data } = await supabaseAdmin.from('network_posts').select('title,body').eq('id', id).maybeSingle();
      return `${data?.title || ''} — ${String(data?.body || '').slice(0, 200)}`.slice(0, 300);
    }
    const { data } = await supabaseAdmin.from('events').select('title,description').eq('id', id).maybeSingle();
    return `${data?.title || ''} — ${String(data?.description || '').slice(0, 200)}`.slice(0, 300);
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  const rl = await rateLimit(rateLimitKey(req, `report:${user.id}`), 20, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe segnalazioni. Riprova più tardi.' }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const target = TARGETS.includes(body.target_type as (typeof TARGETS)[number]) ? String(body.target_type) : '';
  const targetId = typeof body.target_id === 'string' ? body.target_id : '';
  const reason = (REASONS as readonly string[]).includes(String(body.reason)) ? String(body.reason) : '';
  if (!target || !targetId || !reason) return NextResponse.json({ message: 'Dati segnalazione non validi' }, { status: 400 });
  const snippet = await snippetFor(target, targetId);
  const { data, error: ins } = await supabaseAdmin.from('reports').insert({
    reporter_id: user.id, target_type: target, target_id: targetId, reason, snippet,
  }).select().single();
  if (ins) return NextResponse.json({ message: 'Errore invio segnalazione' }, { status: 500 });
  return NextResponse.json({ report: data }, { status: 201 });
}

// Coda di revisione admin (SLA 24h: ordinata per anzianità).
export async function GET(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  if (!isAdminEmail(user.email)) return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
  const status = new URL(req.url).searchParams.get('status') || 'open';
  const { data } = await supabaseAdmin.from('reports').select('*').eq('status', status).order('created_at').limit(100);
  return NextResponse.json({ reports: data || [] });
}

// Risoluzione admin (con notifica al segnalante).
export async function PATCH(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error || !user) return error;
  if (!isAdminEmail(user.email)) return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof body.id === 'string' ? body.id : '';
  const status = body.status === 'resolved' ? 'resolved' : body.status === 'dismissed' ? 'dismissed' : '';
  if (!id || !status) return NextResponse.json({ message: 'Dati non validi' }, { status: 400 });
  const { data, error: up } = await supabaseAdmin.from('reports').update({ status }).eq('id', id).select().single();
  if (up) return NextResponse.json({ message: 'Errore aggiornamento' }, { status: 500 });
  await notify(data.reporter_id, 'report_update', `La tua segnalazione è stata ${status === 'resolved' ? 'risolta' : 'archiviata'}.`);
  return NextResponse.json({ report: data });
}
