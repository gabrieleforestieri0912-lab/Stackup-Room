import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { isValidHandle, normalizeHandle, isValidUrlOrEmpty } from '@/lib/room/validation';

export const runtime = 'nodejs';

const EDITABLE = ['name', 'handle', 'locality', 'bio', 'socials', 'github_username', 'avatar_url', 'anonymous_mode', 'show_revenue', 'ai_consent'] as const;

function sanitizeSocials(v: unknown): Record<string, string> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (!['x', 'linkedin', 'website', 'youtube'].includes(k)) continue;
    if (typeof val !== 'string' || val.length > 500) continue;
    if (val !== '' && !isValidUrlOrEmpty(val)) continue;
    out[k] = val.trim();
  }
  return out;
}

// Profilo completo del proprietario (include campi privati).
export async function GET(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const authUser = token ? await getAuthUser(token) : null;
  if (!authUser) return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  if (!profile) return NextResponse.json({ message: 'Profilo non trovato' }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const authUser = token ? await getAuthUser(token) : null;
  if (!authUser) return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};

  if ('name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    if (!name) return NextResponse.json({ message: 'Nome richiesto' }, { status: 400 });
    patch.name = name;
  }
  if ('handle' in body) {
    const h = normalizeHandle(body.handle);
    if (h !== '') {
      if (!isValidHandle(h)) return NextResponse.json({ message: 'Handle non valido (3-24: minuscole, numeri, _)' }, { status: 400 });
      const { data: conflict } = await supabaseAdmin.from('profiles').select('id').eq('handle', h).neq('id', authUser.id).maybeSingle();
      if (conflict) return NextResponse.json({ message: 'Handle già in uso' }, { status: 409 });
      patch.handle = h;
    } else {
      patch.handle = null;
    }
  }
  if ('locality' in body) patch.locality = typeof body.locality === 'string' ? body.locality.trim().slice(0, 120) : null;
  if ('bio' in body) patch.bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 500) : null;
  if ('socials' in body) patch.socials = sanitizeSocials(body.socials);
  if ('github_username' in body) {
    const g = typeof body.github_username === 'string' ? body.github_username.trim().slice(0, 39) : '';
    if (g !== '' && !/^[a-zA-Z0-9-]{1,39}$/.test(g)) return NextResponse.json({ message: 'Username GitHub non valido' }, { status: 400 });
    patch.github_username = g || null;
  }
  if ('avatar_url' in body) {
    const a = typeof body.avatar_url === 'string' ? body.avatar_url.trim() : '';
    if (a !== '' && !isValidUrlOrEmpty(a)) return NextResponse.json({ message: 'Avatar URL non valido' }, { status: 400 });
    patch.avatar_url = a ? a.slice(0, 1000) : null;
  }
  for (const k of ['anonymous_mode', 'show_revenue'] as const) {
    if (k in body) patch[k] = body[k] === true;
  }
  if ('ai_consent' in body) {
    patch.ai_consent = body.ai_consent === true;
    patch.ai_consent_at = body.ai_consent === true ? new Date().toISOString() : null;
  }

  const unknown = Object.keys(body).filter((k) => !(EDITABLE as readonly string[]).includes(k));
  if (unknown.length > 0) return NextResponse.json({ message: `Campi non ammessi: ${unknown.join(', ')}` }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('profiles').update(patch).eq('id', authUser.id).select().maybeSingle();
  if (error) {
    if (String(error.message).includes('duplicate') || String(error.code) === '23505') {
      return NextResponse.json({ message: 'Handle già in uso' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Errore salvataggio' }, { status: 500 });
  }
  // Mirror consenso AI nella tabella dedicata (audit)
  if ('ai_consent' in patch) {
    await supabaseAdmin.from('ai_consents').upsert({
      user_id: authUser.id, granted: patch.ai_consent === true,
      granted_at: patch.ai_consent === true ? new Date().toISOString() : null, version: 1,
    });
  }
  return NextResponse.json({ profile: data });
}
