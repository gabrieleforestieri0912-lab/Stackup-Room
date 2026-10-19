import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';

/// Stato condiviso della Room: profilo, startup e streak.
class RoomState extends ChangeNotifier {
  RoomState(this.api);

  final ApiClient api;

  List<Startup> startups = [];
  String? startupId;
  Map<String, dynamic> profile = {};
  Streak streak = Streak();
  bool loading = false;
  String? error;

  Startup? get activeStartup {
    for (final s in startups) {
      if (s.id == startupId) return s;
    }
    return startups.isEmpty ? null : startups.first;
  }

  String get displayName {
    final n = profile['name']?.toString().trim() ?? '';
    if (n.isNotEmpty) return n;
    return 'Founder';
  }

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final s = await api.get('/api/room/startups');
      startups = (s['startups'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(Startup.fromJson)
          .toList();
      if (startupId == null || !startups.any((x) => x.id == startupId)) {
        startupId = startups.isEmpty ? null : startups.first.id;
      }
      final p = await api.get('/api/room/profile');
      profile = (p['profile'] as Map<String, dynamic>?) ?? {};
      await refreshStreak();
    } catch (e) {
      error = e.toString();
    }
    loading = false;
    notifyListeners();
  }

  void selectStartup(String? id) {
    startupId = id;
    notifyListeners();
  }

  Future<void> refreshStreak() async {
    try {
      final s = await api.get('/api/room/streak');
      streak = Streak.fromJson(s);
      notifyListeners();
    } catch (_) {
      // streak non critico
    }
  }

  Future<void> markShipped() async {
    await api.post('/api/room/streak', {'startup_id': startupId});
    await refreshStreak();
  }

  Future<void> saveProfile(Map<String, dynamic> patch) async {
    final j = await api.patch('/api/room/profile', patch);
    profile = (j['profile'] as Map<String, dynamic>?) ?? {...profile, ...patch};
    notifyListeners();
  }
}
