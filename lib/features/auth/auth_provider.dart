import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_client.dart';

/// Provider auth minimale per MVP (stub, logica completa Giorno 2).
/// Se Supabase non è configurato, resta null (offline).

final authStateProvider = StreamProvider<AuthState>((ref) {
  final auth = SupabaseService.authOrNull;
  if (auth == null) return const Stream.empty();
  return auth.onAuthStateChange;
});

final currentSessionProvider = Provider<Session?>((ref) {
  return SupabaseService.authOrNull?.currentSession;
});

final currentUserProvider = Provider<User?>((ref) {
  return SupabaseService.authOrNull?.currentUser;
});
