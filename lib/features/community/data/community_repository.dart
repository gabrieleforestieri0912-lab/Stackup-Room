import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';

import '../../../core/storage/hive_service.dart';
import '../../../core/supabase/supabase_client.dart';
import '../domain/community.dart';

class CommunityRepository {
  static const _kChannels = 'community_channels';
  static const _kGuides = 'community_guides';

  Future<List<CommunityChannel>> fetchChannels() async {
    final client = SupabaseService.clientOrNull;
    if (client == null) return _mockChannels();
    try {
      final rows = await client.from('community_channels').select().order('name');
      return (rows as List).map((r) => CommunityChannel.fromJson(r as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('[Community] channels errore: $e');
      return _mockChannels();
    }
  }

  Future<List<CommunityMessage>> fetchMessages(String channelId) async {
    final client = SupabaseService.clientOrNull;
    if (client == null) return [];
    try {
      final rows = await client.from('community_messages').select().eq('channel_id', channelId).order('created_at', ascending: true).limit(100);
      return (rows as List).map((r) => CommunityMessage.fromJson(r as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('[Community] messages errore: $e');
      return [];
    }
  }

  Future<CommunityMessage?> sendMessage({required String channelId, required String content, String? replyTo, String? voiceUrl}) async {
    final client = SupabaseService.clientOrNull;
    final uid = client?.auth.currentUser?.id;
    if (client == null || uid == null) return null;
    try {
      final row = await client.from('community_messages').insert({'channel_id': channelId, 'user_id': uid, 'content': content.trim(), if (replyTo != null) 'reply_to': replyTo, if (voiceUrl != null) 'voice_url': voiceUrl}).select().single();
      return CommunityMessage.fromJson(row as Map<String, dynamic>);
    } catch (e) {
      debugPrint('[Community] send errore: $e');
      return null;
    }
  }

  Future<void> toggleReaction(String messageId, String emoji) async {
    final client = SupabaseService.clientOrNull;
    final uid = client?.auth.currentUser?.id;
    if (client == null || uid == null) return;
    try {
      final row = await client.from('community_messages').select('reactions').eq('id', messageId).single();
      final raw = (row as Map)['reactions'] as Map<String, dynamic>? ?? {};
      final map = <String, List<String>>{};
      raw.forEach((k, v) => map[k] = (v as List).cast<String>());
      final list = map[emoji] ?? [];
      if (list.contains(uid)) {
        list.remove(uid);
        if (list.isEmpty) map.remove(emoji); else map[emoji] = list;
      } else {
        map[emoji] = [...list, uid];
      }
      await client.from('community_messages').update({'reactions': map}).eq('id', messageId);
    } catch (e) {
      debugPrint('[Community] reaction errore: $e');
    }
  }

  Future<String?> uploadVoiceNote(String localPath) async {
    final client = SupabaseService.clientOrNull;
    final uid = client?.auth.currentUser?.id;
    if (client == null || uid == null) return null;
    try {
      final file = File(localPath);
      if (!await file.exists()) {
        debugPrint('[Community] file voice note non trovato: $localPath');
        return null;
      }
      final bytes = await file.readAsBytes();
      final path = '$uid/${DateTime.now().microsecondsSinceEpoch}.m4a';
      await client.storage.from('voice_notes').uploadBinary(path, bytes);
      // Bucket privato (voice_notes non è public): per la letura usa createSignedUrl.
      return path;
    } catch (e) {
      debugPrint('[Community] voice upload errore: $e');
      return null;
    }
  }

  /// Genera URL firmato (60s) per riprodurre un voice note da bucket privato.
  Future<String?> getVoiceNoteUrl(String path) async {
    final client = SupabaseService.clientOrNull;
    if (client == null) return null;
    try {
      final url = await client.storage.from('voice_notes').createSignedUrl(path, 60);
      return url;
    } catch (e) {
      debugPrint('[Community] signed url errore: $e');
      return null;
    }
  }

  Future<List<Guide>> fetchGuides({String? category}) async {
    final client = SupabaseService.clientOrNull;
    if (client == null) return _mockGuides(category);
    try {
      var q = client.from('guides').select();
      if (category != null) q = q.eq('category', category);
      final rows = await q.order('created_at');
      final list = (rows as List).map((r) => Guide.fromJson(r as Map<String, dynamic>)).toList();
      await HiveService.box.put(_kGuides, jsonEncode(list.map((g) => {'id': g.id, 'title': g.title, 'category': g.category, 'body_md': g.bodyMd}).toList()));
      return list;
    } catch (e) {
      debugPrint('[Community] guides errore: $e');
      return _mockGuides(category);
    }
  }

  List<CommunityChannel> _mockChannels() => const [CommunityChannel(id: '00000000-0000-0000-0000-000000000001', name: 'generale'), CommunityChannel(id: '00000000-0000-0000-0000-000000000002', name: 'shipping'), CommunityChannel(id: '00000000-0000-0000-0000-000000000003', name: 'ask')];
  List<Guide> _mockGuides(String? cat) {
    const all = [Guide(id: '1', title: 'Validare in 7 giorni', category: 'playbook', bodyMd: '# Validare\n\nShippa prima.'), Guide(id: '2', title: 'Pricing', category: 'product', bodyMd: '# Pricing\n\nTesta 3 prezzi.'), Guide(id: '3', title: 'Bootstrapping', category: 'fundraising', bodyMd: '# Bootstrapping\n\nMRR → profit.')];
    if (cat == null) return all;
    return all.where((g) => g.category == cat).toList();
  }
}
