import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Client con la anon key, per le chiamate pubbliche di auth (es. `verifyOtp`).
 *
 * Da usare al posto di `supabaseAdmin.auth.verifyOtp`: l'endpoint /auth/v1/verify
 * autentica l'utente tramite il token OTP, e un JWT di servizio non è un
 * profilo utente valido per quel flusso.
 */
export const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export async function getAuthUser(token: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function updateStreak(userId: string) {
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('study_streak, last_active_date')
    .eq('id', userId)
    .single();
  if (fetchError || !profile) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = profile.last_active_date
    ? new Date(profile.last_active_date)
    : null;

  let newStreak = profile.study_streak || 0;

  if (!lastActive) {
    newStreak = 1;
  } else {
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) newStreak += 1;
    else if (diffDays > 1) newStreak = 1;
  }

  await supabaseAdmin
    .from('profiles')
    .update({ study_streak: newStreak, last_active_date: new Date().toISOString() })
    .eq('id', userId);
}
