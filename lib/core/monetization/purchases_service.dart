import 'package:flutter/foundation.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../env/env.dart';

/// Bootstrap SDK RevenueCat (Fase 7).
///
/// - Nessun product ID / offering hardcoded: le offering (3/6/12 mesi) vivono
///   sulla dashboard RevenueCat e vengono lette da `Purchases.getOfferings()`.
/// - Se la chiave SDK non è configurata (o piattaforma non supportata, es.
///   Windows desktop o web) l'init è skippato: il paywall resta in modalità mock
///   così l'app è sempre avviabile in dev/test.
class PurchasesService {
  PurchasesService._();

  static bool _initialized = false;
  static bool get isInitialized => _initialized;

  /// Chiave SDK pubblica per la piattaforma corrente (vuota se non disponibile).
  static String get _apiKey {
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return Env.revenueCatAppleApiKey;
      case TargetPlatform.android:
        return Env.revenueCatGoogleApiKey;
      default:
        return '';
    }
  }

  /// Inizializza RevenueCat. Chiamare in `main()` prima di `runApp` (non bloccante).
  static Future<void> initialize({String? appUserId}) async {
    if (_initialized) return;

    // RevenueCat SDK supporta iOS/Android (e altri, ma non web/Windows desktop).
    if (kIsWeb || (defaultTargetPlatform != TargetPlatform.iOS && defaultTargetPlatform != TargetPlatform.android)) {
      debugPrint('[Purchases] piattaforma non supportata — paywall in modalità mock');
      return;
    }

    final apiKey = _apiKey;
    if (apiKey.isEmpty) {
      debugPrint('[Purchases] chiave RevenueCat non configurata — paywall in modalità mock');
      return;
    }

    try {
      if (kDebugMode) {
        await Purchases.setLogLevel(LogLevel.debug);
      }
      final config = PurchasesConfiguration(apiKey);
      if (appUserId != null && appUserId.isNotEmpty) {
        config.appUserID = appUserId;
      }
      await Purchases.configure(config);
      _initialized = true;
      debugPrint('[Purchases] inizializzato${appUserId == null ? '' : ' (user: ${appUserId.substring(0, 8)}…)'}');
    } catch (e) {
      debugPrint('[Purchases] init errore: $e — paywall in modalità mock');
    }
  }

  /// Allinea l'utente RevenueCat all'utente Supabase (chiamato al primo avvio
  /// del paywall state e dopo il login). No-op se SDK non inizializzato.
  static Future<CustomerInfo?> syncUser(String? userId) async {
    if (!_initialized) return null;
    try {
      if (userId == null || userId.isEmpty) {
        return await Purchases.logOut();
      }
      final result = await Purchases.logIn(userId);
      return result.customerInfo;
    } catch (e) {
      debugPrint('[Purchases] syncUser errore: $e');
      return null;
    }
  }
}
