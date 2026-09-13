import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../paywall/paywall_provider.dart';

/// Leaderboard — Fase 4 spec: metriche personali free, comparativa dietro membership.
/// Se !hasMembership: mostra propria metrica + preview bloccata + CTA paywall (Fase 7).
class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final paywall = ref.watch(paywallProvider);

    final mock = [
      ('acme', 'Acme AI', '€12.4k', 7),
      ('vertex', 'Vertex', '€8.1k', 5),
      ('stackup', 'Stackup Room', '—', 1),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: paywall.canSeeComparativeLeaderboard
          ? _FullLeaderboard(c: c, mock: mock)
          : _PaywalledPreview(c: c, mock: mock),
    );
  }
}

class _FullLeaderboard extends StatelessWidget {
  const _FullLeaderboard({required this.c, required this.mock});
  final AppColors c;
  final List<(String, String, String, int)> mock;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: mock.length + 1,
      separatorBuilder: (context, index) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        if (i == 0) {
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(12)),
            child: Row(
              children: [
                Icon(Icons.verified_rounded, size: 16, color: c.primaryLight),
                const SizedBox(width: 6),
                Expanded(child: Text('Solo revenue verificata scala la classifica. Collega Stripe per comparire.', style: TextStyle(color: c.primaryLight, fontSize: 12, fontWeight: FontWeight.w500))),
              ],
            ),
          );
        }
        final e = mock[i - 1];
        return _Row(c: c, index: i, e: e);
      },
    );
  }
}

class _PaywalledPreview extends StatelessWidget {
  const _PaywalledPreview({required this.c, required this.mock});
  final AppColors c;
  final List<(String, String, String, int)> mock;

  @override
  Widget build(BuildContext context) {
    // Metriche personali free (rank proprio evidenziato) + comparativa bloccata
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: c.border)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Icon(Icons.person_rounded, size: 16, color: c.accentSignal), const SizedBox(width: 6), Text('La tua metrica', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 13))]),
            const SizedBox(height: 8),
            Text('Streak 1 🔥  •  Revenue — (collega Stripe)', style: TextStyle(color: c.textSecondary, fontSize: 12)),
            const SizedBox(height: 4),
            Text('La comparativa con gli altri è dietro membership.', style: TextStyle(color: c.textTertiary, fontSize: 11)),
          ]),
        ),
        const SizedBox(height: 16),
        // Preview sfocata di 2 righe
        Opacity(opacity: 0.45, child: _Row(c: c, index: 1, e: mock[0])),
        const SizedBox(height: 8),
        Opacity(opacity: 0.3, child: _Row(c: c, index: 2, e: mock[1])),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: c.accentSignal.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16), border: Border.all(color: c.accentSignal.withValues(alpha: 0.3))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Icon(Icons.lock_rounded, color: c.accentSignal),
            const SizedBox(height: 8),
            Text('Leaderboard comparativa bloccata', textAlign: TextAlign.center, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 4),
            Text('Sblocca con membership per vedere il tuo rank reale e quello degli altri founder.', textAlign: TextAlign.center, style: TextStyle(color: c.textSecondary, fontSize: 12)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Paywall RevenueCat — Fase 7 (3/6/12 mesi)'))),
              style: ElevatedButton.styleFrom(backgroundColor: c.accentSignal, foregroundColor: Colors.white),
              child: const Text('Vedi piani — da 3 mesi'),
            ),
            const SizedBox(height: 4),
            Text('TODO: confermare pricing su RevenueCat dashboard', textAlign: TextAlign.center, style: TextStyle(color: c.textTertiary, fontSize: 10)),
          ]),
        ),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.c, required this.index, required this.e});
  final AppColors c;
  final int index;
  final (String, String, String, int) e;

  @override
  Widget build(BuildContext context) {
    final isAccent = index == 1;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: isAccent ? c.accentSignal.withValues(alpha: 0.4) : c.border)),
      child: Row(children: [
        Text('#$index', style: TextStyle(color: isAccent ? c.accentSignal : c.textTertiary, fontWeight: FontWeight.w700, fontSize: 13)),
        const SizedBox(width: 12),
        CircleAvatar(radius: 18, backgroundColor: c.surfaceAlt, child: Text(e.$1[0].toUpperCase(), style: TextStyle(color: c.textSecondary, fontWeight: FontWeight.w700))),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(e.$2, style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: 14)), Text('@${e.$1}  •  streak ${e.$4}🔥', style: TextStyle(color: c.textTertiary, fontSize: 12))])),
        Text(e.$3, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)),
      ]),
    );
  }
}
