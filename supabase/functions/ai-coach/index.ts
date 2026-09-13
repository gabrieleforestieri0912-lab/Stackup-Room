// Edge Function: ai-coach — proxy LLM con contesto progetti dell'utente
// Mai chiave LLM lato client. Legge OPENAI_API_KEY / ANTHROPIC_API_KEY da supabase secrets.
// Supporta streaming token-per-token via SSE se provider lo consente; fallback mock deterministico.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function mockResponse(prompt: string, context: unknown): string {
  const ctx = JSON.stringify(context).slice(0, 400);
  return `**Mock AI Coach (LLM non configurato)**\n\nHai chiesto: "${prompt.slice(0, 200)}"\n\nContesto progetti (troncato): ${ctx}\n\nSuggerimento: collega una chiave LLM in supabase secrets (OPENAI_API_KEY) per risposte reali. Intanto — prova a scomporre il task in 3 passi concreti e shippa uno oggi.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiKey = Deno.env.get("OPENAI_API_KEY") ?? Deno.env.get("LLM_API_KEY");

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseAuth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let body: { messages?: { role: string; content: string }[]; startup_id?: string | null; stream?: boolean } = {};
  try { body = await req.json(); } catch (_) {}
  const messages = body.messages ?? [];
  const startupId = body.startup_id ?? null;
  const wantStream = body.stream ?? true;
  if (messages.length === 0) return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  // Costruisci contesto strutturato (progetti recenti + ultimi check-in)
  const supabaseService = createClient(supabaseUrl, serviceKey);
  const { data: startups } = await supabaseService.from("startups").select("id,name,status,description,mrr_cents").eq("owner_id", user.id).eq("is_archived", false).limit(5);
  const { data: recentMsgs } = await supabaseService.from("ai_messages").select("role,content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6);
  const contextPayload = { startups: startups ?? [], recentHistory: (recentMsgs ?? []).reverse(), startup_id: startupId, tasksHint: "vedi Hive today_tasks_v2 lato client per task del giorno" };

  const lastPrompt = messages[messages.length - 1]?.content ?? "";

  // Salva messaggio utente in ai_messages
  await supabaseService.from("ai_messages").insert({ user_id: user.id, startup_id: startupId, role: "user", content: lastPrompt });

  // Se LLM non configurato → mock streaming o json
  if (!openaiKey) {
    const mock = mockResponse(lastPrompt, contextPayload);
    if (wantStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of mock.split(/(?<=\n| )/)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`));
            await new Promise((r) => setTimeout(r, 18));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        },
      });
      // Salva risposta completa dopo streaming mock (fire-and-forget)
      supabaseService.from("ai_messages").insert({ user_id: user.id, startup_id: startupId, role: "assistant", content: mock }).then(() => {});
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
    }
    await supabaseService.from("ai_messages").insert({ user_id: user.id, startup_id: startupId, role: "assistant", content: mock });
    return new Response(JSON.stringify({ content: mock, mock: true, context: contextPayload }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // LLM reale — OpenAI chat completions con streaming SSE
  const systemPrompt = `Sei StackUp AI Coach — compagno quotidiano per founder solo. Tono diretto, orientato all'azione, breve. Contesto progetti: ${JSON.stringify(contextPayload).slice(0, 3000)}. Rispondi in italiano, max 220 parole, 1 azione concreta alla fine.`;
  const openaiMessages = [{ role: "system", content: systemPrompt }, ...messages.map((m) => ({ role: m.role, content: m.content }))];

  if (wantStream) {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: openaiMessages, stream: true, max_tokens: 500 }),
    });
    if (!resp.ok || !resp.body) {
      const mock = mockResponse(lastPrompt, contextPayload);
      await supabaseService.from("ai_messages").insert({ user_id: user.id, startup_id: startupId, role: "assistant", content: mock });
      return new Response(JSON.stringify({ content: mock, fallback: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let full = "";
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const out = new ReadableStream({
      async start(controller) {
        const reader = resp.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            for (const line of text.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;
              try {
                const j = JSON.parse(payload);
                const delta = j.choices?.[0]?.delta?.content ?? "";
                if (delta) {
                  full += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                }
              } catch (_) {}
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
          if (full) await supabaseService.from("ai_messages").insert({ user_id: user.id, startup_id: startupId, role: "assistant", content: full });
        } catch (_) {
          controller.close();
        }
      },
    });
    return new Response(out, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
  }

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: openaiMessages, max_tokens: 500 }),
  });
  const j = await resp.json();
  const content = j.choices?.[0]?.message?.content ?? mockResponse(lastPrompt, contextPayload);
  await supabaseService.from("ai_messages").insert({ user_id: user.id, startup_id: startupId, role: "assistant", content });
  return new Response(JSON.stringify({ content, context: contextPayload }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
