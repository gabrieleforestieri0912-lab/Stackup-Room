import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireUser, ownStartup } from '@/lib/room/api';
import { rateLimit, rateLimitKey } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const MAX_BYTES = 5 * 1024 * 1024;

// Upload prova visiva per un obiettivo (storage privato, path salvato su goals.screenshot_path).
export async function POST(req: NextRequest) {
  const { error, user } = await requireUser(req);
  if (error || !user) return error;
  const rl = await rateLimit(rateLimitKey(req, `proofs:${user.id}`), 20, 3600_000);
  if (!rl.allowed) return NextResponse.json({ message: 'Troppe richieste. Riprova più tardi.' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const goalId = typeof form?.get('goal_id') === 'string' ? (form.get('goal_id') as string) : '';
  const { data: goal } = await supabaseAdmin.from('goals').select('id,startup_id').eq('id', goalId).eq('user_id', user.id).maybeSingle();
  if (!goal) return NextResponse.json({ message: 'Obiettivo non trovato' }, { status: 404 });
  if (!(await ownStartup(user.id, goal.startup_id))) return NextResponse.json({ message: 'Startup non trovata' }, { status: 404 });

  const shot = form?.get('screenshot');
  if (!(shot instanceof Blob) || shot.size === 0) return NextResponse.json({ message: 'Immagine mancante' }, { status: 400 });
  if (shot.size > MAX_BYTES) return NextResponse.json({ message: 'Immagine fino a 5MB' }, { status: 400 });
  if (shot.type && !shot.type.startsWith('image/')) return NextResponse.json({ message: 'Solo immagini' }, { status: 400 });

  const path = `${user.id}/${goalId}-${Date.now()}.png`;
  const { error: up } = await supabaseAdmin.storage.from('proofs').upload(
    path, Buffer.from(await shot.arrayBuffer()), { contentType: shot.type || 'image/png', upsert: false },
  );
  if (up) return NextResponse.json({ message: 'Upload fallito' }, { status: 500 });
  await supabaseAdmin.from('goals').update({ screenshot_path: path }).eq('id', goalId);
  return NextResponse.json({ screenshot_path: path }, { status: 201 });
}
