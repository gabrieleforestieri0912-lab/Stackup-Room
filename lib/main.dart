import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/env/env.dart';
import 'core/monetization/purchases_service.dart';
import 'core/notifications/notification_service.dart';
import 'core/storage/hive_service.dart';
import 'core/supabase/supabase_client.dart';
import 'core/sync/outbox_service.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/onboarding/onboarding_provider.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/splash/splash_screen.dart';
import 'features/waitlist/waitlist_screen.dart';
import 'navigation/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    debugPrint('[Env] .env non trovato — uso --dart-define o modalità offline');
  }

  await HiveService.initialize();
  await SupabaseService.initialize();
  // RevenueCat: config base (nessun paywall ancora). Skippa se chiave assente.
  try {
    await PurchasesService.initialize(
      appUserId: SupabaseService.authOrNull?.currentUser?.id,
    );
  } catch (e) {
    debugPrint('[Purchases] init in main() errore (non bloccante): $e');
  }
  // Notifiche: init lazy, ma prepara timezone presto (non blocca avvio)
  try {
    await NotificationService.initialize();
  } catch (e) {
    debugPrint('[Notifications] init in main() errore (non bloccante): $e');
  }

  runApp(const ProviderScope(child: StackupApp()));
}

class StackupApp extends StatelessWidget {
  const StackupApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Stackup Room',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.dark,
      home: const AuthGate(),
    );
  }
}

/// Gate centrale che decide il routing in base a AuthNotifier:
/// - initial → Splash
/// - unauthenticated → LoginScreen
/// - authenticatedOnboardingRequired → OnboardingScreen (resume da Hive)
/// - authenticated → AppShell
class AuthGate extends ConsumerStatefulWidget {
  const AuthGate({super.key});

  @override
  ConsumerState<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends ConsumerState<AuthGate> with WidgetsBindingObserver {
  bool _splashMinDurationDone = false;
  String? _bootError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _boot();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Fase 8 — al ritorno in foreground ritenta la coda offline (Hive → Supabase).
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) unawaited(_flushOutbox());
  }

  Future<void> _flushOutbox() async {
    final res = await OutboxService.flush();
    if (res.sent > 0) debugPrint('[Sync] coda offline: ${res.sent} operazioni sincronizzate');
  }

  Future<void> _boot() async {
    try {
      await Future.delayed(const Duration(milliseconds: 800));
      // Retry della coda offline appena l'app è avviata (no-op se la coda è vuota).
      unawaited(_flushOutbox());
      if (!mounted) return;
      setState(() => _splashMinDurationDone = true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _bootError = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_bootError != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded, size: 48, color: Colors.redAccent),
                const SizedBox(height: 12),
                Text('Errore avvio: $_bootError', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => setState(() => _bootError = null),
                  child: const Text('Riprova'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final auth = ref.watch(authProvider);

    // Splash finché auth è in initial O finché non è passata la durata minima (evita flash)
    if (auth.status == AuthStatus.initial || !_splashMinDurationDone) {
      return const SplashScreen();
    }

    switch (auth.status) {
      case AuthStatus.unauthenticated:
        if (!Env.enablePublicSignup) return const WaitlistScreen();
        return const LoginScreen();
      case AuthStatus.authenticatedOnboardingRequired:
        // Pre-carica onboarding da profilo remoto (se disponibile)
        // Non blocca: Hive ha già cache, profile arricchisce
        WidgetsBinding.instance.addPostFrameCallback((_) {
          ref.read(onboardingProvider.notifier).loadFromProfile(auth.profile);
        });
        return OnboardingScreen(
          onProfileRefreshed: () {
            // Dopo completamento onboarding, ricarica profilo per passare a authenticated
            ref.read(authProvider.notifier).refreshProfile();
          },
        );
      case AuthStatus.authenticated:
        return const AppShell();
      case AuthStatus.initial:
        return const SplashScreen();
    }
  }
}
