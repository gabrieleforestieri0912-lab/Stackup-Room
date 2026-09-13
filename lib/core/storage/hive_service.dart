import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Cache locale minima offline-first (Hive).
///
/// Box: `stackup_room`
/// Keys storici (Giorno 1):
/// - `onboarding_done` (bool)
/// - `reminder_hour` (int, 0-23, default 9)
/// - `last_checkin_date` (String ISO date, es. "2026-09-11")
/// - `last_checkin_body` (String)
///
/// Keys aggiunti Giorno 2 — onboarding incrementale (sync ad ogni step):
/// - `onboarding_step` (int 0..3, ultimo step completato; 0 = non iniziato)
/// - `onboarding_display_name` (String?)
/// - `onboarding_startup_name` (String?)
/// - `onboarding_one_liner` (String?)
/// - `onboarding_avatar_local_path` (String? path locale temporaneo)
/// - `onboarding_avatar_url` (String? URL Supabase Storage)
/// - `onboarding_completed_at` (String? ISO8601)
class HiveService {
  HiveService._();

  static const String boxName = 'stackup_room';
  static late Box _box;
  static bool _initialized = false;

  /// True dopo [initialize] — usato dai servizi (es. outbox) per degradare a
  /// no-op nei test widget senza Hive inizializzato.
  static bool get isInitialized => _initialized;

  static Future<void> initialize() async {
    if (_initialized) return;
    await Hive.initFlutter();
    _box = await Hive.openBox(boxName);
    _initialized = true;
    debugPrint('[Hive] Box $boxName aperta (${_box.length} keys)');
  }

  static Box get box {
    if (!_initialized) throw StateError('HiveService non inizializzato');
    return _box;
  }

  // --- Legacy getters (Giorno 1 compat) ---

  // Safe getters: se Hive non è ancora inizializzato (es. test widget senza main),
  // ritornano default invece di lanciare. Evita crash in test / hot reload.
  static bool get onboardingDone => _initialized ? _box.get('onboarding_done', defaultValue: false) as bool : false;
  static Future<void> setOnboardingDone(bool v) async {
    if (!_initialized) return;
    await _box.put('onboarding_done', v);
  }

  static int get reminderHour => _initialized ? _box.get('reminder_hour', defaultValue: 9) as int : 9;
  static Future<void> setReminderHour(int h) async {
    if (!_initialized) return;
    await _box.put('reminder_hour', h.clamp(0, 23));
  }

  static String? get lastCheckinDate => _initialized ? _box.get('last_checkin_date') as String? : null;
  static String? get lastCheckinBody => _initialized ? _box.get('last_checkin_body') as String? : null;
  static Future<void> setLastCheckin({required String date, required String body}) async {
    if (!_initialized) return;
    await _box.put('last_checkin_date', date);
    await _box.put('last_checkin_body', body);
  }

  // --- Onboarding incrementale (Giorno 2) ---

  static int get onboardingStep => _initialized ? _box.get('onboarding_step', defaultValue: 0) as int : 0;
  static Future<void> setOnboardingStep(int step) async {
    if (!_initialized) return;
    await _box.put('onboarding_step', step.clamp(0, 3));
  }

  static String? get onboardingDisplayName => _initialized ? _box.get('onboarding_display_name') as String? : null;
  static Future<void> setOnboardingDisplayName(String? v) async {
    if (!_initialized) return;
    if (v == null) {
      await _box.delete('onboarding_display_name');
    } else {
      await _box.put('onboarding_display_name', v);
    }
  }

  static String? get onboardingStartupName => _initialized ? _box.get('onboarding_startup_name') as String? : null;
  static Future<void> setOnboardingStartupName(String? v) async {
    if (!_initialized) return;
    if (v == null) {
      await _box.delete('onboarding_startup_name');
    } else {
      await _box.put('onboarding_startup_name', v);
    }
  }

  static String? get onboardingOneLiner => _initialized ? _box.get('onboarding_one_liner') as String? : null;
  static Future<void> setOnboardingOneLiner(String? v) async {
    if (!_initialized) return;
    if (v == null) {
      await _box.delete('onboarding_one_liner');
    } else {
      await _box.put('onboarding_one_liner', v);
    }
  }

  static String? get onboardingAvatarLocalPath => _initialized ? _box.get('onboarding_avatar_local_path') as String? : null;
  static Future<void> setOnboardingAvatarLocalPath(String? v) async {
    if (!_initialized) return;
    if (v == null) {
      await _box.delete('onboarding_avatar_local_path');
    } else {
      await _box.put('onboarding_avatar_local_path', v);
    }
  }

  static String? get onboardingAvatarUrl => _initialized ? _box.get('onboarding_avatar_url') as String? : null;
  static Future<void> setOnboardingAvatarUrl(String? v) async {
    if (!_initialized) return;
    if (v == null) {
      await _box.delete('onboarding_avatar_url');
    } else {
      await _box.put('onboarding_avatar_url', v);
    }
  }

  static String? get onboardingCompletedAt => _initialized ? _box.get('onboarding_completed_at') as String? : null;
  static Future<void> setOnboardingCompletedAt(String? iso) async {
    if (!_initialized) return;
    if (iso == null) {
      await _box.delete('onboarding_completed_at');
    } else {
      await _box.put('onboarding_completed_at', iso);
    }
  }

  /// Salva incrementalmente lo step 1 (display_name + avatar).
  static Future<void> saveOnboardingStep1({
    required String displayName,
    String? avatarLocalPath,
    String? avatarUrl,
  }) async {
    await setOnboardingDisplayName(displayName);
    if (avatarLocalPath != null) await setOnboardingAvatarLocalPath(avatarLocalPath);
    if (avatarUrl != null) await setOnboardingAvatarUrl(avatarUrl);
    // Avanza a step 1 completato
    if (onboardingStep < 1) await setOnboardingStep(1);
  }

  /// Salva incrementalmente lo step 2 (startup_name + one_liner).
  static Future<void> saveOnboardingStep2({
    String? startupName,
    String? oneLiner,
  }) async {
    await setOnboardingStartupName(startupName);
    await setOnboardingOneLiner(oneLiner);
    if (onboardingStep < 2) await setOnboardingStep(2);
  }

  /// Salva incrementalmente lo step 3 (reminder_hour + completamento).
  static Future<void> saveOnboardingStep3({
    required int reminderHourValue,
    required String completedAtIso,
  }) async {
    await setReminderHour(reminderHourValue);
    await setOnboardingCompletedAt(completedAtIso);
    await setOnboardingDone(true);
    await setOnboardingStep(3);
  }

  /// Ripristina stato onboarding da Hive (per resume se app chiusa a metà).
  static Map<String, dynamic> getOnboardingCache() {
    if (!_initialized) {
      return {
        'step': 0,
        'display_name': null,
        'startup_name': null,
        'one_liner': null,
        'avatar_local_path': null,
        'avatar_url': null,
        'reminder_hour': 9,
        'completed_at': null,
        'done': false,
      };
    }
    return {
      'step': onboardingStep,
      'display_name': onboardingDisplayName,
      'startup_name': onboardingStartupName,
      'one_liner': onboardingOneLiner,
      'avatar_local_path': onboardingAvatarLocalPath,
      'avatar_url': onboardingAvatarUrl,
      'reminder_hour': reminderHour,
      'completed_at': onboardingCompletedAt,
      'done': onboardingDone,
    };
  }

  static Future<void> clearOnboardingCache() async {
    if (!_initialized) return;
    await _box.delete('onboarding_step');
    await _box.delete('onboarding_display_name');
    await _box.delete('onboarding_startup_name');
    await _box.delete('onboarding_one_liner');
    await _box.delete('onboarding_avatar_local_path');
    await _box.delete('onboarding_avatar_url');
    await _box.delete('onboarding_completed_at');
    await _box.delete('onboarding_done');
    await _box.delete('reminder_hour');
  }

  // Per test / debug
  static Future<void> clearAll() async => _box.clear();
}
