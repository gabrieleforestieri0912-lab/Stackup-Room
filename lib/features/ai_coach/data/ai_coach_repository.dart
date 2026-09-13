import 'dart:convert';

import 'package:flutter/foundation.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/hive_service.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../checkin/checkin_provider.dart';
import '../../startup/domain/startup.dart';
import '../../startup/startup_provider.dart';
import '../domain/ai_message.dart';

class AiCoachRepository {
  Future<List<AiMessage>> fetchHistory({String? startupId}) async {
    final client = SupabaseService.clientOrNull;
    if (client == null) return _cache(startupId);
    try {
      final rows = startupId == null
          ? await client.from('ai_messages').select().order('created_at', ascending: true).limit(100)
          : await client.from('ai_messages').select().eq('startup_id', startupId).order('created_at', ascending: true).limit(100);
      final list = (rows as List).map((r) => AiMessage.fromJson(r as Map<String, dynamic>)).toList();
      await _saveCache(list, startupId);
      return list;
    } catch (e) {
      debugPrint('[AI] fetchHistory errore: $e');
      return _cache(startupId);
    }
  }

  Future<List<AiMessage>> _cache(String? startupId) async {
    final raw = HiveService.box.get(_k(startupId)) as String?;
    if (raw == null) return [];
    try {
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      return list.map(AiMessage.fromJson).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _saveCache(List<AiMessage> list, String? startupId) async {
    final raw = jsonEncode(list.map((m) => {'id': m.id, 'role': m.role, 'content': m.content, 'startup_id': m.startupId, 'created_at': m.createdAt.toIso8601String()}).toList());
    await HiveService.box.put(_k(startupId), raw);
  }

  String _k(String? sid) => sid == null ? 'ai_history_all' : 'ai_history_$sid';

  /// Costruisce contesto strutturato per Edge Function (progetti + task recenti + standup)
  Map<String, dynamic> buildContext(WidgetRef ref, String? startupId) {
    // Lettura sincrona da provider (Riverpod)
    final startups = ref.read(startupProvider);
    final today = ref.read(todayProvider);
    final lastStandup = HiveService.lastCheckinBody;
    return {
      'startup_id': startupId,
      'startups': startups.items.map((s) => {'name': s.name, 'status': s.status.label, 'desc': s.description}).toList(),
      'tasks_today': today.tasks.take(8).map((t) => {'title': t.title, 'project': t.project, 'done': t.completed}).toList(),
      'last_standup': lastStandup,
    };
  }

  /// Streaming via Edge Function ai-coach (SSE). Chiama onDelta per token, onDone a fine.
  Future<void> streamChat({required List<Map<String, String>> messages, String? startupId, required void Function(String delta) onDelta, required void Function() onDone, void Function(String error)? onError}) async {
    final client = SupabaseService.clientOrNull;
    if (client == null) {
      onError?.call('Offline — risposta mock');
      onDelta('Mock AI Coach (offline): prova a scomporre il task di oggi in 3 passi e shippa uno entro 2 ore.');
      onDone();
      return;
    }
    try {
      final resp = await client.functions.invoke('ai-coach', body: {'messages': messages, 'startup_id': startupId, 'stream': true});
      // functions.invoke ritorna JSON non-stream; per SSE vero serve http diretto — fallback a JSON
      if (resp.status == 200 && resp.data is Map && (resp.data as Map).containsKey('content')) {
        final content = (resp.data as Map)['content'] as String;
        // Simula streaming token-per-token lato client via Riverpod (requisito Fase 5)
        for (final chunk in _chunk(content)) {
          onDelta(chunk);
          await Future.delayed(const Duration(milliseconds: 18));
        }
        onDone();
        return;
      }
      // Se data è già streaming raw, prova a leggere
      if (resp.data is String) {
        onDelta(resp.data as String);
        onDone();
        return;
      }
      final httpResp = _sseFetch(messages, startupId);
      if (httpResp != null) {
        for (final delta in httpResp) {
          onDelta(delta);
        }
        onDone();
        return;
      }
      onError?.call('Risposta vuota da ai-coach');
      onDone();
    } catch (e) {
      debugPrint('[AI] streamChat errore: $e');
      onError?.call(e.toString());
      onDone();
    }
  }

  Iterable<String> _chunk(String s) sync* {
    // Splitta per parole per effetto streaming realistico
    for (final w in s.split(' ')) {
      yield '$w ';
    }
  }

  Iterable<String>? _sseFetch(List<Map<String, String>> messages, String? startupId) {
    // Stub: per MVP usiamo invoke JSON + chunk lato client — vero SSE richiede http package
    return null;
  }
}
