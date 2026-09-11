import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Leaderboard — placeholder v0 (VIEW Postgres Giorno 5).
class LeaderboardScreen extends StatelessWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;

    final mock = [
      ('acme', 'Acme AI', '€12.4k', 7),
      ('vertex', 'Vertex', '€8.1k', 5),
      ('stackup', 'StackUp Room', '—', 1),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: mock.length + 1,
        separatorBuilder: (context, index) => const SizedBox(height: 8),
        itemBuilder: (context, i) {
          if (i == 0) {
            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: c.primaryMuted,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.verified_rounded, size: 16, color: c.primaryLight),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Solo revenue verificata scala la classifica. Collega Stripe per comparire.',
                      style: TextStyle(color: c.primaryLight, fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            );
          }
          final e = mock[i - 1];
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: c.border),
            ),
            child: Row(
              children: [
                Text('#$i', style: TextStyle(color: c.textTertiary, fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(width: 12),
                CircleAvatar(
                  radius: 18,
                  backgroundColor: c.surfaceAlt,
                  child: Text(e.$1[0].toUpperCase(), style: TextStyle(color: c.textSecondary, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.$2, style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: 14)),
                      Text('@${e.$1}  •  streak ${e.$4}🔥', style: TextStyle(color: c.textTertiary, fontSize: 12)),
                    ],
                  ),
                ),
                Text(e.$3, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)),
              ],
            ),
          );
        },
      ),
    );
  }
}
