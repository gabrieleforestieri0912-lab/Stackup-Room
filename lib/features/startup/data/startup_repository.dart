// ignore_for_file: use_null_aware_elements, unnecessary_cast

import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../../core/storage/hive_service.dart';
import '../../../core/supabase/supabase_client.dart';
import '../domain/startup.dart';

/// Repository offline-first: Hive cache immediata + sync Supabase se disponibile.
/// Chiavi Hive: `startups_cache` (json list), `startups_selected_id` (filtro Today)
class StartupRepository {
  static const _kCache = 'startups_cache_v1';
  static const _kSelected = 'startups_selected_id';

  Future<List<Startup>> loadCache() async {
    final raw = HiveService.box.get(_kCache) as String?;
    if (raw == null) return [];
    try {
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      return list.map((j) => Startup.fromJson(_fromHiveJson(j))).toList();
    } catch (e) {
      debugPrint('[Startups] cache decode errore: $e');
      return [];
    }
  }

  Map<String, dynamic> _fromHiveJson(Map<String, dynamic> j) => j;

  Future<void> saveCache(List<Startup> items) async {
    final raw = jsonEncode(items.map((s) => {
          'id': s.id,
          'owner_id': s.ownerId,
          'name': s.name,
          'status': s.status.dbValue,
          'description': s.description,
          'website': s.website,
          'notes': s.notes,
          'mrr_cents': s.mrrCents,
          'is_archived': s.isArchived,
          'is_public': s.isPublic,
          'created_at': s.createdAt.toIso8601String(),
          'updated_at': s.updatedAt.toIso8601String(),
        }).toList());
    await HiveService.box.put(_kCache, raw);
  }

  String? get selectedId => HiveService.box.get(_kSelected) as String?;
  Future<void> setSelectedId(String? id) async {
    if (id == null) {
      await HiveService.box.delete(_kSelected);
    } else {
      await HiveService.box.put(_kSelected, id);
    }
  }

  Future<List<Startup>> fetchRemote() async {
    final client = SupabaseService.clientOrNull;
    if (client == null) return loadCache();
    try {
      final rows = await client.from('startups').select().eq('is_archived', false).order('updated_at', ascending: false);
      final list = (rows as List).map((r) => Startup.fromJson(r as Map<String, dynamic>)).toList();
      await saveCache(list);
      return list;
    } catch (e) {
      debugPrint('[Startups] fetchRemote errore (offline?): $e');
      return loadCache();
    }
  }

  Future<Startup?> create({required String name, StartupStatus status = StartupStatus.idea, String? description, String? website}) async {
    final client = SupabaseService.clientOrNull;
    final userId = client?.auth.currentUser?.id;
    if (name.trim().length < 2) throw ArgumentError('Nome minimo 2 caratteri');
    if (description != null && description.length > 280) throw ArgumentError('Descrizione max 280');
    if (client != null && userId != null) {
      try {
        final row = await client.from('startups').insert({'owner_id': userId, 'name': name.trim(), 'status': status.dbValue, if (description != null) 'description': description, if (website != null) 'website': website}).select().single();
        final s = Startup.fromJson(row as Map<String, dynamic>);
        final cur = await loadCache();
        await saveCache([s, ...cur]);
        return s;
      } catch (e) {
        debugPrint('[Startups] create remote errore: $e — fallback cache locale');
      }
    }
    // Fallback offline: id temporaneo locale (prefisso local_)
    final now = DateTime.now();
    final local = Startup(id: 'local_${now.microsecondsSinceEpoch}', ownerId: userId ?? 'local', name: name.trim(), status: status, description: description, website: website, createdAt: now, updatedAt: now);
    final cur = await loadCache();
    await saveCache([local, ...cur]);
    return local;
  }

  Future<Startup?> update(Startup s, {String? name, StartupStatus? status, String? description, String? website, String? notes, bool? isPublic}) async {
    final client = SupabaseService.clientOrNull;
    final patch = <String, dynamic>{
      if (name != null) 'name': name.trim(),
      if (status != null) 'status': status.dbValue,
      if (description != null) 'description': description,
      if (website != null) 'website': website,
      if (notes != null) 'notes': notes,
      if (isPublic != null) 'is_public': isPublic,
    };
    if (client != null && !s.id.startsWith('local_')) {
      try {
        final row = await client.from('startups').update(patch).eq('id', s.id).select().single();
        final updated = Startup.fromJson(row as Map<String, dynamic>);
        final cur = await loadCache();
        await saveCache(cur.map((e) => e.id == s.id ? updated : e).toList());
        return updated;
      } catch (e) {
        debugPrint('[Startups] update remote errore: $e');
      }
    }
    final cur = await loadCache();
    final updated = s.copyWith(name: name, status: status, description: description, website: website, notes: notes, isPublic: isPublic);
    await saveCache(cur.map((e) => e.id == s.id ? updated : e).toList());
    return updated;
  }

  /// Fase 7 — toggle portfolio pubblico (opt-in per progetto).
  Future<void> setVisibility(String id, bool isPublic) async {
    final cur = await loadCache();
    final matches = cur.where((e) => e.id == id);
    if (matches.isEmpty) return;
    await update(matches.first, isPublic: isPublic);
  }

  Future<void> archive(String id, bool archived) async {
    final client = SupabaseService.clientOrNull;
    if (client != null && !id.startsWith('local_')) {
      try {
        await client.from('startups').update({'is_archived': archived}).eq('id', id);
      } catch (e) {
        debugPrint('[Startups] archive remote errore: $e');
      }
    }
    final cur = await loadCache();
    // Se archiviato, rimuovi da cache visibile (mantieni solo non-archiviati in cache principale)
    if (archived) {
      await saveCache(cur.where((e) => e.id != id).toList());
      // Se era selezionato, deseleziona
      if (selectedId == id) await setSelectedId(null);
    } else {
      await saveCache(cur.map((e) => e.id == id ? e.copyWith(isArchived: archived) : e).toList());
    }
  }
}
