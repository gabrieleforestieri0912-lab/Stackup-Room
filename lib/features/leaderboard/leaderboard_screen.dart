import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/supabase/supabase_client.dart';
import '../../core/theme/app_colors.dart';
import '../paywall/paywall_provider.dart';
import '../startup/startup_provider.dart';
import 'data/leaderboard_repository.dart';
import 'domain/leaderboard_entry.dart';
import 'leaderboard_provider.dart';
import 'presentation/leaderboard_row.dart';

class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen> {
  final _scroll = ScrollController();
  final _keys = <String, GlobalKey>{};

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToMe(int rank) {
    if (rank <= 0) return;
    final reduce = MediaQuery.of(context).disableAnimations;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      // Stima offset: ogni row ~78px + header ~60, scrolla in vista con animazione se permessa
      final offset = (rank * 78.0) - 120;
      if (reduce) {
        _scroll.jumpTo(offset.clamp(0, _scroll.position.maxScrollExtent));
      } else {
        _scroll.animateTo(offset.clamp(0, _scroll.position.maxScrollExtent), duration: const Duration(milliseconds: 420), curve: Curves.easeOutCubic);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final paywall = ref.watch(paywallProvider);
    final lb = ref.watch(leaderboardProvider);
    final myRank = lb.myRank;
    final myId = SupabaseService.clientOrNull?.auth.currentUser?.id;

    // Auto-scroll dopo load
    if (lb.entries.isNotEmpty && myRank > 3) {
      _scrollToMe(myRank);
    }

    if (!paywall.canSeeComparativeLeaderboard) {
      return Scaffold(appBar: AppBar(title: const Text('Leaderboard')), body: _PaywalledPreview(c: c));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: () => ref.read(leaderboardProvider.notifier).refresh()),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded),
            onSelected: (v) {
              if (v == 'privacy_mrr') {
                final cur = lb.optIn?['show_mrr'] as bool? ?? true;
                ref.read(leaderboardProvider.notifier).setOptIn(showMrr: !cur);
              }
              if (v == 'verify') {
                final startupId = ref.read(startupProvider).items.firstOrNull?.id;
                if (startupId != null) ref.read(leaderboardProvider.notifier).verifyStripe(startupId);
              }
            },
            itemBuilder: (ctx) => [
              PopupMenuItem(value: 'privacy_mrr', child: Text((lb.optIn?['show_mrr'] as bool? ?? true) ? 'Nascondi il mio MRR' : 'Mostra il mio MRR')),
              const PopupMenuItem(value: 'verify', child: Text('Verifica Stripe (Edge Function)')),
            ],
          ),
        ],
      ),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          child: SegmentedButton<LeaderboardSort>(
            segments: const [
              ButtonSegment(value: LeaderboardSort.mrr, label: Text('MRR'), icon: Icon(Icons.euro_rounded, size: 14)),
              ButtonSegment(value: LeaderboardSort.streak, label: Text('Streak'), icon: Icon(Icons.local_fire_department_rounded, size: 14)),
            ],
            selected: {lb.sort},
            onSelectionChanged: (s) => ref.read(leaderboardProvider.notifier).setSort(s.first),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            Icon(Icons.verified_rounded, size: 16, color: c.primaryLight),
            const SizedBox(width: 6),
            Expanded(child: Text('Solo revenue verificata scala la classifica. Verifica via Edge Function stripe-verify (mai chiave client).', style: TextStyle(color: c.primaryLight, fontSize: 11, fontWeight: FontWeight.w500))),
            if (myRank > 0) Container(margin: const EdgeInsets.only(left: 8), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: c.accentSignal, borderRadius: BorderRadius.circular(20)), child: Text('#$myRank', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800))),
          ]),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => ref.read(leaderboardProvider.notifier).refresh(),
            child: lb.isLoading && lb.entries.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    controller: _scroll,
                    padding: const EdgeInsets.all(16),
                    itemCount: lb.entries.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final e = lb.entries[i];
                      final rank = i + 1;
                      final isMe = e.userId == myId;
                      _keys.putIfAbsent(e.userId, () => GlobalKey());
                      return LeaderboardRow(entry: e, rank: rank, isMe: isMe, c: c);
                    },
                  ),
          ),
        ),
      ]),
    );
  }
}

class _PaywalledPreview extends StatelessWidget {
  const _PaywalledPreview({required this.c});
  final AppColors c;

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: c.border)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Row(children: [Icon(Icons.person_rounded, size: 16, color: c.accentSignal), const SizedBox(width: 6), Text('La tua metrica', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 13))]), const SizedBox(height: 8), Text('Streak 1 🔥  •  Revenue — (collega Stripe via Edge Function)', style: TextStyle(color: c.textSecondary, fontSize: 12)), const SizedBox(height: 4), Text('La comparativa con gli altri è dietro membership.', style: TextStyle(color: c.textTertiary, fontSize: 11))])),
      const SizedBox(height: 12),
      Opacity(opacity: 0.45, child: LeaderboardRow(entry: const LeaderboardEntry(userId: 'acme', displayName: 'Acme AI', startupName: 'Acme AI', latestRevenueCents: 1240000, currency: 'EUR', streakDays: 7, deltaCents: 12000), rank: 1, isMe: false, c: c)),
      const SizedBox(height: 8),
      Opacity(opacity: 0.30, child: LeaderboardRow(entry: const LeaderboardEntry(userId: 'vertex', displayName: 'Vertex', startupName: 'Vertex', latestRevenueCents: 810000, currency: 'EUR', streakDays: 5, deltaCents: -5000), rank: 2, isMe: false, c: c)),
      const SizedBox(height: 16),
      Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: c.accentSignal.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16), border: Border.all(color: c.accentSignal.withValues(alpha: 0.3))), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [Icon(Icons.lock_rounded, color: c.accentSignal), const SizedBox(height: 8), Text('Leaderboard comparativa bloccata', textAlign: TextAlign.center, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)), const SizedBox(height: 4), Text('Sblocca con membership per vedere il tuo rank reale e quello degli altri founder.', textAlign: TextAlign.center, style: TextStyle(color: c.textSecondary, fontSize: 12)), const SizedBox(height: 12), ElevatedButton(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Paywall RevenueCat — Fase 7 (3/6/12 mesi)'))), style: ElevatedButton.styleFrom(backgroundColor: c.accentSignal, foregroundColor: Colors.white), child: const Text('Vedi piani — da 3 mesi')), const SizedBox(height: 4), Text('TODO: confermare pricing su RevenueCat dashboard', textAlign: TextAlign.center, style: TextStyle(color: c.textTertiary, fontSize: 10))])),
      const SizedBox(height: 12),
      OutlinedButton(onPressed: () {}, child: const Text('Privacy: cosa rendo visibile (toggle Fase 4)')),
    ]);
  }
}

extension _FirstOrNull<E> on List<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
