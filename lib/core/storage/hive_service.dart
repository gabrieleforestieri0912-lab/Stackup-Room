import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Cache locale minima offline-first (Hive).
///
/// Box: `stackup_room`
/// Keys:
/// - `onboarding_done` (bool)
/// - `reminder_hour` (int, 0-23, default 9)
/// - `last_checkin_date` (String ISO date, es. "2026-09-11")
/// - `last_checkin_body` (String)
class HiveService {
  HiveService._();

  static const String boxName = 'stackup_room';
  static late Box _box;
  static bool _initialized = false;

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

  // --- Getters / Setters tipati ---

  static bool get onboardingDone => _box.get('onboarding_done', defaultValue: false) as bool;
  static Future<void> setOnboardingDone(bool v) => _box.put('onboarding_done', v);

  static int get reminderHour => _box.get('reminder_hour', defaultValue: 9) as int;
  static Future<void> setReminderHour(int h) => _box.put('reminder_hour', h.clamp(0, 23));

  static String? get lastCheckinDate => _box.get('last_checkin_date') as String?;
  static String? get lastCheckinBody => _box.get('last_checkin_body') as String?;
  static Future<void> setLastCheckin({required String date, required String body}) async {
    await _box.put('last_checkin_date', date);
    await _box.put('last_checkin_body', body);
  }
}
