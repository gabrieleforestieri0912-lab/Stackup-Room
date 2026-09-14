import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/analytics/analytics_service.dart';
import '../../core/storage/hive_service.dart';
import '../../core/supabase/supabase_client.dart';

/// Stato auth centralizzato — determina routing:
///
/// - non autenticato → auth flow (Login/Signup)
/// - autenticato ma onboarding incompleto (onboarding_completed_at == null) → onboarding wizard
/// - autenticato e onboarding completo → home (AppShell)

enum AuthStatus {
  initial, // verifica sessione in corso (splash)
  unauthenticated, // nessuna sessione
  authenticatedOnboardingRequired, // sessione OK, onboarding incompleto
  authenticated, // sessione + onboarding completo
}

class AppAuthState {
  const AppAuthState({
    required this.status,
    this.session,
    this.user,
    this.profile,
    this.error,
  });

  final AuthStatus status;
  final Session? session;
  final User? user;
  final Map<String, dynamic>? profile; // riga profiles
  final String? error;

  bool get isAuthenticated => status == AuthStatus.authenticated || status == AuthStatus.authenticatedOnboardingRequired;
  bool get needsOnboarding => status == AuthStatus.authenticatedOnboardingRequired;
  bool get isReady => status != AuthStatus.initial;

  AppAuthState copyWith({
    AuthStatus? status,
    Session? session,
    User? user,
    Map<String, dynamic>? profile,
    String? error,
  }) {
    return AppAuthState(
      status: status ?? this.status,
      session: session ?? this.session,
      user: user ?? this.user,
      profile: profile ?? this.profile,
      error: error,
    );
  }
}

/// Legge profilo da Supabase (o null se offline/non inizializzato).
Future<Map<String, dynamic>?> _fetchProfile(String userId) async {
  final client = SupabaseService.clientOrNull;
  if (client == null) return null;
  try {
    final row = await client.from('profiles').select().eq('id', userId).maybeSingle();
    return row;
  } catch (e) {
    debugPrint('[Auth] _fetchProfile errore: $e');
    return null;
  }
}

/// Determina AuthStatus da sessione + profilo (+ Hive fallback offline).
AuthStatus _resolveStatus(Session? session, Map<String, dynamic>? profile) {
  if (session == null) return AuthStatus.unauthenticated;
  // Se profilo non caricato (offline), usa Hive come fallback
  if (profile == null) {
    return HiveService.onboardingDone ? AuthStatus.authenticated : AuthStatus.authenticatedOnboardingRequired;
  }
  final completedAt = profile['onboarding_completed_at'];
  if (completedAt == null) return AuthStatus.authenticatedOnboardingRequired;
  return AuthStatus.authenticated;
}

class AuthNotifier extends StateNotifier<AppAuthState> {
  AuthNotifier() : super(const AppAuthState(status: AuthStatus.initial)) {
    _init();
  }

  StreamSubscription<dynamic>? _sub;

  Future<void> _init() async {
    final auth = SupabaseService.authOrNull;

    // Nessun Supabase configurato → resta unauthenticated (offline mode)
    if (auth == null) {
      state = const AppAuthState(status: AuthStatus.unauthenticated);
      return;
    }

    // Sessione esistente (se l'app è stata riaperta)
    final session = auth.currentSession;
    if (session != null) {
      final profile = await _fetchProfile(session.user.id);
      state = AppAuthState(
        status: _resolveStatus(session, profile),
        session: session,
        user: session.user,
        profile: profile,
      );
    } else {
      state = const AppAuthState(status: AuthStatus.unauthenticated);
    }

    // Ascolta cambi auth (login, logout, refresh)
    _sub = auth.onAuthStateChange.listen((data) async {
      final event = data.event;
      final s = data.session;
      debugPrint('[Auth] Event: $event, hasSession: ${s != null}');

      if (s == null) {
        state = const AppAuthState(status: AuthStatus.unauthenticated);
        return;
      }

      // Su SIGNED_IN / TOKEN_REFRESHED / INITIAL_SESSION → carica profilo
      final profile = await _fetchProfile(s.user.id);
      state = AppAuthState(
        status: _resolveStatus(s, profile),
        session: s,
        user: s.user,
        profile: profile,
      );
    });
  }

  /// Ricarica profilo (chiamato dopo aver completato uno step di onboarding).
  Future<void> refreshProfile() async {
    final auth = SupabaseService.authOrNull;
    final session = auth?.currentSession ?? state.session;
    if (session == null) return;
    final profile = await _fetchProfile(session.user.id);
    state = state.copyWith(
      status: _resolveStatus(session, profile),
      profile: profile,
      session: session,
      user: session.user,
    );
  }

  /// Traduce errori Supabase in messaggi chiari per l'utente.
  String _humanizeAuthError(Object e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('email already registered') || msg.contains('user already registered') || msg.contains('already exists')) {
      return 'Email già in uso. Prova ad accedere.';
    }
    if (msg.contains('invalid login credentials') || msg.contains('invalid credentials')) {
      return 'Email o password non corretti.';
    }
    if (msg.contains('password') && (msg.contains('weak') || msg.contains('short') || msg.contains('6 characters'))) {
      return 'Password troppo debole. Usa almeno 6 caratteri.';
    }
    if (msg.contains('email rate limit') || msg.contains('rate limit') || msg.contains('too many requests') || msg.contains('429')) {
      return 'Troppe richieste. Riprova tra qualche minuto.';
    }
    if (msg.contains('email not confirmed') || msg.contains('email not verified') || msg.contains('confirmation')) {
      return 'Email non confermata. Controlla la tua casella di posta.';
    }
    if (msg.contains('network') || msg.contains('socket') || msg.contains('failed host') || msg.contains('connection')) {
      return 'Errore di connessione. Verifica la rete e riprova.';
    }
    if (msg.contains('invalid email') || msg.contains('email address')) {
      return 'Indirizzo email non valido.';
    }
    // Fallback: estrai messaggio più pulito se è AuthException
    if (e is AuthException) return e.message;
    return 'Errore: ${e.toString().replaceAll('Exception:', '').trim()}';
  }

  Future<void> signUp({required String email, required String password}) async {
    final auth = SupabaseService.authOrNull;
    if (auth == null) throw StateError('Supabase non configurato');
    try {
      final res = await auth.signUp(email: email, password: password);
      // Se email confirmation richiesta, session è null — utente deve confermare via email
      if (res.session == null && res.user != null) {
        // Utente creato ma non ancora autenticato (conferma email richiesta)
        // Lo stato resta unauthenticated finché non conferma; mostriamo messaggio in UI
        state = state.copyWith(error: null);
        return;
      }
      // Se signup diretto con sessione, onAuthStateChange gestirà lo stato
      if (res.session != null) {
        final profile = await _fetchProfile(res.session!.user.id);
        state = AppAuthState(
          status: _resolveStatus(res.session, profile),
          session: res.session,
          user: res.session!.user,
          profile: profile,
        );
        // Analytics: signup completato (non bloccante)
        // ignore: discarded_futures
        AnalyticsService.track(AnalyticsService.signupCompleted, properties: {'method': 'email'});
      }
    } catch (e) {
      state = state.copyWith(error: _humanizeAuthError(e));
      throw StateError(_humanizeAuthError(e));
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    final auth = SupabaseService.authOrNull;
    if (auth == null) throw StateError('Supabase non configurato');
    try {
      final res = await auth.signInWithPassword(email: email, password: password);
      final profile = await _fetchProfile(res.session!.user.id);
      state = AppAuthState(
        status: _resolveStatus(res.session, profile),
        session: res.session,
        user: res.user,
        profile: profile,
      );
    } catch (e) {
      final msg = _humanizeAuthError(e);
      state = state.copyWith(error: msg);
      throw StateError(msg);
    }
  }

  /// Invia magic link (email OTP link). Fallback se utente non vuole password.
  Future<void> sendMagicLink({required String email}) async {
    final auth = SupabaseService.authOrNull;
    if (auth == null) throw StateError('Supabase non configurato');
    try {
      await auth.signInWithOtp(email: email);
    } catch (e) {
      throw StateError(_humanizeAuthError(e));
    }
  }

  Future<void> signOut() async {
    final auth = SupabaseService.authOrNull;
    if (auth == null) {
      state = const AppAuthState(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      await auth.signOut();
    } catch (e) {
      debugPrint('[Auth] signOut errore: $e');
    } finally {
      state = const AppAuthState(status: AuthStatus.unauthenticated);
    }
  }

  /// Aggiorna profilo su Supabase e Hive, poi refresh.
  Future<void> updateProfile(Map<String, dynamic> updates) async {
    final client = SupabaseService.clientOrNull;
    final userId = state.user?.id;
    if (client == null || userId == null) throw StateError('Non autenticato');
    try {
      await client.from('profiles').update(updates).eq('id', userId);
      await refreshProfile();
    } catch (e) {
      throw StateError(_humanizeAuthError(e));
    }
  }

  /// Marca onboarding completato (scrive onboarding_completed_at).
  Future<void> completeOnboarding() async {
    final nowIso = DateTime.now().toIso8601String();
    await updateProfile({'onboarding_completed_at': nowIso});
    // Aggiorna Hive cache
    await HiveService.saveOnboardingStep3(reminderHourValue: HiveService.reminderHour, completedAtIso: nowIso);
    // ignore: discarded_futures
    AnalyticsService.track(AnalyticsService.onboardingCompleted);
  }

  void clearError() {
    state = AppAuthState(
      status: state.status,
      session: state.session,
      user: state.user,
      profile: state.profile,
      error: null,
    );
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AppAuthState>((ref) {
  return AuthNotifier();
});

/// Provider legacy per compatibilità (deprecated, usa authProvider).
final authStateProvider = StreamProvider<AuthStateData>((ref) {
  final auth = SupabaseService.authOrNull;
  if (auth == null) return const Stream.empty();
  return auth.onAuthStateChange.map((data) => AuthStateData(data.event, data.session));
});

class AuthStateData {
  const AuthStateData(this.event, this.session);
  final AuthChangeEvent event;
  final Session? session;
}

final currentSessionProvider = Provider<Session?>((ref) {
  return SupabaseService.authOrNull?.currentSession;
});

final currentUserProvider = Provider<User?>((ref) {
  return SupabaseService.authOrNull?.currentUser;
});
