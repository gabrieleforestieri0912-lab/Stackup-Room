import { supabaseAdmin } from '@/lib/supabase-admin';

// Feature flag del gate "solo membri" (community riservata a chi ha un handle).
//
// FAIL-CLOSED: se il flag non può essere letto si assume il valore restrittivo
// (true). Il contrario — un errore di rete che apre la community a tutti —
// è il modo peggiore di fallire per un controllo di accesso.

export async function requiresMembershipEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'requiresMembership')
      .maybeSingle();
    if (error) throw error;
    // Riga assente = flag non configurato = comportamento restrittivo.
    return data ? data.enabled === true : true;
  } catch (err) {
    console.error('[flags] lettura requiresMembership fallita, assumo restrittivo:', err instanceof Error ? err.message : err);
    return true;
  }
}
