import { supabaseAdmin } from './supabase-admin';

// Rate limiting su Postgres (tabella `rate_limits` + RPC `increment_rate_limit`).
//
// Politica: FAIL-CLOSED. Se la RPC fallisce (outage, quota, schema non
// applicato) il rate limiter deve DIRE NO, non lasciare passare: altrimenti un
// errore infra sposta il login/OTP da "5 tentativi al minuto" a "illimitato".
// Il fallback in-memory copre il caso in cui il DB non risponde.

export type RateLimitResult = { allowed: boolean; retryAfter?: number };

// Fallback in-memory per istanza (serverless: best-effort, non condiviso).
const memBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    if (memBuckets.size > 5000) {
      for (const [k, v] of memBuckets) if (v.resetAt <= now) memBuckets.delete(k);
    }
    return { allowed: true };
  }
  bucket.count += 1;
  if (bucket.count > maxRequests) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { allowed: true };
}

export async function rateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const windowKey = `${key}:${Math.floor(Date.now() / windowMs)}`;

  try {
    const { data, error } = await supabaseAdmin.rpc('increment_rate_limit', {
      p_key: windowKey,
      p_window_ms: windowMs,
      p_max_requests: maxRequests,
    });

    if (error) throw error;
    if (!data) throw new Error('rate limit: risposta vuota');

    return {
      allowed: data.allowed === true,
      retryAfter: data.retryAfter ?? undefined,
    };
  } catch (err) {
    // Fail-closed con fallback in-memory: niente porte aperte se il DB cade.
    console.error('[rateLimit] RPC fallita, uso il fallback in-memory:', err instanceof Error ? err.message : err);
    return memoryLimit(windowKey, maxRequests, windowMs);
  }
}

/**
 * Indirizzo IP del client.
 *
 * `x-forwarded-for` è una catena append-only: l'elemento PIÙ A SINISTRA è
 * quello che il client ha potuto scegliere liberamente, l'ultimo è quello
 * aggiunto dal proxy più vicino. Usare [0] permette di bypassare ogni limite
 * ruotando l'header. Per questo si prende l'ultimo elemento valido.
 * Se la catena è assente si usa 'unknown' (tutti gli anonimi condividono il
 * bucket: peggio di un bypass, ma comunque limitato).
 */
export function clientIp(req: { headers: Headers | Record<string, string | string[] | undefined> }): string {
  const read = (name: string): string | undefined => {
    if (req.headers instanceof Headers) return req.headers.get(name) ?? undefined;
    const v = (req.headers as Record<string, string | string[] | undefined>)[name];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const raw = read('x-forwarded-for');
  if (raw) {
    const chain = raw.split(',').map((s) => s.trim()).filter(Boolean);
    // Ultimo elemento = aggiunto dal proxy più vicino (non falsificabile dal client).
    const last = chain[chain.length - 1];
    if (last) return last;
  }

  const real = read('x-real-ip');
  if (real && real.trim()) return real.trim();

  return 'unknown';
}

export function rateLimitKey(
  req: { headers: Headers | Record<string, string | string[] | undefined>; url?: string },
  suffix: string,
): string {
  const ip = clientIp(req);
  // Solo il path: la query string non deve distinguere due bucket ("a" e "b"
  // porterebbero a bucket diversi per la stessa risorsa).
  let path = (req.url || '').split('?')[0];
  try {
    // req.url può essere un URL assoluto (NextRequest) o un path.
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    /* URL non valido: si usa il valore grezzo */
  }
  return `${ip}:${path}:${suffix}`;
}
