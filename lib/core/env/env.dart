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
