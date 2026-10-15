import { supabaseAdmin } from '@/lib/supabase-admin';

export const COACH_MODES = ['standup', 'planner', 'advisor', 'ask'] as const;
export type CoachMode = (typeof COACH_MODES)[number];

export const coachModel = () => process.env.AI_MODEL || process.env.ANTHROPIC_MODEL || 'anthropic/claude-sonnet-5';
// Consenso AI esplicito: senza, niente chiamate al provider (solo fallback offline).
export function aiAllowed(profile: { ai_consent?: boolean } | null | undefined): boolean {
  return profile?.ai_consent === true;
}
export const dailyLimit = () => Number(process.env.AI_DAILY_LIMIT || 50);

// Contesto: TUTTE le startup attive, task aperti, standup, goals, background.
// MAI contenuti community (chat, forum, annunci, eventi).
export async function buildContext(userId: string): Promise<string> {
  const { data: profile } = await supabaseAdmin.from('profiles').select('name,onboarding,study_streak').eq('id', userId).maybeSingle();
  const { data: startups } = await supabaseAdmin.from('startups').select('id,name,tagline,stage,url,revenue_self_cents').eq('user_id', userId).eq('archived', false).limit(20);
  const sids = (startups || []).map((s: { id: string }) => s.id);
  let tasks: Array<Record<string, unknown>> = [];
  let goals: Array<Record<string, unknown>> = [];
  let standups: Array<Record<string, unknown>> = [];
  if (sids.length > 0) {
    const [t, g] = await Promise.all([
      supabaseAdmin.from('tasks').select('startup_id,title,priority,status,due_date').in('startup_id', sids).neq('status', 'done').order('created_at').limit(50),
      supabaseAdmin.from('goals').select('startup_id,title,status,proof_note').in('startup_id', sids).eq('status', 'open').limit(30),
    ]);
    tasks = t.data || [];
    goals = g.data || [];
    const today = new Date().toISOString().slice(0, 10);
    const { data: su } = await supabaseAdmin.from('standups').select('startup_id,done,todo,blockers').in('startup_id', sids).eq('day', today);
    standups = su || [];
  }
  const nameOf = (sid: string) => (startups || []).find((s: { id: string }) => s.id === sid)?.name || sid;
  const ob = (profile?.onboarding || {}) as { situation?: string; skills?: string[]; goals?: string };

  const lines = [
    `Founder: ${profile?.name || '—'} (streak shipping: ${profile?.study_streak || 0}gg).`,
    `Background: situazione="${ob.situation || '—'}"; competenze=[${(ob.skills || []).join(', ') || '—'}]; obiettivi="${ob.goals || '—'}".`,
    `Startup attive (${(startups || []).length}):`,
    ...((startups || []).map((s: { name: string; stage: string; tagline: string | null; revenue_self_cents: number | null }) =>
      `  - ${s.name} [${s.stage}]${s.tagline ? `: ${s.tagline}` : ''}${s.revenue_self_cents != null ? ` (dichiarati €${(s.revenue_self_cents / 100).toLocaleString('it-IT')}/mese)` : ''}`)),
    `Task aperti (${tasks.length}):`,
    ...tasks.map((t) => `  - [${t.startup_id ? nameOf(t.startup_id as string) : '?'}] ${t.title} (priorità ${t.priority}${t.due_date ? `, scade ${t.due_date}` : ''})`),
    `Standup di oggi:`,
    ...(standups.length > 0
      ? standups.map((s) => `  - [${nameOf(s.startup_id as string)}] fatto: ${s.done || '—'} | da fare: ${s.todo || '—'} | blocchi: ${s.blockers || '—'}`)
      : ['  (nessuno compilato oggi)']),
    `Obiettivi aperti (${goals.length}):`,
    ...goals.map((g) => `  - [${nameOf(g.startup_id as string)}] ${g.title}`),
  ];
  return lines.join('\n').slice(0, 12000);
}

export function systemPrompt(mode: CoachMode): string {
  const base = 'Sei un consulente startup senior (StackUp coach). Italiano, tono professionale e diretto. Regole ferree: niente saluti, niente frasi motivazionali, niente domande di cortesia. Struttura ogni risposta così: 1) verdetto o risposta in 1-2 righe, 2) al massimo 3 azioni numerate con priorità e criterio di done, 3) cita i dati del contesto (startup, numeri, scadenze) quando rilevanti. Massimo ~180 parole. Se manca un dato chiave per decidere, fai UNA sola domanda mirata invece di rispondere.';
  switch (mode) {
    case 'standup':
      return `${base} Modalità standup: confronta standup di oggi e task aperti, indica il collo di bottiglia e le 3 priorità, con cosa tagliare.`;
    case 'planner':
      return `${base} Modalità day planner: da task e standup costruisci il piano in blocchi orari (deep work al mattino) con stime e cosa tagliare.`;
    case 'ask':
      return `${base} Modalità redattore forum: trasforma l'input in bozza domanda (titolo, contesto in 3 righe, tentativi fatti, domanda precisa). Solo la bozza.`;
    default:
      return `${base} Modalità advisor (validazione, marketing, pricing, launch): diagnosi basata sui dati del contesto, poi azioni. Una domanda chiarificatrice solo se bloccante.`;
  }
}

type ClaudeMsg = { role: 'user' | 'assistant'; content: string };

// Chiave xKiro solo lato server (gateway AI, formato Anthropic Messages).
// Ritorna testo completo + uso token.
export async function streamCoach(system: string, messages: ClaudeMsg[], onText: (t: string) => void): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const key = process.env.XKIRO_API_KEY;
  if (!key) throw new Error('COACH_NOT_CONFIGURED');
  const res = await fetch('https://api.xkiro.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: coachModel(), max_tokens: 700, system, messages, stream: true }),
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error('COACH_RATE_LIMITED');
    if (res.status === 401) throw new Error('COACH_NOT_CONFIGURED');
    throw new Error('COACH_FAILED');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  let inputTokens = 0;
  let outputTokens = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop() || '';
    for (const part of parts) {
      const line = part.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const ev = JSON.parse(payload) as { type: string; delta?: { text?: string }; message?: { usage?: { input_tokens?: number; output_tokens?: number } }; usage?: { input_tokens?: number; output_tokens?: number } };
        if (ev.type === 'content_block_delta' && ev.delta?.text) {
          full += ev.delta.text;
          onText(ev.delta.text);
        } else if ((ev.type === 'message_start' || ev.type === 'message_delta') && ev.usage) {
          inputTokens += ev.usage.input_tokens || 0;
          outputTokens += ev.usage.output_tokens || 0;
        }
      } catch {
        // chunk parziale: ignora
      }
    }
  }
  return { text: full, inputTokens, outputTokens };
}

export async function checkUsage(userId: string): Promise<{ used: number; limit: number; ok: boolean }> {
  const limit = dailyLimit();
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin.from('ai_usage').select('messages').eq('user_id', userId).eq('day', day).maybeSingle();
  const used = data?.messages || 0;
  return { used, limit, ok: used < limit };
}

export async function bumpUsage(userId: string): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin.from('ai_usage').select('messages').eq('user_id', userId).eq('day', day).maybeSingle();
  if (data) await supabaseAdmin.from('ai_usage').update({ messages: data.messages + 1 }).eq('user_id', userId).eq('day', day);
  else await supabaseAdmin.from('ai_usage').insert({ user_id: userId, day, messages: 1 });
}

// Speech-to-text dedicato (chiave solo server). Claude non accetta audio: senza provider
// la nota vocale resta inviabile senza trascrizione (fallback previsto dal prodotto).
export async function transcribeAudio(buf: Buffer, mime: string): Promise<string> {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error('STT_NOT_CONFIGURED');
  const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=it&smart_format=true', {
    method: 'POST',
    headers: { Authorization: `Token ${key}`, 'Content-Type': mime || 'audio/webm' },
    body: new Uint8Array(buf) as unknown as BodyInit,
  });
  if (!res.ok) throw new Error('STT_FAILED');
  const data = await res.json();
  const text = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript as string | undefined;
  if (!text) throw new Error('STT_EMPTY');
  return text;
}
