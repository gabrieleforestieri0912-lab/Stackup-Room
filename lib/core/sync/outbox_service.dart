import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/hive_service.dart';
import '../supabase/supabase_client.dart';

/// Coda offline-first (Fase 8): le mutazioni fatte senza rete finiscono in una
/// lista persistita su Hive, e vengono inviate a Supabase appena torna la
/// connessione.
///
/// Garanzie:
/// - **Idempotenza**: `tasks` usa `unique(user_id, client_id)` e `standups`
///   `unique(user_id, day)`; il flush fa upsert, quindi un retry non duplica.
/// - **Deduplica in coda**: due operazioni sullo stesso record si sovrascrivono
///   (vince l'ultima), così la coda non cresce a ogni toggle.
/// - **Ordine**: il flush è FIFO e si **ferma al primo errore**, lasciando le
///   operazioni residue in coda per il tentativo successivo.
class OutboxOpKind { static const upsertTask = 'upsert_task'; static const deleteTask = 'delete_task'; static const insertStandup = 'insert_standup'; }

class OutboxOp {
  const OutboxOp({required this.id, required this.kind, required this.payload, required this.createdAt});

  final String id;
  final String kind; // OutboxOpKind.*
  final Map<String, dynamic> payload;
  final DateTime createdAt;

  /// Chiave di deduplica: identifica il record remoto toccato dall'operazione.
  String get dedupeKey => switch (kind) {
        OutboxOpKind.upsertTask || OutboxOpKind.deleteTask => 'task:${payload['client_id']}',
        OutboxOpKind.insertStandup => 'standup:${payload['day']}',
        _ => 'op:$id',
      };

  Map<String, dynamic> toJson() => {'id': id, 'kind': kind, 'payload': payload, 'created_at': createdAt.toIso8601String()};

  factory OutboxOp.fromJson(Map<String, dynamic> j) => OutboxOp(
        id: j['id'] as String,
        kind: j['kind'] as String,
        payload: (j['payload'] as Map).cast<String, dynamic>(),
        createdAt: DateTime.tryParse(j['created_at'] as String? ?? '') ?? DateTime.now(),
      );
}

class OutboxResult {
  const OutboxResult({required this.sent, required this.pending, required this.offline});
  final int sent;
  final int pending;
  final bool offline;
}

class OutboxService {
  OutboxService._();

  static const String storageKey = 'outbox_v1';

  // --- Hook per i test: storage in memoria + sender finto, senza Hive/Supabase ---
  @visibleForTesting
  static String? Function()? debugReadStorage;
  @visibleForTesting
  static Future<void> Function(String raw)? debugWriteStorage;
  @visibleForTesting
  static Future<void> Function(OutboxOp op)? debugSend;

  static String _newId() => DateTime.now().microsecondsSinceEpoch.toString();

  // --- Storage ---

  static Future<String?> _readRaw() async {
    if (debugReadStorage != null) return debugReadStorage!();
    if (!HiveService.isInitialized) return null;
    return HiveService.box.get(storageKey) as String?;
  }

  static Future<void> _writeRaw(String raw) async {
    if (debugWriteStorage != null) {
      await debugWriteStorage!(raw);
      return;
    }
    if (!HiveService.isInitialized) return;
    await HiveService.box.put(storageKey, raw);
  }

  static Future<List<OutboxOp>> pending() async {
    final raw = await _readRaw();
    if (raw == null || raw.isEmpty) return [];
    try {
      return (jsonDecode(raw) as List).cast<Map<String, dynamic>>().map(OutboxOp.fromJson).toList();
    } catch (e) {
      debugPrint('[Outbox] decode errore (coda scartata): $e');
      return [];
    }
  }

  static Future<void> _save(List<OutboxOp> ops) async =>
      _writeRaw(jsonEncode(ops.map((o) => o.toJson()).toList()));

  static Future<int> pendingCount() async => (await pending()).length;

  /// Accoda un'operazione, sostituendo la precedente sullo stesso record.
  static Future<void> enqueue(OutboxOp op) async {
    final ops = await pending();
    ops.removeWhere((o) => o.dedupeKey == op.dedupeKey);
    ops.add(op);
    await _save(ops);
  }

  // --- API tipate ---

  static Future<void> queueTaskUpsert({required String clientId, required String title, String? project, required bool completed}) async {
    await enqueue(OutboxOp(
      id: _newId(),
      kind: OutboxOpKind.upsertTask,
      createdAt: DateTime.now(),
      payload: {
        'client_id': clientId,
        'title': title,
        'project': project,
        'completed': completed,
        'day': DateTime.now().toIso8601String().substring(0, 10),
      },
    ));
  }

  static Future<void> queueTaskDelete(String clientId) async {
    await enqueue(OutboxOp(id: _newId(), kind: OutboxOpKind.deleteTask, createdAt: DateTime.now(), payload: {'client_id': clientId}));
  }

  static Future<void> queueStandup({required String day, String? yesterday, String? today, String? blockers}) async {
    await enqueue(OutboxOp(
      id: _newId(),
      kind: OutboxOpKind.insertStandup,
      createdAt: DateTime.now(),
      payload: {'day': day, 'yesterday': yesterday, 'today': today, 'blockers': blockers},
    ));
  }

  // --- Flush ---

  /// Invia la coda a Supabase, in ordine. Ritorna l'esito.
  static Future<OutboxResult> flush() async {
    final ops = await pending();
    if (ops.isEmpty) return const OutboxResult(sent: 0, pending: 0, offline: false);

    final remaining = <OutboxOp>[];
    var sent = 0;
    var offline = false;

    for (var i = 0; i < ops.length; i++) {
      try {
        await _send(ops[i]);
        sent++;
      } catch (e) {
        debugPrint('[Outbox] flush interrotto su ${ops[i].kind}: $e');
        remaining.addAll(ops.sublist(i)); // ordine preservato per il retry
        offline = true;
        break;
      }
    }

    await _save(remaining);
    if (sent > 0 || offline) debugPrint('[Outbox] sent=$sent pending=${remaining.length}');
    return OutboxResult(sent: sent, pending: remaining.length, offline: offline);
  }

  static Future<void> _send(OutboxOp op) async {
    if (debugSend != null) return debugSend!(op);

    final client = SupabaseService.clientOrNull;
    final userId = client?.auth.currentUser?.id;
    if (client == null || userId == null) {
      // Nessuna sessione/rete: l'operazione resta in coda.
      throw const _OfflineException();
    }

    switch (op.kind) {
      case OutboxOpKind.upsertTask:
        await client.from('tasks').upsert({...op.payload, 'user_id': userId}, onConflict: 'user_id,client_id');
      case OutboxOpKind.deleteTask:
        await client.from('tasks').delete().eq('user_id', userId).eq('client_id', op.payload['client_id'] as String);
      case OutboxOpKind.insertStandup:
        await client.from('standups').upsert({...op.payload, 'user_id': userId}, onConflict: 'user_id,day');
      default:
        debugPrint('[Outbox] kind sconosciuto, scartato: ${op.kind}');
    }
  }
}

class _OfflineException implements Exception {
  const _OfflineException();
  @override
  String toString() => 'offline';
}

/// Numero di operazioni in attesa → mostrato in Settings (badge "da sincronizzare").
final outboxPendingProvider = FutureProvider<int>((ref) => OutboxService.pendingCount());
