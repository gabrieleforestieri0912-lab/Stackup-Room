import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../startup/startup_provider.dart';
import '../ai_coach_provider.dart';
import 'chat_bubble.dart';

class AiCoachScreen extends ConsumerStatefulWidget {
  const AiCoachScreen({super.key});

  @override
  ConsumerState<AiCoachScreen> createState() => _AiCoachScreenState();
}

class _AiCoachScreenState extends ConsumerState<AiCoachScreen> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();

  static const _prompts = [
    'Aiutami a validare un\'idea',
    'Rivedi il mio pricing',
    'Pianifica la giornata',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final sel = ref.read(startupProvider).selectedId;
      ref.read(aiCoachProvider.notifier).load(startupId: sel);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _send([String? text]) {
    final t = (text ?? _ctrl.text).trim();
    if (t.isEmpty) return;
    _ctrl.clear();
    ref.read(aiCoachProvider.notifier).send(t);
    _jump();
  }

  void _jump() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scroll.hasClients) return;
      final target = _scroll.position.maxScrollExtent;
      // Reduced motion: salta direttamente in fondo, senza animazione.
      if (MediaQuery.of(context).disableAnimations) {
        _scroll.jumpTo(target);
      } else {
        _scroll.animateTo(target, duration: const Duration(milliseconds: 220), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final state = ref.watch(aiCoachProvider);
    final startups = ref.watch(startupProvider);

    // Aggiorna contesto quando cambia selezione Portfolio
    ref.listen(startupProvider, (prev, next) {
      if (prev?.selectedId != next.selectedId) ref.read(aiCoachProvider.notifier).setStartup(next.selectedId);
    });

    // Auto-scroll durante streaming
    ref.listen(aiCoachProvider, (_, next) {
      if (next.streamingText.isNotEmpty) _jump();
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Coach'),
        actions: [
          if (startups.items.isNotEmpty)
            DropdownButtonHideUnderline(
              child: DropdownButton<String?>(
                value: state.startupId,
                hint: Text('Tutti', style: TextStyle(color: c.textSecondary, fontSize: 12)),
                items: [const DropdownMenuItem(value: null, child: Text('Tutti i progetti')), ...startups.items.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name)))],
                onChanged: (v) => ref.read(aiCoachProvider.notifier).setStartup(v),
              ),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(children: [
        Expanded(
          child: state.messages.isEmpty && !state.isStreaming
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.smart_toy_outlined, size: 40, color: c.textTertiary),
                      const SizedBox(height: 12),
                      Text('Chiedi al tuo AI coach', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 6),
                      Text('Ha contesto su: ${startups.items.isEmpty ? "nessun progetto — aggiungine uno" : startups.items.map((s) => s.name).join(", ")} • task di oggi • ultimo standup.', textAlign: TextAlign.center, style: TextStyle(color: c.textSecondary, fontSize: 11, height: 1.4)),
                    ]),
                  ),
                )
              : ListView(
                  controller: _scroll,
                  padding: const EdgeInsets.all(16),
                  children: [
                    for (final m in state.messages) ChatBubble(message: m),
                    if (state.isStreaming) StreamingBubble(text: state.streamingText),
                  ],
                ),
        ),
        if (state.error != null)
          Container(margin: const EdgeInsets.symmetric(horizontal: 16), padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: c.error.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)), child: Text(state.error!, style: TextStyle(color: c.error, fontSize: 11))),
        // Chip prompt rapidi
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(children: [
            for (final p in _prompts)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(label: Text(p, style: const TextStyle(fontSize: 12)), onPressed: state.isStreaming ? null : () => _send(p)),
              ),
          ]),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Row(children: [
              Expanded(child: TextField(controller: _ctrl, minLines: 1, maxLines: 4, decoration: InputDecoration(hintText: 'Scrivi un messaggio...', prefixIcon: const Icon(Icons.chat_bubble_outline_rounded, size: 18)), onSubmitted: (_) => _send(), enabled: !state.isStreaming)),
              const SizedBox(width: 8),
              FilledButton(onPressed: state.isStreaming ? null : () => _send(), child: state.isStreaming ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send_rounded, size: 18)),
            ]),
          ),
        ),
      ]),
    );
  }
}
