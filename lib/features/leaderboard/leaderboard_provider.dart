import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/supabase/supabase_client.dart';
import 'data/leaderboard_repository.dart';
import 'domain/leaderboard_entry.dart';

class LeaderboardState {
  const LeaderboardState({this.entries = const [], this.isLoading = false, this.error, this.sort = LeaderboardSort.mrr, this.optIn});
  final List<LeaderboardEntry> entries;
  final bool isLoading;
  final String? error;
  final LeaderboardSort sort;
  final Map<String, dynamic>? optIn;

  int get myRank {
    final uid = SupabaseService.clientOrNull?.auth.currentUser?.id;
    if (uid == null) return -1;
    final idx = entries.indexWhere((e) => e.userId == uid);
    return idx == -1 ? -1 : idx + 1;
  }

  LeaderboardEntry? get myEntry {
    final uid = SupabaseService.clientOrNull?.auth.currentUser?.id;
    if (uid == null) return null;
    try {
      return entries.firstWhere((e) => e.userId == uid);
    } catch (_) {
      return null;
    }
  }
}

class LeaderboardNotifier extends StateNotifier<LeaderboardState> {
  LeaderboardNotifier() : super(const LeaderboardState()) {
    refresh();
  }
  final _repo = LeaderboardRepository();

  Future<void> refresh() async {
    state = LeaderboardState(entries: state.entries, isLoading: true, sort: state.sort, optIn: state.optIn);
    try {
      final entries = await _repo.fetch(sort: state.sort);
      final optIn = await _repo.fetchOptIn();
      state = LeaderboardState(entries: entries, sort: state.sort, optIn: optIn);
    } catch (e) {
      state = LeaderboardState(entries: state.entries, error: e.toString(), sort: state.sort);
    }
  }

  Future<void> setSort(LeaderboardSort s) async {
    state = LeaderboardState(entries: state.entries, isLoading: true, sort: s, optIn: state.optIn);
    final entries = await _repo.fetch(sort: s);
    state = LeaderboardState(entries: entries, sort: s, optIn: state.optIn);
  }

  Future<bool> verifyStripe(String startupId) async {
    final res = await _repo.verifyStripe(startupId);
    if (res != null) await refresh();
    return res != null;
  }

  Future<void> setOptIn({bool? showMrr, bool? showGithub}) async {
    await _repo.setOptIn(showMrr: showMrr, showGithub: showGithub);
    final optIn = await _repo.fetchOptIn();
    state = LeaderboardState(entries: state.entries, sort: state.sort, optIn: optIn);
  }
}

final leaderboardProvider = StateNotifierProvider<LeaderboardNotifier, LeaderboardState>((ref) => LeaderboardNotifier());
