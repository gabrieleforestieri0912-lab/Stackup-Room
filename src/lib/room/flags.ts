import { supabaseAdmin } from '@/lib/supabase-admin';

export async function requiresMembershipEnabled(): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin.from('feature_flags').select('enabled').eq('key', 'requiresMembership').maybeSingle();
    return data?.enabled === true;
  } catch {
    return false;
  }
}
