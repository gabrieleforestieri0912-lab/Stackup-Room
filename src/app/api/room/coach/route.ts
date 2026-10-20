import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { requireMember } from '@/lib/room/community';
import { COACH_MODES, buildContext, systemPrompt, streamCoach, checkUsage, bumpUsage, aiAllowed, type CoachMode } from '@/lib/room/coach';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';

function sseError(message: string): Response {
  return new Response(`data: ${JSON.stringify({ error: message })}\n\n`, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}

// Chat coach in streaming (SSE). Richiede consenso AI esplicito + limite giornaliero.
export async function POST(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const mode = COACH_MODES.includes(body.mode as CoachMode) ? (body.mode as CoachMode) : 'advisor';
  const text = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : '';
  if (!text) return sseError('Messaggio vuoto.');
  const startupId = typeof body.startup_id === 'string' && body.startup_id ? body.startup_id : null;

  const { data: profile } = await supabaseAdmin.from('profiles').select('ai_consent').eq('id', user.id).maybeSingle();
  if (!aiAllowed(profile)) return sseError('NEED_CONSENT');

  const usage = await checkUsage(user.id);
  if (!usage.ok) return sseError(`Limite giornaliero raggiunto (${usage.limit} messaggi). Riprova domani.`);
  const rl = await rateLimit(rateLimitKey(req, `coach:${user.id}`), 20, 60_000);
  if (!rl.allowed) return sseError('Troppe richieste. Riprova tra poco.');

  if (startupId) {
    const { data: s } = await supabaseAdmin.from('startups').select('id').eq('id', startupId).eq('user_id', user.id).maybeSingle();
    if (!s) return sseError('Startup non trovata.');
  }

  let sessionId = typeof body.session_id === 'string' ? body.session_id : null;
  if (sessionId) {
    const { data: sess } = await supabaseAdmin.from('ai_sessions').select('id,mode').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
    if (!sess) return sseError('Sessione non trovata.');
    if (sess.mode !== mode) return sseError('Modalità diversa dalla sessione.');
  } else {
    const { data: sess, error: sErr } = await supabaseAdmin.from('ai_sessions').insert({ user_id: user.id, mode, startup_id: startupId }).select().single();
    if (sErr || !sess) return sseError('Errore creazione sessione.');
    sessionId = sess.id;
  }

  const { data: history } = await supabaseAdmin.from('ai_messages').select('role,content').eq('session_id', sessionId).order('created_at').limit(20);
  await supabaseAdmin.from('ai_messages').insert({ session_id: sessionId, user_id: user.id, role: 'user', content: text });

  const context = await buildContext(user.id);
  const system = `${systemPrompt(mode)}\n\nCONTESTO FOUNDER (non farlo ripetere all'utente):\n${context}`;
  const messages = [...(history || []).map((m: { role: string; content: string }) => ({
    role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: m.content.slice(0, 4000),
  })), { role: 'user' as const, content: text }];

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: object) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      send({ session_id: sessionId });
      try {
        const { text: full } = await streamCoach(system, messages, (t) => send({ text: t }));
        if (full) {
          await supabaseAdmin.from('ai_messages').insert({ session_id: sessionId, user_id: user!.id, role: 'assistant', content: full.slice(0, 12000) });
          await bumpUsage(user!.id);
        }
        send({ done: true });
      } catch (e) {
        const code = e instanceof Error ? e.message : 'COACH_FAILED';
        send({
          error: code === 'COACH_NOT_CONFIGURED'
            ? 'Coach non configurato (manca XKIRO_API_KEY lato server).'
            : code === 'COACH_RATE_LIMITED'
              ? 'Il provider AI è sovraccarico. Riprova tra poco.'
              : 'Il coach non risponde. Riprova più tardi.',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } });
}

export async function GET(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const { data } = await supabaseAdmin.from('ai_sessions').select('id,mode,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
  return NextResponse.json({ sessions: data || [] });
}

export async function DELETE(req: NextRequest) {
  const { error, user } = await requireMember(req);
  if (error) return error;
  if (!user) return unauthorized();
  const id = new URL(req.url).searchParams.get('id');
  await supabaseAdmin.from('ai_sessions').delete().eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ message: 'Sessione eliminata' });
}
