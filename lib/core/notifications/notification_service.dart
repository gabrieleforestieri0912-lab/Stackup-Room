import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timezone/data/latest_all.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

/// Servizio notifiche locali per promemoria check-in giornaliero.
///
/// Requisito Giorno 2 — Fase 3 Step 3:
/// - Richiede permesso notifiche (iOS/Android moderni).
/// - Se permesso negato, onboarding completa comunque (senza promemoria attivo).
/// - Usa timezone per schedulazione daily corretta.
class NotificationService {
  NotificationService._();

  static final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;
  static bool _tzInitialized = false;

  static bool get isInitialized => _initialized;

  static Future<void> initialize() async {
    if (_initialized) return;

    const androidInit = AndroidInitializationSettings('@mipmap/launcher_icon');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    const initSettings = InitializationSettings(android: androidInit, iOS: iosInit);

    await _plugin.initialize(initSettings);
    _initTimezone();
    _initialized = true;
    debugPrint('[Notifications] Inizializzato');
  }

  static void _initTimezone() {
    if (_tzInitialized) return;
    try {
      tz_data.initializeTimeZones();
      // Fallback a Europe/Rome se non rilevabile su device; su mobile poi si usa local.
      final local = DateTime.now().timeZoneName;
      debugPrint('[Notifications] Timezone local: $local');
      // Usa la timezone di sistema se disponibile, altrimenti UTC
      try {
        tz.setLocalLocation(tz.getLocation('Europe/Rome'));
      } catch (_) {
        tz.setLocalLocation(tz.UTC);
      }
      _tzInitialized = true;
    } catch (e) {
      debugPrint('[Notifications] Timezone init errore: $e');
    }
  }

  /// Richiede permesso notifiche. Ritorna true se concesso, false se negato.
  /// Non lancia mai — se negato, caller gestisce fallback (onboarding completa comunque).
  static Future<bool> requestPermission() async {
    try {
      final status = await Permission.notification.request();
      if (status.isGranted || status.isLimited) {
        debugPrint('[Notifications] Permesso concesso: $status');
        return true;
      }
      if (status.isPermanentlyDenied) {
        debugPrint('[Notifications] Permesso negato permanentemente — invito ad andare in impostazioni');
        return false;
      }
      debugPrint('[Notifications] Permesso negato: $status');
      return false;
    } catch (e) {
      debugPrint('[Notifications] Errore richiesta permesso: $e');
      return false;
    }
  }

  /// Controlla se il permesso è già concesso senza richiederlo (per UI).
  static Future<bool> hasPermission() async {
    try {
      final status = await Permission.notification.status;
      return status.isGranted || status.isLimited;
    } catch (_) {
      return false;
    }
  }

  /// Apre le impostazioni app per abilitare manualmente le notifiche.
  static Future<void> openSettings() async {
    try {
      await openAppSettings();
    } catch (e) {
      debugPrint('[Notifications] openAppSettings errore: $e');
    }
  }

  /// Schedula notifica giornaliera all'orario preferito (hour 0-23).
  static Future<bool> scheduleDailyReminder({required int hour}) async {
    try {
      if (!_initialized) await initialize();

      final hasPerm = await hasPermission();
      if (!hasPerm) {
        debugPrint('[Notifications] Skip schedulazione — permesso non concesso');
        return false;
      }

      await cancelDailyReminder();

      final now = tz.TZDateTime.now(tz.local);
      var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, 0);
      if (scheduled.isBefore(now)) {
        scheduled = scheduled.add(const Duration(days: 1));
      }

      const androidDetails = AndroidNotificationDetails(
        'daily_checkin',
        'Promemoria check-in',
        channelDescription: 'Ti ricorda ogni giorno di fare il check-in su Stackup Room',
        importance: Importance.high,
        priority: Priority.high,
        icon: '@mipmap/launcher_icon',
      );
      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );
      const details = NotificationDetails(android: androidDetails, iOS: iosDetails);

      await _plugin.zonedSchedule(
        1001, // id fisso per promemoria giornaliero
        'Stackup Room',
        'È il momento del tuo check-in giornaliero 🔥',
        scheduled,
        details,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        matchDateTimeComponents: DateTimeComponents.time, // ripete ogni giorno alla stessa ora
      );

      debugPrint('[Notifications] Promemoria schedulato alle $hour:00 (prossimo: $scheduled)');
      return true;
    } catch (e) {
      debugPrint('[Notifications] scheduleDailyReminder errore: $e');
      return false;
    }
  }

  static Future<void> cancelDailyReminder() async {
    try {
      await _plugin.cancel(1001);
      debugPrint('[Notifications] Promemoria cancellato');
    } catch (e) {
      debugPrint('[Notifications] cancel errore: $e');
    }
  }
}
