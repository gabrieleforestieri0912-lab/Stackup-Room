import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Config sicura per chiavi Supabase.
///
/// - `SUPABASE_URL` e `SUPABASE_ANON_KEY` sono safe lato client per design Supabase.
/// - `SUPABASE_SERVICE_ROLE` non deve MAI essere inclusa nel bundle mobile.
///   Se presente in .env viene ignorata con assertion in debug.
///
/// Priorità: --dart-define > .env
class Env {
  Env._();

  static String get supabaseUrl {
    const fromDefine = String.fromEnvironment('SUPABASE_URL');
    if (fromDefine.isNotEmpty) return fromDefine;
    return dotenv.maybeGet('SUPABASE_URL') ?? '';
  }

  static String get supabaseAnonKey {
    const fromDefine = String.fromEnvironment('SUPABASE_ANON_KEY');
    if (fromDefine.isNotEmpty) return fromDefine;
    return dotenv.maybeGet('SUPABASE_ANON_KEY') ?? '';
  }

  static bool get isConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  // --- RevenueCat (Fase 7) ---
  // Chiavi pubbliche SDK (safe lato client per design RevenueCat).
  // Priorità: chiave platform-specifica > chiave generica. Mai product ID qui:
  // le offering 3/6/12 mesi sono configurate sulla dashboard RevenueCat.
  static String get revenueCatAppleApiKey {
    const define = String.fromEnvironment('REVENUECAT_APPLE_API_KEY');
    if (define.isNotEmpty) return define;
    return _dotenvOrGeneric('REVENUECAT_APPLE_API_KEY');
  }

  static String get revenueCatGoogleApiKey {
    const define = String.fromEnvironment('REVENUECAT_GOOGLE_API_KEY');
    if (define.isNotEmpty) return define;
    return _dotenvOrGeneric('REVENUECAT_GOOGLE_API_KEY');
  }

  static String _dotenvOrGeneric(String platformKey) {
    final platform = dotenv.maybeGet(platformKey);
    if (platform != null && platform.isNotEmpty) return platform;
    const generic = String.fromEnvironment('REVENUECAT_API_KEY');
    if (generic.isNotEmpty) return generic;
    return dotenv.maybeGet('REVENUECAT_API_KEY') ?? '';
  }

  // --- Launch gating (Giorno 5 Fase 1) ---
  // Se false, l'app mostra schermata waitlist invece del signup normale.
  // Default true = lancio pubblico immediato (coerente con docs/scope.md che non prevede beta).
  // Per attivare waitlist: --dart-define=ENABLE_PUBLIC_SIGNUP=false (o .env)
  static bool get enablePublicSignup {
    const fromDefine = String.fromEnvironment('ENABLE_PUBLIC_SIGNUP');
    if (fromDefine.isNotEmpty) return fromDefine.toLowerCase() != 'false' && fromDefine != '0';
    final fromEnv = dotenv.maybeGet('ENABLE_PUBLIC_SIGNUP');
    if (fromEnv != null && fromEnv.isNotEmpty) return fromEnv.toLowerCase() != 'false' && fromEnv != '0';
    return true;
  }

  static void assertNoServiceRole() {
    final hasServiceRole = dotenv.maybeGet('SUPABASE_SERVICE_ROLE_KEY') != null ||
        const String.fromEnvironment('SUPABASE_SERVICE_ROLE_KEY').isNotEmpty;
    assert(
      !hasServiceRole,
      'SUPABASE_SERVICE_ROLE_KEY non deve mai essere nel bundle mobile. '
      'Rimuovila da .env / --dart-define.',
    );
  }
}
