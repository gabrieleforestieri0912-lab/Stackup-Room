// Edge Function: github-sync — OAuth GitHub per-utente + fetch attività contributi.
//
// Fase 7. Nessun client secret lato client: GitHub viene contattato solo qui.
//
// Flusso:
//  1. App autenticata → POST { action: "authorize" }  → { authorize_url } (o { connected: true } se già collegato)
//  2. Utente autorizza su GitHub → redirect a questa stessa function con ?code=&state=
//     (state = "<user_id>.<hmac>": nessun JWT disponibile sul redirect)
//  3. Function scambia il code con un access_token, lo salva in public.github_accounts
//     (RLS senza policy → solo service_role) e denormalizza login su public.profiles
//  4. App → POST { action: "sync" } → legge il token salvato, conta le attività 30gg
//
// Secrets richiesti: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET.
// Opzionale: GITHUB_STATE_SECRET (firma dello state; fallback: SUPABASE_SERVICE_ROLE_KEY).
// Redirect URI da registrare sull'OAuth App: <SUPABASE_URL>/functions/v1/github-sync

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GITHUB_API = "https://api.github.com";
const GITHUB_OAUTH = "https://github.com/login/oauth";
const SCOPES = "read:user";
const GH_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "stackup-room",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const html = (message: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <title>Stackup Room</title></head>
     <body style="margin:0;background:#0A0A0A;color:#F2F2F2;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center">
       <div style="max-width:420px;padding:32px;text-align:center">
         <div style="font-size:15px;line-height:1.5">${message}</div>
         <div style="margin-top:16px;font-size:12px;color:#9A9A9A">Puoi chiudere questa finestra e tornare nell'app.</div>
       </div>
     </body></html>`,
    { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );

/** Firma HMAC-SHA256 dello user_id (base64url) per validare lo state OAuth. */
async function signState(userId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(userId));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Conta le attività GitHub degli ultimi 30 giorni dagli eventi pubblici. */
async function countRecentActivity(login: string, headers: Record<string, string>): Promise<number> {
  const res = await fetch(`${GITHUB_API}/users/${login}/events/public?per_page=100`, { headers });
  if (!res.ok) return 0;
  const events = await res.json();
  if (!Array.isArray(events)) return 0;
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return events
    .filter((e) => new Date(e.created_at).getTime() >= since)
    .reduce((acc, e) => acc + (Array.isArray(e.payload?.commits) ? e.payload.commits.length : 1), 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const clientId = Deno.env.get("GITHUB_CLIENT_ID");
  const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");
  const stateSecret = Deno.env.get("GITHUB_STATE_SECRET") ?? serviceKey;
  const redirectUri = `${supabaseUrl}/functions/v1/github-sync`;
  const service = createClient(supabaseUrl, serviceKey);

  // ---------- 1) OAuth callback (redirect GitHub → qui, nessun JWT) ----------
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (code && state) {
    const [userId, signature] = state.split(".");
    const expected = userId ? await signState(userId, stateSecret) : "";
    if (!userId || signature !== expected) {
      return html("Stato OAuth non valido o scaduto. Riprova dal profilo.", 400);
    }
    if (!clientId || !clientSecret) {
      return html("OAuth GitHub non configurato sul server (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).", 500);
    }
    try {
      const tokenRes = await fetch(`${GITHUB_OAUTH}/access_token`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
      });
      const tokenJson = await tokenRes.json();
      const accessToken: string | undefined = tokenJson.access_token;
      if (!accessToken) {
        return html(`Autorizzazione GitHub fallita: ${tokenJson.error_description ?? tokenJson.error ?? "errore sconosciuto"}`, 400);
      }

      const ghUserRes = await fetch(`${GITHUB_API}/user`, { headers: GH_HEADERS(accessToken) });
      const ghUser = await ghUserRes.json();
      const login: string = ghUser.login ?? "";
      const now = new Date().toISOString();

      // Token salvato SOLO server-side (github_accounts: RLS senza policy).
      await service.from("github_accounts").upsert({
        user_id: userId,
        github_login: login,
        access_token: accessToken,
        scope: tokenJson.scope ?? SCOPES,
        synced_at: now,
      });

      // Metadati denormalizzati visibili al client (nessun token).
      await service.from("profiles").update({
        github_login: login,
        github_synced_at: now,
      }).eq("id", userId);

      return html(`GitHub collegato come <strong>@${login}</strong>.`);
    } catch (e) {
      return html(`Errore durante il collegamento GitHub: ${e}`, 502);
    }
  }

  // ---------- 2) Richieste autenticate dall'app ----------
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseAuth = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  let body: { action?: string } = {};
  try { body = await req.json(); } catch (_) { /* body opzionale */ }
  const action = body.action ?? "sync";

  const { data: account } = await service
    .from("github_accounts")
    .select("github_login, access_token")
    .eq("user_id", user.id)
    .maybeSingle();

  // action = "authorize": ritorna l'URL OAuth (o segnala che è già collegato).
  if (action === "authorize") {
    if (account) return json({ connected: true, login: account.github_login });
    if (!clientId || !clientSecret) {
      return json({
        connected: false,
        authorize_url: null,
        message: "OAuth GitHub non configurato (GITHUB_CLIENT_ID/SECRET) — sync in modalità mock",
      });
    }
    const signature = await signState(user.id, stateSecret);
    const authorizeUrl =
      `${GITHUB_OAUTH}/authorize?client_id=${encodeURIComponent(clientId)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&state=${encodeURIComponent(`${user.id}.${signature}`)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return json({ connected: false, authorize_url: authorizeUrl });
  }

  // action = "sync": legge il token per-utente e aggiorna le metriche.
  if (!account) {
    return json({
      synced: false,
      connected: false,
      mock: true,
      contributions: 0,
      message: "Nessun account GitHub collegato — usa “GitHub sync” per collegarlo",
    });
  }

  try {
    const headers = GH_HEADERS(account.access_token);
    const contributions = await countRecentActivity(account.github_login, headers);
    const now = new Date().toISOString();

    await service.from("github_accounts")
      .update({ contributions_30d: contributions, synced_at: now })
      .eq("user_id", user.id);
    await service.from("profiles")
      .update({ github_login: account.github_login, github_contributions: contributions, github_synced_at: now })
      .eq("id", user.id);

    return json({
      synced: true,
      connected: true,
      login: account.github_login,
      contributions,
      message: `@${account.github_login} • ${contributions} attività (30gg)`,
    });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
});
