import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, ownStartup, unauthorized } from '@/lib/room/api';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';
import { readSafeImage } from '@/lib/room/upload';

export const runtime = 'nodejs';
const MAX_BYTES = 2 * 1024 * 1024;

// Upload logo startup dal computer: bucket pubblico `avatars` (già esistente),
// path dedicato `${user}/startup-${id}` per non toccare l'avatar profilo.
// Il tipo reale del file è dedotto dai magic bytes (niente SVG/HTML serviti dal bucket pubblico).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;
  if (!(await ownStartup(user.id, id))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });
  const rl = await rateLimit(rateLimitKey(req, `startup-logo:${user.id}`), 20, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('logo');
  if (!(file instanceof Blob) || file.size === 0) return NextResponse.json({ message: 'Immagine mancante' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ message: 'Immagine fino a 2MB' }, { status: 400 });

  let safe: Awaited<ReturnType<typeof readSafeImage>>;
  try {
    safe = await readSafeImage(file);
  } catch {
    return NextResponse.json({ message: 'Formato immagine non supportato (PNG, JPG, WEBP o GIF)' }, { status: 400 });
  }

  const path = `${user.id}/startup-${id}.${safe.ext}`;
  const { error: up } = await supabaseAdmin.storage.from('avatars').upload(
    path, safe.buffer, { contentType: safe.contentType, upsert: true },
  );
  if (up) return NextResponse.json({ message: 'Upload fallito' }, { status: 500 });

  const { data: pub } = supabaseAdmin.storage.from('avatars').getPublicUrl(path);
  const url = pub.publicUrl;

  const { error } = await supabaseAdmin.from('startups').update({ logo_url: url, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ message: 'Errore salvataggio logo' }, { status: 500 });

  return NextResponse.json({ url }, { status: 201 });
}
