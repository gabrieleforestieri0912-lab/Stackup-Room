import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/two_pane_layout.dart';
import '../../paywall/paywall_provider.dart';
import '../../paywall/presentation/paywall_screen.dart';
import '../community_provider.dart';
import '../domain/community.dart';
import 'guide_detail_sheet.dart';

class CommunityScreen extends ConsumerWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final paywall = ref.watch(paywallProvider);
    if (!paywall.canAccessCommunity) return _PaywalledCommunity(c: c);
    return _CommunityContent(c: c);
  }
}

class _PaywalledCommunity extends StatelessWidget {
  const _PaywalledCommunity({required this.c});
  final AppColors c;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Community')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: c.border)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Row(children: [Icon(Icons.forum_rounded, size: 18, color: c.accentSignal), const SizedBox(width: 8), Text('Anteprima community', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14))]), const SizedBox(height: 8), Text('#generale — 3 canali • #shipping • #ask', style: TextStyle(color: c.textSecondary, fontSize: 12)), const SizedBox(height: 4), Text('Guide: Validare in 7 giorni • Pricing • Bootstrapping', style: TextStyle(color: c.textTertiary, fontSize: 11))])),
        const SizedBox(height: 12),
        Opacity(opacity: 0.4, child: _FakeMessage(c: c, text: 'Ciao founder! Oggi ho shippato...')),
        const SizedBox(height: 8),
        Opacity(opacity: 0.3, child: _FakeMessage(c: c, text: 'Hai provato a validare con 5 interviste?')),
        const SizedBox(height: 16),
        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: c.accentSignal.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16), border: Border.all(color: c.accentSignal.withValues(alpha: 0.3))), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [Icon(Icons.lock_rounded, color: c.accentSignal), const SizedBox(height: 8), Text('Community bloccata', textAlign: TextAlign.center, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)), const SizedBox(height: 4), Text('Chat live, reazioni, voice notes e guide sono dietro membership.', textAlign: TextAlign.center, style: TextStyle(color: c.textSecondary, fontSize: 12)), const SizedBox(height: 12), ElevatedButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PaywallScreen())), style: ElevatedButton.styleFrom(backgroundColor: c.accentSignal, foregroundColor: Colors.white), child: const Text('Sblocca community'))])),
      ]),
    );
  }
}

class _FakeMessage extends StatelessWidget {
  const _FakeMessage({required this.c, required this.text});
  final AppColors c;
  final String text;
  @override
  Widget build(BuildContext context) => Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)), child: Text(text, style: TextStyle(color: c.textSecondary, fontSize: 12)));
}

class _CommunityContent extends ConsumerStatefulWidget {
  const _CommunityContent({required this.c});
  final AppColors c;

  @override
  ConsumerState<_CommunityContent> createState() => _CommunityContentState();
}

class _CommunityContentState extends ConsumerState<_CommunityContent> with SingleTickerProviderStateMixin {
  late TabController _tab;
  final _ctrl = TextEditingController();
  String? _replyTo;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(communityProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community'),
        bottom: TabBar(controller: _tab, labelColor: widget.c.text, unselectedLabelColor: widget.c.textTertiary, indicatorColor: widget.c.accentSignal, tabs: const [Tab(text: 'Chat'), Tab(text: 'Guide')]),
      ),
      body: TabBarView(controller: _tab, children: [
        // Chat — su desktop (≥900px) i canali si spostano nel pane destro.
        TwoPaneLayout(
          secondaryWidth: 240,
          bodyBuilder: (context, isDesktop) => Column(children: [
          if (!isDesktop) _ChannelStrip(state: state, c: widget.c),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(communityProvider.notifier).refreshMessages(),
              child: state.isLoading && state.messages.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.separated(
                      padding: const EdgeInsets.all(12),
                      itemCount: state.messages.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, i) => _MessageTile(msg: state.messages[i], c: widget.c, onReply: () => setState(() => _replyTo = state.messages[i].id), onReact: (e) => ref.read(communityProvider.notifier).react(state.messages[i].id, e)),
                    ),
            ),
          ),
          if (_replyTo != null)
            Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), color: widget.c.surfaceAlt, child: Row(children: [Icon(Icons.reply_rounded, size: 14, color: widget.c.textTertiary), const SizedBox(width: 6), Expanded(child: Text('Risposta a ${_replyTo!.substring(0, 8)}…', style: TextStyle(color: widget.c.textTertiary, fontSize: 11))), TextButton(onPressed: () => setState(() => _replyTo = null), child: const Text('Annulla', style: TextStyle(fontSize: 11)))])),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Row(children: [
                IconButton(icon: Icon(Icons.mic_rounded, color: widget.c.textTertiary), onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Voice note — registra audio breve, upload su Storage voice_notes (Fase 6)')))),
                Expanded(child: TextField(controller: _ctrl, decoration: InputDecoration(hintText: 'Messaggio in #${state.channels.where((c) => c.id == state.selectedChannelId).firstOrNull?.name ?? "generale"}', prefixIcon: const Icon(Icons.chat_bubble_outline_rounded, size: 18)), onSubmitted: (_) => _send())),
                const SizedBox(width: 8),
                FilledButton(onPressed: _send, child: const Icon(Icons.send_rounded, size: 18)),
              ]),
            ),
          ),
        ]),
          secondary: _ChannelList(state: state, c: widget.c),
        ),
        // Guide
        _GuideTab(state: state, c: widget.c),
      ]),
    );
  }

  void _send() {
    final t = _ctrl.text.trim();
    if (t.isEmpty) return;
    ref.read(communityProvider.notifier).send(t, replyTo: _replyTo);
    _ctrl.clear();
    setState(() => _replyTo = null);
  }
}

class _MessageTile extends StatelessWidget {
  const _MessageTile({required this.msg, required this.c, required this.onReply, required this.onReact});
  final CommunityMessage msg;
  final AppColors c;
  final VoidCallback onReply;
  final void Function(String emoji) onReact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [CircleAvatar(radius: 14, backgroundColor: c.surfaceAlt, child: Text(msg.userId.substring(0, 2).toUpperCase(), style: TextStyle(fontSize: 10, color: c.textSecondary))), const SizedBox(width: 8), Text(msg.userId.substring(0, 8), style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: 12)), const Spacer(), Text(msg.createdAt.toIso8601String().substring(11, 16), style: TextStyle(color: c.textTertiary, fontSize: 10))]),
        const SizedBox(height: 6),
        if (msg.replyTo != null) Container(margin: const EdgeInsets.only(bottom: 6), padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: c.surfaceAlt, borderRadius: BorderRadius.circular(8)), child: Text('↳ reply a ${msg.replyTo!.substring(0, 8)}…', style: TextStyle(color: c.textTertiary, fontSize: 11))),
        Text(msg.content, style: TextStyle(color: c.text, fontSize: 13, height: 1.4)),
        if (msg.voiceUrl != null) Padding(padding: const EdgeInsets.only(top: 6), child: Row(children: [Icon(Icons.play_circle_rounded, size: 16, color: c.accentSignal), const SizedBox(width: 4), Text('Voice note', style: TextStyle(color: c.accentSignal, fontSize: 11, fontWeight: FontWeight.w600))])),
        const SizedBox(height: 8),
        Row(children: [
          for (final e in ['🚀', '🔥', '💡']) ...[
            InkWell(onTap: () => onReact(e), child: Container(margin: const EdgeInsets.only(right: 6), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: (msg.reactions[e]?.isNotEmpty ?? false) ? c.accentSignal.withValues(alpha: 0.15) : c.surfaceAlt, borderRadius: BorderRadius.circular(20), border: Border.all(color: c.border)), child: Text('${e} ${msg.reactions[e]?.length ?? 0}', style: TextStyle(fontSize: 11, color: c.textSecondary)))),
          ],
          const Spacer(),
          InkWell(onTap: onReply, child: Text('Rispondi', style: TextStyle(color: c.textTertiary, fontSize: 11, fontWeight: FontWeight.w600))),
        ]),
      ]),
    );
  }
}

class _GuideTab extends ConsumerWidget {
  const _GuideTab({required this.state, required this.c});
  final CommunityState state;
  final AppColors c;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(children: [
      SingleChildScrollView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.all(12), child: Row(children: [
        ChoiceChip(label: const Text('Tutte'), selected: state.filterCategory == null, onSelected: (_) => ref.read(communityProvider.notifier).filterGuides(null)),
        const SizedBox(width: 8),
        for (final cat in ['playbook', 'product', 'growth', 'fundraising']) Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: Text(cat), selected: state.filterCategory == cat, onSelected: (_) => ref.read(communityProvider.notifier).filterGuides(cat))),
      ])),
      Expanded(
        child: ListView.separated(padding: const EdgeInsets.all(12), itemCount: state.guides.length, separatorBuilder: (_, __) => const SizedBox(height: 8), itemBuilder: (context, i) {
          final g = state.guides[i];
          return Material(color: c.surface, borderRadius: BorderRadius.circular(12), child: InkWell(onTap: () => showModalBottomSheet(context: context, isScrollControlled: true, shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))), builder: (_) => GuideDetailSheet(guide: g)), borderRadius: BorderRadius.circular(12), child: Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(g.title, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)), const SizedBox(height: 4), Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: c.accentSignal.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)), child: Text(g.category, style: TextStyle(color: c.accentSignal, fontSize: 10, fontWeight: FontWeight.w700))), const SizedBox(height: 6), Text(g.bodyMd.length > 80 ? '${g.bodyMd.substring(0, 80)}…' : g.bodyMd, style: TextStyle(color: c.textSecondary, fontSize: 12))]))));
        }),
      ),
    ]);
  }
}

/// Strip orizzontale dei canali — solo mobile (su desktop si usa [_ChannelList]).
class _ChannelStrip extends ConsumerWidget {
  const _ChannelStrip({required this.state, required this.c});
  final CommunityState state;
  final AppColors c;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        scrollDirection: Axis.horizontal,
        itemCount: state.channels.length,
        separatorBuilder: (_, i) => const SizedBox(width: 8),
        itemBuilder: (context, i) => _ChannelChip(channel: state.channels[i], selected: state.channels[i].id == state.selectedChannelId, c: c),
      ),
    );
  }
}

/// Lista verticale dei canali — pane destro del layout desktop.
class _ChannelList extends ConsumerWidget {
  const _ChannelList({required this.state, required this.c});
  final CommunityState state;
  final AppColors c;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Canali', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 13)),
        const SizedBox(height: 10),
        for (final ch in state.channels)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _ChannelChip(channel: ch, selected: ch.id == state.selectedChannelId, c: c, fullWidth: true),
          ),
      ],
    );
  }
}

class _ChannelChip extends ConsumerWidget {
  const _ChannelChip({required this.channel, required this.selected, required this.c, this.fullWidth = false});
  final CommunityChannel channel;
  final bool selected;
  final AppColors c;
  final bool fullWidth;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chip = ChoiceChip(
      label: Text('#${channel.name}', style: TextStyle(fontSize: 12, color: selected ? Colors.white : c.textSecondary)),
      selected: selected,
      selectedColor: c.accentSignal,
      onSelected: (_) => ref.read(communityProvider.notifier).selectChannel(channel.id),
    );
    return fullWidth ? SizedBox(width: double.infinity, child: chip) : chip;
  }
}
