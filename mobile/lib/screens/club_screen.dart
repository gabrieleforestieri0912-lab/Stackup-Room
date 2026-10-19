import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'shell_screen.dart';

/// Chat live del Club: polling ogni 5 secondi, stile Discord.
class ClubScreen extends StatefulWidget {
  const ClubScreen({super.key});

  @override
  State<ClubScreen> createState() => _ClubScreenState();
}

class _ClubScreenState extends State<ClubScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatMessage> _messages = [];

  Timer? _timer;
  String? _since;
  bool _loading = true;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _poll());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final api = context.read<ApiClient>();
      final j = await api.get('/api/room/chat?limit=60');
      final list = (j['messages'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ChatMessage.fromJson)
          .toList();
      if (!mounted) return;
      setState(() {
        _messages
          ..clear()
          ..addAll(list);
        if (list.isNotEmpty) _since = list.last.createdAt.toIso8601String();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _poll() async {
    if (_sending) return;
    try {
      final api = context.read<ApiClient>();
      final path = _since == null
          ? '/api/room/chat?limit=60'
          : '/api/room/chat?limit=60&since=${Uri.encodeComponent(_since!)}';
      final j = await api.get(path);
      final list = (j['messages'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ChatMessage.fromJson)
          .toList();
      if (!mounted || list.isEmpty) return;
      setState(() {
        _messages.addAll(list);
        _since = list.last.createdAt.toIso8601String();
      });
      _scrollDown();
    } catch (_) {
      // rete momentaneamente indisponibile: riprova al prossimo tick
    }
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
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    _input.clear();
    final api = context.read<ApiClient>();
    try {
      final j = await api.post('/api/room/chat', {'body': text});
      final m = j['message'];
      if (m is Map<String, dynamic>) {
        setState(() {
          _messages.add(ChatMessage.fromJson({
            ...m,
            'mine': true,
            'author': m['author'] ?? 'Io',
          }));
        });
        _scrollDown();
      } else {
        await _refresh();
      }
    } catch (e) {
      if (mounted) {
        showApiError(context, e);
        _input.text = text;
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              Icon(Icons.forum, color: RoomTheme.room, size: 20),
              SizedBox(width: 8),
              Text(
                'Chat del Club',
                style: TextStyle(
                  color: RoomTheme.text,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(
                  child: CircularProgressIndicator(color: RoomTheme.room),
                )
              : _messages.isEmpty
                  ? const EmptyState(
                      icon: Icons.chat_bubble_outline,
                      text: 'Nessun messaggio. Apri tu la conversazione!',
                    )
                  : RefreshIndicator(
                      color: RoomTheme.room,
                      onRefresh: _refresh,
                      child: ListView.builder(
                        controller: _scroll,
                        reverse: true,
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) {
                          final m = _messages[_messages.length - 1 - i];
                          return _MessageBubble(m: m);
                        },
                      ),
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
                  decoration: const InputDecoration(hintText: 'Scrivi un messaggio…'),
                  onSubmitted: (_) => _send(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _sending ? null : _send,
                style: FilledButton.styleFrom(
                  backgroundColor: RoomTheme.room,
                  foregroundColor: RoomTheme.bg,
                  padding: const EdgeInsets.all(12),
                ),
                icon: const Icon(Icons.send, size: 18),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.m});

  final ChatMessage m;

  @override
  Widget build(BuildContext context) {
    final align = m.mine ? Alignment.centerRight : Alignment.centerLeft;
    final bg = m.mine ? RoomTheme.room.withValues(alpha: 0.15) : RoomTheme.card;
    final border = m.mine
        ? RoomTheme.room.withValues(alpha: 0.4)
        : RoomTheme.border;
    return Align(
      alignment: align,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              m.mine ? 'Tu' : m.author,
              style: const TextStyle(
                color: RoomTheme.room,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (m.replyAuthor != null)
              Text(
                '↩ ${m.replyAuthor}: ${m.replyBody ?? ''}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: RoomTheme.textFaint, fontSize: 11, fontStyle: FontStyle.italic),
              ),
            Text(
              m.body,
              style: const TextStyle(color: RoomTheme.text, fontSize: 14, height: 1.35),
            ),
            Text(
              hhmm(m.createdAt),
              style: const TextStyle(color: RoomTheme.textFaint, fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }
}
