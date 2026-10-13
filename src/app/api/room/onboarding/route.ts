import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase-admin';
import { isAdult16, normalizeHandle, isValidHandle, isValidUrlOrEmpty } from '@/lib/room/validation';
import { cleanStr, extractDomain, logoUrlFor, STAGES } from '@/lib/room/m2';

export const runtime = 'nodejs';

// Onboarding guidato: profilo + background (età 16+) + startup attiva + primo obiettivo + prime task.
// Tutto in un unico submit: se la startup passa la validazione, viene creata con goal e task.
export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const authUser = token ? await getAuthUser(token) : null;
  if (!authUser) return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const situation = cleanStr(body.situation, 1000);
  const skills = Array.isArray(body.skills) ? body.skills.filter((s): s is string => typeof s === 'string').map((s) => s.trim().slice(0, 60)).filter(Boolean).slice(0, 20) : [];
  const goals = cleanStr(body.goals, 1000);
  const birthDate = typeof body.birth_date === 'string' ? body.birth_date : '';
  const handle = normalizeHandle(body.handle);
  const name = cleanStr(body.name, 80);

  if (!situation || !goals) return NextResponse.json({ message: 'Situazione e obiettivi richiesti' }, { status: 400 });
  if (!birthDate || !isAdult16(birthDate)) return NextResponse.json({ message: 'Devi avere almeno 16 anni' }, { status: 400 });
  if (!handle || !isValidHandle(handle)) return NextResponse.json({ message: 'Handle non valido (3-24: minuscole, numeri, _)' }, { status: 400 });
  if (!name) return NextResponse.json({ message: 'Nome richiesto' }, { status: 400 });

  // Step profilo esteso (facoltativi)
  const locality = cleanStr(body.locality, 120) || null;
  const bio = cleanStr(body.bio, 500) || null;
  const github = cleanStr(body.github_username, 39);
  if (github && !/^[a-zA-Z0-9-]{1,39}$/.test(github)) return NextResponse.json({ message: 'Username GitHub non valido' }, { status: 400 });

  // Step startup attiva (obbligatoria in onboarding)
  const sb = (body.startup || {}) as Record<string, unknown>;
  const sName = cleanStr(sb.name, 80);
  const sUrl = cleanStr(sb.url, 500);
  const sTagline = cleanStr(sb.tagline, 200);
  const sStage = typeof sb.stage === 'string' && (STAGES as readonly string[]).includes(sb.stage) ? sb.stage : 'idea';
  if (!sName) return NextResponse.json({ message: 'Nome della startup richiesto' }, { status: 400 });
  if (!isValidUrlOrEmpty(sUrl)) return NextResponse.json({ message: 'Link startup non valido' }, { status: 400 });

  // Step obiettivo + prime task
  const goal = cleanStr(body.goal_title, 200);
  const rawTasks = Array.isArray(body.tasks) ? body.tasks : [];
  const taskTitles = rawTasks.filter((t): t is string => typeof t === 'string').map((t) => t.trim().slice(0, 200)).filter(Boolean).slice(0, 5);
  if (!goal) return NextResponse.json({ message: 'Definisci il primo obiettivo' }, { status: 400 });
  if (taskTitles.length === 0) return NextResponse.json({ message: 'Aggiungi almeno una task iniziale' }, { status: 400 });

  const { data: conflict } = await supabaseAdmin.from('profiles').select('id').eq('handle', handle).neq('id', authUser.id).maybeSingle();
  if (conflict) return NextResponse.json({ message: 'Handle già in uso' }, { status: 409 });

  const { data: profile, error } = await supabaseAdmin.from('profiles').update({
    name, handle, birth_date: birthDate, locality, bio, github_username: github || null,
    onboarding: { situation, skills, goals },
    onboarding_completed: true,
  }).eq('id', authUser.id).select().maybeSingle();
  if (error) return NextResponse.json({ message: 'Errore salvataggio onboarding' }, { status: 500 });

  const domain = sUrl ? extractDomain(sUrl) : null;
  const { data: startup, error: sErr } = await supabaseAdmin.from('startups').insert({
    user_id: authUser.id, name: sName, domain, url: sUrl || null,
    tagline: sTagline || null, logo_url: logoUrlFor(domain, null), stage: sStage,
  }).select().single();
  if (sErr || !startup) return NextResponse.json({ message: 'Profilo salvato, ma la startup non è stata creata. Aggiungila dal portfolio.', profile }, { status: 207 });

  await supabaseAdmin.from('goals').insert({ user_id: authUser.id, startup_id: startup.id, title: goal });
  await supabaseAdmin.from('tasks').insert(taskTitles.map((title) => ({ user_id: authUser.id, startup_id: startup.id, title })));

  return NextResponse.json({ profile, startup_id: startup.id });
}
