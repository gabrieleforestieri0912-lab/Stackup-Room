import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../state/room_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

class CoachMode {
  const CoachMode(this.id, this.label);
  final String id;
  final String label;
}

const _modes = <CoachMode>[
  CoachMode('planner', 'Pianificatore'),
  CoachMode('advisor', 'Consulente'),
  CoachMode('standup', 'Standup'),
  CoachMode('ask', 'Domande'),
];

/// Chat con il coach AI: la risposta arriva in streaming (SSE),
/// stesso endpoint della web app.
class CoachScreen extends StatefulWidget {
  const CoachScreen({super.key});

  @override
  State<CoachScreen> createState() => _CoachScreenState();
}

class _CoachScreenState extends State<CoachScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<CoachTurn> _turns = [];

  String _mode = 'planner';
  String? _sessionId;
  bool _busy = false;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          0,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _busy) return;
    final api = context.read<ApiClient>();
    final state = context.read<RoomState>();
    setState(() {
      _busy = true;
      _turns.add(CoachTurn(role: 'user', text: text));
      _turns.add(CoachTurn(role: 'assistant', text: ''));
    });
    _input.clear();
    _scrollDown();

    final buffer = StringBuffer();
    try {
      final res = await api.postStream('/api/room/coach', {
        'mode': _mode,
        'message': text,
        if (state.startupId != null) 'startup_id': state.startupId,
        if (_sessionId != null) 'session_id': _sessionId,
      });

      var chunkBuffer = '';
      final stream = res.stream.transform(utf8.decoder);
      await for (final chunk in stream) {
        chunkBuffer += chunk;
        while (chunkBuffer.contains('\n\n')) {
          final idx = chunkBuffer.indexOf('\n\n');
          final block = chunkBuffer.substring(0, idx);
          chunkBuffer = chunkBuffer.substring(idx + 2);
          for (final line in block.split('\n')) {
            if (!line.startsWith('data:')) continue;
            final payload = line.substring(5).trim();
            Map<String, dynamic> data;
            try {
              data = jsonDecode(payload) as Map<String, dynamic>;
            } catch (_) {
              continue;
            }
            if (data['session_id'] is String) {
              _sessionId = data['session_id'] as String?;
            } else if (data['text'] is String) {
              buffer.write(data['text'] as String);
              _setLastAssistant(buffer.toString());
            } else if (data['error'] is String) {
              buffer.write('\n⚠ ${data['error']}');
              _setLastAssistant(buffer.toString());
            }
          }
        }
      }
      if (buffer.isEmpty) {
        _setLastAssistant('Il coach non ha risposto. Riprova.');
      }
    } catch (e) {
      _setLastAssistant('⚠ ${e.toString()}');
    } finally {
      if (mounted) setState(() => _busy = false);
      _scrollDown();
    }
  }

  void _setLastAssistant(String text) {
    if (!mounted) return;
    setState(() {
      _turns[_turns.length - 1] = CoachTurn(role: 'assistant', text: text);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              Icon(Icons.auto_awesome, color: RoomTheme.room, size: 20),
              SizedBox(width: 8),
              Text(
                'Coach',
                style: TextStyle(
                  color: RoomTheme.text,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        // Modalità
        SizedBox(
          height: 56,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            children: [
              for (final m in _modes)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(m.label),
                    selected: _mode == m.id,
                    onSelected: (_) => setState(() => _mode = m.id),
                    selectedColor: RoomTheme.room.withValues(alpha: 0.2),
                    backgroundColor: RoomTheme.surface,
                    labelStyle: TextStyle(
                      color: _mode == m.id ? RoomTheme.room : RoomTheme.textDim,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    side: BorderSide(
                      color: _mode == m.id ? RoomTheme.room : RoomTheme.border,
                    ),
                    showCheckmark: false,
                  ),
                ),
            ],
          ),
        ),
        Expanded(
          child: _turns.isEmpty
              ? const EmptyState(
                  icon: Icons.auto_awesome_outlined,
                  text: 'Chiedi al coach: strategia, pricing, lancio, standup.',
                )
              : ListView.builder(
                  controller: _scroll,
                  reverse: true,
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  itemCount: _turns.length,
                  itemBuilder: (_, i) {
                    final t = _turns[_turns.length - 1 - i];
                    final mine = t.role == 'user';
                    return Align(
                      alignment:
                          mine ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.82,
                        ),
                        decoration: BoxDecoration(
                          color: mine
                              ? RoomTheme.room.withValues(alpha: 0.15)
                              : RoomTheme.card,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: mine
                                ? RoomTheme.room.withValues(alpha: 0.4)
                                : RoomTheme.border,
                          ),
                        ),
                        child: Text(
                          t.text.isEmpty && !mine ? '…' : t.text,
                          style: const TextStyle(
                            color: RoomTheme.text,
                            fontSize: 14,
                            height: 1.4,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          decoration: const BoxDecoration(
            color: RoomTheme.surface,
            border: Border(top: BorderSide(color: RoomTheme.border)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _input,
                  minLines: 1,
                  maxLines: 4,
                  style: const TextStyle(color: RoomTheme.text, fontSize: 14),
                  decoration: const InputDecoration(
                      hintText: 'Chiedi al coach…'),
                  onSubmitted: (_) => _send(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _busy ? null : _send,
                style: FilledButton.styleFrom(
                  backgroundColor: RoomTheme.room,
                  foregroundColor: RoomTheme.bg,
                  padding: const EdgeInsets.all(12),
                ),
                icon: _busy
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: RoomTheme.bg),
                      )
                    : const Icon(Icons.send, size: 18),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
