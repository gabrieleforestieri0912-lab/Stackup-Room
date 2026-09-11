import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/storage/hive_service.dart';
import 'core/supabase/supabase_client.dart';
import 'core/theme/app_theme.dart';
import 'features/splash/splash_screen.dart';
import 'navigation/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // .env opzionale — app gira anche senza (modalità offline/mock)
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    debugPrint('[Env] .env non trovato — uso --dart-define o modalità offline');
  }

  await HiveService.initialize();
  await SupabaseService.initialize();

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
      themeMode: ThemeMode.dark, // club esclusivo = dark default (Fase 3)
      home: const _Root(),
    );
  }
}

/// Root con splash breve poi shell. Gestisce errore init senza crash.
class _Root extends StatefulWidget {
  const _Root();

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  bool _ready = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    try {
      // Simula init asincrono (Hive/Supabase già fatti in main, ma lascia splash visibile)
      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted) return;
      setState(() => _ready = true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline_rounded, size: 48, color: Colors.redAccent),
                const SizedBox(height: 12),
                Text('Errore avvio: $_error', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(onPressed: () => setState(() => _error = null), child: const Text('Riprova')),
              ],
            ),
          ),
        ),
      );
    }
    if (!_ready) return const SplashScreen();
    return const AppShell();
  }
}
