import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/storage/hive_service.dart';

/// Stato Hive del check-in (offline-first minima).
class CheckinState {
  const CheckinState({
    required this.onboardingDone,
    required this.reminderHour,
    this.lastDate,
    this.lastBody,
  });

  final bool onboardingDone;
  final int reminderHour;
  final String? lastDate;
  final String? lastBody;
}

class CheckinNotifier extends StateNotifier<CheckinState> {
  CheckinNotifier()
      : super(CheckinState(
          onboardingDone: HiveService.box.get('onboarding_done', defaultValue: false) as bool,
          reminderHour: HiveService.box.get('reminder_hour', defaultValue: 9) as int,
          lastDate: HiveService.box.get('last_checkin_date') as String?,
          lastBody: HiveService.box.get('last_checkin_body') as String?,
        ));

  Future<void> setLastCheckin(String date, String body) async {
    await HiveService.setLastCheckin(date: date, body: body);
    state = CheckinState(
      onboardingDone: state.onboardingDone,
      reminderHour: state.reminderHour,
      lastDate: date,
      lastBody: body,
    );
  }

  Future<void> setOnboardingDone(bool v) async {
    await HiveService.setOnboardingDone(v);
    state = CheckinState(
      onboardingDone: v,
      reminderHour: state.reminderHour,
      lastDate: state.lastDate,
      lastBody: state.lastBody,
    );
  }
}

final checkinProvider = StateNotifierProvider<CheckinNotifier, CheckinState>((ref) {
  return CheckinNotifier();
});
