import 'dart:convert';

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

// ------------------------------------------------------------------
// Today — Task model + provider (Hive offline-first, Fase 2)
// ------------------------------------------------------------------

class TodayTask {
  const TodayTask({
    required this.id,
    required this.title,
    this.project,
    this.completed = false,
  });

  final String id;
  final String title;
  final String? project;
  final bool completed;

  TodayTask copyWith({bool? completed, String? title}) => TodayTask(
        id: id,
        title: title ?? this.title,
        project: project,
        completed: completed ?? this.completed,
      );

  Map<String, dynamic> toJson() => {'id': id, 'title': title, 'project': project, 'completed': completed};
  factory TodayTask.fromJson(Map<String, dynamic> j) => TodayTask(id: j['id'] as String, title: j['title'] as String, project: j['project'] as String?, completed: j['completed'] as bool? ?? false);
}

class TodayState {
  const TodayState({this.tasks = const [], this.showCompleted = true});
  final List<TodayTask> tasks;
  final bool showCompleted;
  List<TodayTask> get pending => tasks.where((t) => !t.completed).toList();
  List<TodayTask> get done => tasks.where((t) => t.completed).toList();
}

class TodayNotifier extends StateNotifier<TodayState> {
  TodayNotifier() : super(const TodayState()) {
    _load();
  }

  static const _kTasks = 'today_tasks_v2';

  void _load() {
    final raw = HiveService.box.get(_kTasks) as String?;
    if (raw == null) return;
    try {
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      state = TodayState(tasks: list.map(TodayTask.fromJson).toList());
    } catch (_) {}
  }

  Future<void> _persist() async {
    final raw = jsonEncode(state.tasks.map((t) => t.toJson()).toList());
    await HiveService.box.put(_kTasks, raw);
  }

  Future<void> addTask(String title, {String? project}) async {
    final t = TodayTask(id: DateTime.now().microsecondsSinceEpoch.toString(), title: title.trim(), project: project);
    if (t.title.isEmpty) return;
    state = TodayState(tasks: [...state.tasks, t]);
    await _persist();
  }

  Future<void> toggle(String id) async {
    state = TodayState(tasks: state.tasks.map((t) => t.id == id ? t.copyWith(completed: !t.completed) : t).toList());
    await _persist();
  }

  Future<void> remove(String id) async {
    state = TodayState(tasks: state.tasks.where((t) => t.id != id).toList());
    await _persist();
  }
}

final todayProvider = StateNotifierProvider<TodayNotifier, TodayState>((ref) => TodayNotifier());

// ------------------------------------------------------------------
// Schedule — time-blocking (Fase 2)
// ------------------------------------------------------------------

class ScheduleBlock {
  const ScheduleBlock({required this.id, required this.hour, required this.title});
  final String id;
  final int hour; // 0-23
  final String title;
  ScheduleBlock copyWith({int? hour, String? title}) => ScheduleBlock(id: id, hour: hour ?? this.hour, title: title ?? this.title);
  Map<String, dynamic> toJson() => {'id': id, 'hour': hour, 'title': title};
  factory ScheduleBlock.fromJson(Map<String, dynamic> j) => ScheduleBlock(id: j['id'] as String, hour: j['hour'] as int, title: j['title'] as String);
}

class ScheduleState {
  const ScheduleState({this.blocks = const []});
  final List<ScheduleBlock> blocks;
}

class ScheduleNotifier extends StateNotifier<ScheduleState> {
  ScheduleNotifier() : super(const ScheduleState()) {
    _load();
  }
  static const _k = 'today_schedule_v2';
  void _load() {
    final raw = HiveService.box.get(_k) as String?;
    if (raw == null) {
      // Seed 3 blocchi di esempio se vuoto
      state = const ScheduleState(blocks: [
        ScheduleBlock(id: '1', hour: 9, title: 'Deep work — prodotto'),
        ScheduleBlock(id: '2', hour: 14, title: 'Call / feedback'),
        ScheduleBlock(id: '3', hour: 16, title: 'Shipping / check-in'),
      ]);
      return;
    }
    try {
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      state = ScheduleState(blocks: list.map(ScheduleBlock.fromJson).toList());
    } catch (_) {}
  }

  Future<void> _persist() async => HiveService.box.put(_k, jsonEncode(state.blocks.map((b) => b.toJson()).toList()));

  Future<void> move(String id, int newHour) async {
    state = ScheduleState(blocks: state.blocks.map((b) => b.id == id ? b.copyWith(hour: newHour.clamp(0, 23)) : b).toList()..sort((a, b) => a.hour.compareTo(b.hour)));
    await _persist();
  }

  Future<void> add(int hour, String title) async {
    final b = ScheduleBlock(id: DateTime.now().microsecondsSinceEpoch.toString(), hour: hour.clamp(0, 23), title: title);
    state = ScheduleState(blocks: [...state.blocks, b]..sort((a, b) => a.hour.compareTo(b.hour)));
    await _persist();
  }

  Future<void> remove(String id) async {
    state = ScheduleState(blocks: state.blocks.where((b) => b.id != id).toList());
    await _persist();
  }
}

final scheduleProvider = StateNotifierProvider<ScheduleNotifier, ScheduleState>((ref) => ScheduleNotifier());

// ------------------------------------------------------------------
// Streak — derivato da check-in (mock locale, Fase 5 diventa server)
// ------------------------------------------------------------------

final streakProvider = StateProvider<int>((ref) {
  final lastDate = ref.watch(checkinProvider).lastDate;
  if (lastDate == null) return 0;
  // MVP: se ultimo check-in è oggi → streak 1, altrimenti 0 (logica server in Fase 5)
  final today = DateTime.now().toIso8601String().substring(0, 10);
  return lastDate == today ? 1 : 0;
});
