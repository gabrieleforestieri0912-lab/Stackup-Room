import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin, getAuthUser } from '@/lib/supabase-admin';
import { unauthorized } from '@/lib/room/api';
import { isAdult16, normalizeHandle, isValidHandle, isValidUrlOrEmpty } from '@/lib/room/validation';
import { cleanStr, extractDomain, logoUrlFor, STAGES } from '@/lib/room/m2';
import { isStartupStatus, stageForStatus } from '@/lib/room/onboarding';

export const runtime = 'nodejs';

// Onboarding guidato: profilo + background (età 16+) + startup attiva + situazione
// e focus + prime task. Tutto in un unico submit: se la startup passa la validazione,
// viene creata con goal e task.
export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  const authUser = token ? await getAuthUser(token) : null;
  if (!authUser) return NextResponse.json({ message: 'Non autorizzato' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const situation = cleanStr(body.situation, 1000);
  const skills = Array.isArray(body.skills) ? body.skills.filter((s): s is string => typeof s === 'string').map((s) => s.trim().slice(0, 60)).filter(Boolean).slice(0, 20) : [];
  const goals = cleanStr(body.goals, 1000);
  const startupStatus = isStartupStatus(body.startup_status) ? body.startup_status : '';
  const birthDate = typeof body.birth_date === 'string' ? body.birth_date : '';
  const handle = normalizeHandle(body.handle);
  const name = cleanStr(body.name, 80);

  if (!situation || !goals) return NextResponse.json({ message: 'Situazione e obiettivi richiesti' }, { status: 400 });
  if (!birthDate || !isAdult16(birthDate)) return NextResponse.json({ message: 'Devi avere almeno 16 anni' }, { status: 400 });
  if (!handle || !isValidHandle(handle)) return NextResponse.json({ message: 'Handle non valido (3-24: minuscole, numeri, _)' }, { status: 400 });
  if (!name) return NextResponse.json({ message: 'Nome richiesto' }, { status: 400 });

  // Step profilo esteso
  const locality = cleanStr(body.locality, 120);
  const bio = cleanStr(body.bio, 500);
  if (!locality) return NextResponse.json({ message: 'Località richiesta' }, { status: 400 });
  if (!bio) return NextResponse.json({ message: 'Bio richiesta' }, { status: 400 });
  const github = cleanStr(body.github_username, 39);
  if (!github) return NextResponse.json({ message: 'Username GitHub richiesto' }, { status: 400 });
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(github)) return NextResponse.json({ message: 'Username GitHub non valido' }, { status: 400 });
  const avatarUrl = cleanStr(body.avatar_url, 1000);
  if (avatarUrl && !isValidUrlOrEmpty(avatarUrl)) return NextResponse.json({ message: 'Avatar non valido' }, { status: 400 });

  // Step startup (facoltativo: 0..10 startup)
  const rawStartups = Array.isArray(body.startups) ? body.startups : [];
  const startupsData: { name: string; url: string; domain: string; tagline: string; stage: string }[] = [];
  for (const raw of rawStartups) {
    if (startupsData.length >= 10) break;
    const sb = (raw || {}) as Record<string, unknown>;
    const sName = cleanStr(sb.name, 80);
    const sUrlRaw = cleanStr(sb.url, 500);
    const sDomain = extractDomain(cleanStr(sb.domain, 255) || sUrlRaw);
    const sTagline = cleanStr(sb.tagline, 200);
    if (!sName && !sDomain) continue; // riga vuota: ignorata
    if (!sName) return NextResponse.json({ message: 'Nome della startup richiesto' }, { status: 400 });
    if (!sDomain) return NextResponse.json({ message: 'Dominio startup non valido' }, { status: 400 });
    if (sUrlRaw && !isValidUrlOrEmpty(sUrlRaw)) return NextResponse.json({ message: 'Link startup non valido' }, { status: 400 });
    const sStage = typeof sb.stage === 'string' && (STAGES as readonly string[]).includes(sb.stage) ? sb.stage : stageForStatus(startupStatus);
    startupsData.push({ name: sName, url: `https://${sDomain}`, domain: sDomain, tagline: sTagline, stage: sStage });
  }

  // Step obiettivo + prime task (opzionale: richiesto solo se l'utente ha startup)
  const goal = cleanStr(body.goal_title, 200);
  const rawTasks = Array.isArray(body.tasks) ? body.tasks : [];
  const taskTitles = rawTasks.filter((t): t is string => typeof t === 'string').map((t) => t.trim().slice(0, 200)).filter(Boolean).slice(0, 5);
  if (goal && taskTitles.length === 0) return NextResponse.json({ message: 'Aggiungi almeno una task iniziale' }, { status: 400 });
  if (!goal && taskTitles.length > 0) return NextResponse.json({ message: 'Definisci il primo obiettivo' }, { status: 400 });

  const { data: conflict } = await supabaseAdmin.from('profiles').select('id').eq('handle', handle).neq('id', authUser.id).maybeSingle();
  if (conflict) return NextResponse.json({ message: 'Handle già in uso' }, { status: 409 });

  const { data: profile, error } = await supabaseAdmin.from('profiles').update({
    name, handle, birth_date: birthDate, locality, bio, github_username: github || null,
    // `goals` = focus principale scelto; `startup_status` = dove sei con la startup.
    onboarding: { situation, skills, goals, startup_status: startupStatus || null },
    onboarding_completed: true,
    ...(avatarUrl ? { avatar_url: avatarUrl, avatar: avatarUrl } : {}),
  }).eq('id', authUser.id).select().maybeSingle();
  if (error) return NextResponse.json({ message: 'Errore salvataggio onboarding' }, { status: 500 });

  const created: { id: string }[] = [];
  for (const s of startupsData) {
    const { data: row, error: sErr } = await supabaseAdmin.from('startups').insert({
      user_id: authUser.id, name: s.name, domain: s.domain, url: s.url,
      tagline: s.tagline || null, logo_url: logoUrlFor(s.domain, null), stage: s.stage,
    }).select('id').single();
    if (!sErr && row) created.push(row);
  }
  if (startupsData.length > 0 && created.length === 0) {
    return NextResponse.json({ message: 'Profilo salvato, ma le startup non sono state create. Aggiungile dal portfolio.', profile }, { status: 207 });
  }

  // Obiettivo e task si agganciano alla prima startup creata.
  if (goal && created.length > 0) {
    await supabaseAdmin.from('goals').insert({ user_id: authUser.id, startup_id: created[0].id, title: goal });
    await supabaseAdmin.from('tasks').insert(taskTitles.map((title) => ({ user_id: authUser.id, startup_id: created[0].id, title })));
  }

  return NextResponse.json({ profile, startup_ids: created.map((c) => c.id) });
}
