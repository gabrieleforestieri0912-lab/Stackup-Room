import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/ai_coach_repository.dart';
import 'domain/ai_message.dart';

class AiCoachState {
  const AiCoachState({this.messages = const [], this.isStreaming = false, this.streamingText = '', this.error, this.startupId});
  final List<AiMessage> messages;
  final bool isStreaming;
  final String streamingText; // testo parziale durante streaming
  final String? error;
  final String? startupId;

  AiCoachState copyWith({List<AiMessage>? messages, bool? isStreaming, String? streamingText, String? error, String? startupId}) => AiCoachState(
        messages: messages ?? this.messages,
        isStreaming: isStreaming ?? this.isStreaming,
        streamingText: streamingText ?? this.streamingText,
        error: error,
        startupId: startupId ?? this.startupId,
      );
}

class AiCoachNotifier extends StateNotifier<AiCoachState> {
  AiCoachNotifier(this.ref) : super(const AiCoachState());
  final Ref ref;
  final _repo = AiCoachRepository();

  Future<void> load({String? startupId}) async {
    state = state.copyWith(startupId: startupId);
    final history = await _repo.fetchHistory(startupId: startupId);
    state = AiCoachState(messages: history, startupId: startupId);
  }

  Future<void> send(String prompt) async {
    if (prompt.trim().isEmpty || state.isStreaming) return;
    final userMsg = AiMessage(id: 'local_${DateTime.now().microsecondsSinceEpoch}', role: 'user', content: prompt.trim(), startupId: state.startupId, createdAt: DateTime.now());
    state = state.copyWith(messages: [...state.messages, userMsg], isStreaming: true, streamingText: '', error: null);

    final payload = state.messages.where((m) => !m.id.startsWith('local_stream')).map((m) => {'role': m.role, 'content': m.content}).toList();
    // Usa solo ultimi 12 per context window
    final window = payload.length > 12 ? payload.sublist(payload.length - 12) : payload;

    await _repo.streamChat(
      messages: window,
      startupId: state.startupId,
      onDelta: (delta) {
        state = state.copyWith(streamingText: state.streamingText + delta);
      },
      onDone: () async {
        final full = state.streamingText;
        if (full.isEmpty) {
          state = state.copyWith(isStreaming: false);
          return;
        }
        final assistant = AiMessage(id: 'as_${DateTime.now().microsecondsSinceEpoch}', role: 'assistant', content: full, startupId: state.startupId, createdAt: DateTime.now());
        state = AiCoachState(messages: [...state.messages, assistant], startupId: state.startupId);
        // Refresh history da remoto (in background)
        _repo.fetchHistory(startupId: state.startupId);
      },
      onError: (e) => state = state.copyWith(error: e, isStreaming: false),
    );
  }

  void setStartup(String? id) => load(startupId: id);
}

final aiCoachProvider = StateNotifierProvider<AiCoachNotifier, AiCoachState>((ref) => AiCoachNotifier(ref));
