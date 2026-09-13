import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/startup_repository.dart';
import 'domain/startup.dart';

class StartupState {
  const StartupState({this.items = const [], this.isLoading = false, this.error, this.selectedId});
  final List<Startup> items;
  final bool isLoading;
  final String? error;
  final String? selectedId; // null = tutti, altrimenti filtra Today per singolo progetto
  List<Startup> get active => items.where((s) => !s.isArchived).toList();
  Startup? get selected => selectedId == null ? null : items.where((s) => s.id == selectedId).firstOrNull;
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}

class StartupNotifier extends StateNotifier<StartupState> {
  StartupNotifier() : super(const StartupState()) {
    _init();
  }
  final _repo = StartupRepository();

  Future<void> _init() async {
    final cached = await _repo.loadCache();
    state = StartupState(items: cached, selectedId: _repo.selectedId);
    await refresh();
  }

  Future<void> refresh() async {
    state = StartupState(items: state.items, isLoading: true, selectedId: state.selectedId);
    try {
      final remote = await _repo.fetchRemote();
      state = StartupState(items: remote, selectedId: _repo.selectedId);
    } catch (e) {
      state = StartupState(items: state.items, error: e.toString(), selectedId: state.selectedId);
    }
  }

  Future<Startup?> create({required String name, StartupStatus status = StartupStatus.idea, String? description, String? website}) async {
    state = StartupState(items: state.items, isLoading: true, selectedId: state.selectedId);
    try {
      final s = await _repo.create(name: name, status: status, description: description, website: website);
      final items = await _repo.loadCache();
      state = StartupState(items: items, selectedId: state.selectedId);
      return s;
    } catch (e) {
      state = StartupState(items: state.items, error: e.toString(), selectedId: state.selectedId);
      return null;
    }
  }

  Future<void> update(Startup s, {String? name, StartupStatus? status, String? description, String? website, String? notes}) async {
    await _repo.update(s, name: name, status: status, description: description, website: website, notes: notes);
    state = StartupState(items: await _repo.loadCache(), selectedId: state.selectedId);
  }

  Future<void> archive(String id) async {
    await _repo.archive(id, true);
    state = StartupState(items: await _repo.loadCache(), selectedId: state.selectedId == id ? null : state.selectedId);
  }

  Future<void> setSelected(String? id) async {
    await _repo.setSelectedId(id);
    state = StartupState(items: state.items, selectedId: id);
  }

  void clearError() => state = StartupState(items: state.items, selectedId: state.selectedId);
}

final startupProvider = StateNotifierProvider<StartupNotifier, StartupState>((ref) => StartupNotifier());
