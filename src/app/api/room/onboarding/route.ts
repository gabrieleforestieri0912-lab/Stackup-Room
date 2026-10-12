import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase-admin';
import { isAdult16, normalizeHandle, isValidHandle } from '@/lib/room/validation';

export const runtime = 'nodejs';

// Onboarding founder: situazione, competenze, obiettivi + età minima 16 + handle.
export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const authUser = token ? await getAuthUser(token) : null;
  if (!authUser) return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const situation = typeof body.situation === 'string' ? body.situation.trim().slice(0, 1000) : '';
  const skills = Array.isArray(body.skills) ? body.skills.filter((s): s is string => typeof s === 'string').map((s) => s.trim().slice(0, 60)).filter(Boolean).slice(0, 20) : [];
  const goals = typeof body.goals === 'string' ? body.goals.trim().slice(0, 1000) : '';
  const birthDate = typeof body.birth_date === 'string' ? body.birth_date : '';
  const handle = normalizeHandle(body.handle);
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';

  if (!situation || !goals) return NextResponse.json({ message: 'Situazione e obiettivi richiesti' }, { status: 400 });
  if (!birthDate || !isAdult16(birthDate)) return NextResponse.json({ message: 'Devi avere almeno 16 anni' }, { status: 400 });
  if (!handle || !isValidHandle(handle)) return NextResponse.json({ message: 'Handle non valido (3-24: minuscole, numeri, _)' }, { status: 400 });
  if (!name) return NextResponse.json({ message: 'Nome richiesto' }, { status: 400 });

  const { data: conflict } = await supabaseAdmin.from('profiles').select('id').eq('handle', handle).neq('id', authUser.id).maybeSingle();
  if (conflict) return NextResponse.json({ message: 'Handle già in uso' }, { status: 409 });

  const { data, error } = await supabaseAdmin.from('profiles').update({
    name, handle, birth_date: birthDate,
    onboarding: { situation, skills, goals },
    onboarding_completed: true,
  }).eq('id', authUser.id).select().maybeSingle();

  if (error) return NextResponse.json({ message: 'Errore salvataggio onboarding' }, { status: 500 });
  return NextResponse.json({ profile: data });
}
