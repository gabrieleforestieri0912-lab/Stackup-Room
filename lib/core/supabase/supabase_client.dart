// ignore_for_file: deprecated_member_use
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../env/env.dart';

/// Helper centralizzato per Supabase.
///
/// Inizializza il client una sola volta in [main] e espone accessor tipati.
class SupabaseService {
  SupabaseService._();

  static bool _initialized = false;
  static bool get isInitialized => _initialized;

  /// Inizializza Supabase. Chiamare in `main()` prima di `runApp`.
  /// Se le chiavi non sono configurate, skippa l'init e logga in debug
  /// (permette di avviare l'app in modalità offline/mock senza crash).
  static Future<void> initialize() async {
    if (_initialized) return;

    Env.assertNoServiceRole();

    if (!Env.isConfigured) {
      debugPrint(
        '[Supabase] Chiavi non configurate (SUPABASE_URL / ANON_KEY). '
        'App in modalità offline/mock. Configura .env o --dart-define.',
      );
      return;
    }

    await Supabase.initialize(
      url: Env.supabaseUrl,
      anonKey: Env.supabaseAnonKey,
    );
    _initialized = true;
    debugPrint('[Supabase] Inizializzato: ${Env.supabaseUrl}');
  }

  static SupabaseClient get client {
    if (!_initialized) {
      throw StateError(
        'Supabase non inizializzato. Chiama SupabaseService.initialize() in main().',
      );
    }
    return Supabase.instance.client;
  }

  /// Accesso safe che non lancia se non inizializzato (per UI offline).
  static SupabaseClient? get clientOrNull =>
      _initialized ? Supabase.instance.client : null;

  static GoTrueClient? get authOrNull => clientOrNull?.auth;
}
