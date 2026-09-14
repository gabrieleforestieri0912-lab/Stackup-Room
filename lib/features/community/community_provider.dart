import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/community_repository.dart';
import 'domain/community.dart';

class CommunityState {
  const CommunityState({this.channels = const [], this.guides = const [], this.messages = const [], this.selectedChannelId, this.isLoading = false, this.error, this.filterCategory});
  final List<CommunityChannel> channels;
  final List<Guide> guides;
  final List<CommunityMessage> messages;
  final String? selectedChannelId;
  final bool isLoading;
  final String? error;
  final String? filterCategory;

  CommunityState copyWith({List<CommunityChannel>? channels, List<Guide>? guides, List<CommunityMessage>? messages, String? selectedChannelId, bool? isLoading, String? error, String? filterCategory}) => CommunityState(channels: channels ?? this.channels, guides: guides ?? this.guides, messages: messages ?? this.messages, selectedChannelId: selectedChannelId ?? this.selectedChannelId, isLoading: isLoading ?? this.isLoading, error: error, filterCategory: filterCategory ?? this.filterCategory);
}

class CommunityNotifier extends StateNotifier<CommunityState> {
  CommunityNotifier() : super(const CommunityState()) {
    _init();
  }
  final _repo = CommunityRepository();

  Future<void> _init() async {
    state = state.copyWith(isLoading: true);
    final channels = await _repo.fetchChannels();
    final guides = await _repo.fetchGuides();
    state = CommunityState(channels: channels, guides: guides, selectedChannelId: channels.isNotEmpty ? channels.first.id : null);
    if (state.selectedChannelId != null) await selectChannel(state.selectedChannelId!);
  }

  Future<void> selectChannel(String id) async {
    state = state.copyWith(selectedChannelId: id, isLoading: true);
    final msgs = await _repo.fetchMessages(id);
    state = state.copyWith(messages: msgs, isLoading: false);
  }

  Future<void> send(String content, {String? replyTo}) async {
    final ch = state.selectedChannelId;
    if (ch == null || content.trim().isEmpty) return;
    final msg = await _repo.sendMessage(channelId: ch, content: content, replyTo: replyTo);
    if (msg != null) state = state.copyWith(messages: [...state.messages, msg]);
  }

  /// Registra (già registrato su file locale) e invia un voice note.
  /// localPath: file .m4a temporaneo; content: testo opzionale associato.
  Future<bool> sendVoice({required String localPath, String? content, String? replyTo}) async {
    final ch = state.selectedChannelId;
    if (ch == null) return false;
    final path = await _repo.uploadVoiceNote(localPath);
    if (path == null) return false;
    final msg = await _repo.sendMessage(channelId: ch, content: content ?? '🎙️ Voice note', replyTo: replyTo, voiceUrl: path);
    if (msg != null) {
      state = state.copyWith(messages: [...state.messages, msg]);
      return true;
    }
    return false;
  }

  /// URL firmato per riprodurre un voice note (bucket privato).
  Future<String?> voiceNoteUrl(String path) => _repo.getVoiceNoteUrl(path);

  Future<void> react(String messageId, String emoji) async {
    await _repo.toggleReaction(messageId, emoji);
    if (state.selectedChannelId != null) {
      final msgs = await _repo.fetchMessages(state.selectedChannelId!);
      state = state.copyWith(messages: msgs);
    }
  }

  Future<void> filterGuides(String? category) async {
    final guides = await _repo.fetchGuides(category: category);
    state = state.copyWith(guides: guides, filterCategory: category);
  }

  Future<void> refreshMessages() async {
    if (state.selectedChannelId == null) return;
    final msgs = await _repo.fetchMessages(state.selectedChannelId!);
    state = state.copyWith(messages: msgs);
  }
}

final communityProvider = StateNotifierProvider<CommunityNotifier, CommunityState>((ref) => CommunityNotifier());
