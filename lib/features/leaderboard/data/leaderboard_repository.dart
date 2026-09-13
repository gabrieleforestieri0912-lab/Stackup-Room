import 'package:flutter/foundation.dart';

import '../../../core/supabase/supabase_client.dart';
import '../domain/leaderboard_entry.dart';

enum LeaderboardSort { mrr, streak, activity }

class LeaderboardRepository {
  /// Fetch via view `leaderboard` (RLS authenticated) + arricchimento streak mock.
  /// In Fase 5 diventa materialized view + streak derivata da daily_checkins.
  Future<List<LeaderboardEntry>> fetch({LeaderboardSort sort = LeaderboardSort.mrr}) async {
    final client = SupabaseService.clientOrNull;
    if (client == null) return _mock();
    try {
      final rows = await client.from('leaderboard').select();
      var list = (rows as List).map((r) => LeaderboardEntry.fromView(r as Map<String, dynamic>)).toList();
      // Arricchisci streak/delta mock (Fase 5: query daily_checkins)
      list = list.map((e) => e.withStreak(_mockStreak(e.userId), _mockDelta(e.userId))).toList();
      list.sort((a, b) {
        switch (sort) {
          case LeaderboardSort.mrr:
            return (b.latestRevenueCents ?? -1).compareTo(a.latestRevenueCents ?? -1);
          case LeaderboardSort.streak:
          case LeaderboardSort.activity:
            return b.streakDays.compareTo(a.streakDays);
        }
      });
      return list;
    } catch (e) {
      debugPrint('[Leaderboard] fetch errore (offline?): $e');
      return _mock();
    }
  }

  /// Proxy Stripe read-only via Edge Function — mai chiave client.
  Future<Map<String, dynamic>?> verifyStripe(String startupId) async {
    final client = SupabaseService.clientOrNull;
    if (client == null) return null;
    try {
      final res = await client.functions.invoke('stripe-verify', body: {'startup_id': startupId});
      if (res.status != 200) {
        debugPrint('[Leaderboard] stripe-verify status ${res.status}: ${res.data}');
        return null;
      }
      return res.data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('[Leaderboard] stripe-verify errore: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> fetchOptIn() async {
    final client = SupabaseService.clientOrNull;
    final uid = client?.auth.currentUser?.id;
    if (client == null || uid == null) return null;
    try {
      final row = await client.from('leaderboard_opt_in').select().eq('user_id', uid).maybeSingle();
      return row as Map<String, dynamic>?;
    } catch (_) {
      return null;
    }
  }

  Future<void> setOptIn({bool? showMrr, bool? showGithub, bool? showStreak}) async {
    final client = SupabaseService.clientOrNull;
    final uid = client?.auth.currentUser?.id;
    if (client == null || uid == null) return;
    final patch = <String, dynamic>{
      'user_id': uid,
      if (showMrr != null) 'show_mrr': showMrr,
      if (showGithub != null) 'show_github': showGithub,
      if (showStreak != null) 'show_streak': showStreak,
    };
    await client.from('leaderboard_opt_in').upsert(patch, onConflict: 'user_id');
  }

  // ---- Mock offline ----
  List<LeaderboardEntry> _mock() => [
        const LeaderboardEntry(userId: '1', displayName: 'Acme AI', startupName: 'Acme AI', latestRevenueCents: 1240000, currency: 'EUR', streakDays: 7, deltaCents: 12000),
        const LeaderboardEntry(userId: '2', displayName: 'Vertex', startupName: 'Vertex', latestRevenueCents: 810000, currency: 'EUR', streakDays: 5, deltaCents: -5000),
        const LeaderboardEntry(userId: 'me', displayName: 'Tu', startupName: 'Stackup Room', latestRevenueCents: null, streakDays: 1),
      ];

  int _mockStreak(String uid) => uid.hashCode % 7;
  int? _mockDelta(String uid) => (uid.hashCode % 3 == 0) ? 8000 : (uid.hashCode % 3 == 1 ? -3000 : null);
}
