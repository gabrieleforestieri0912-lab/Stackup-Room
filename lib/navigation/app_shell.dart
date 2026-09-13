import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_colors.dart';
import '../features/ai_coach/presentation/ai_coach_screen.dart';
import '../features/checkin/checkin_screen.dart';
import '../features/community/presentation/community_screen.dart';
import '../features/leaderboard/leaderboard_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/startup/presentation/portfolio_screen.dart';

/// Tab attivo della shell — esposto come provider così le feature interne
/// (es. Profilo → "Gestisci portfolio") possono cambiare tab senza callback.
final shellIndexProvider = StateProvider<int>((ref) => 0);

/// Shell di navigazione — Fase 3: Today, Portfolio, Leaderboard, Profilo.
/// IndexedStack per evitare rebuild costosi.
class AppShell extends ConsumerWidget {
  const AppShell({super.key});

  static const _screens = [
    CheckinScreen(),
    PortfolioScreen(),
    LeaderboardScreen(),
    AiCoachScreen(),
    CommunityScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final index = ref.watch(shellIndexProvider);
    return Scaffold(
      body: IndexedStack(index: index, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: c.border)),
        ),
        child: BottomNavigationBar(
          currentIndex: index,
          onTap: (i) => ref.read(shellIndexProvider.notifier).state = i,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.edit_note_rounded), label: 'Today'),
            BottomNavigationBarItem(icon: Icon(Icons.business_center_rounded), label: 'Portfolio'),
            BottomNavigationBarItem(icon: Icon(Icons.leaderboard_rounded), label: 'Leaderboard'),
            BottomNavigationBarItem(icon: Icon(Icons.smart_toy_rounded), label: 'AI Coach'),
            BottomNavigationBarItem(icon: Icon(Icons.forum_rounded), label: 'Community'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profilo'),
          ],
        ),
      ),
    );
  }
}
