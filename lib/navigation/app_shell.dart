import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/breakpoints.dart';
import '../features/ai_coach/presentation/ai_coach_screen.dart';
import '../features/checkin/checkin_screen.dart';
import '../features/community/presentation/community_screen.dart';
import '../features/leaderboard/leaderboard_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/startup/presentation/portfolio_screen.dart';

/// Tab attivo della shell — esposto come provider così le feature interne
/// (es. Profilo → "Gestisci portfolio") possono cambiare tab senza callback.
final shellIndexProvider = StateProvider<int>((ref) => 0);

/// Shell di navigazione — responsive: BottomNavigationBar su mobile,
/// NavigationRail su desktop (≥900px) con sidebar.
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

  static const _destinations = <NavigationRailDestination>[
    NavigationRailDestination(
      icon: Icon(Icons.edit_note_rounded),
      selectedIcon: Icon(Icons.edit_note_rounded),
      label: Text('Today'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.business_center_rounded),
      selectedIcon: Icon(Icons.business_center_rounded),
      label: Text('Portfolio'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.leaderboard_rounded),
      selectedIcon: Icon(Icons.leaderboard_rounded),
      label: Text('Leaderboard'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.smart_toy_rounded),
      selectedIcon: Icon(Icons.smart_toy_rounded),
      label: Text('AI Coach'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.forum_rounded),
      selectedIcon: Icon(Icons.forum_rounded),
      label: Text('Community'),
    ),
    NavigationRailDestination(
      icon: Icon(Icons.person_rounded),
      selectedIcon: Icon(Icons.person_rounded),
      label: Text('Profilo'),
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final index = ref.watch(shellIndexProvider);
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isDesktop = Breakpoints.isDesktop(screenWidth);

    if (isDesktop) {
      return _DesktopLayout(
        index: index,
        c: c,
        onIndexChanged: (i) => ref.read(shellIndexProvider.notifier).state = i,
      );
    }

    return _MobileLayout(
      index: index,
      c: c,
      onIndexChanged: (i) => ref.read(shellIndexProvider.notifier).state = i,
    );
  }
}

/// Layout desktop: NavigationRail a sinistra + contenuto principale.
/// La sidebar è sempre visibile su schermi ≥900px.
class _DesktopLayout extends StatelessWidget {
  const _DesktopLayout({
    required this.index,
    required this.c,
    required this.onIndexChanged,
  });

  final int index;
  final AppColors c;
  final ValueChanged<int> onIndexChanged;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: [
          // Sidebar NavigationRail
          Container(
            decoration: BoxDecoration(
              color: c.surface,
              border: Border(right: BorderSide(color: c.border)),
            ),
            child: NavigationRail(
              selectedIndex: index,
              onDestinationSelected: onIndexChanged,
              backgroundColor: c.surface,
              selectedIconTheme: IconThemeData(color: c.accentSignal),
              unselectedIconTheme: IconThemeData(color: c.textTertiary),
              selectedLabelTextStyle: TextStyle(
                color: c.accentSignal,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
              unselectedLabelTextStyle: TextStyle(
                color: c.textTertiary,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
              indicatorColor: c.accentSignal.withValues(alpha: 0.15),
              leading: Padding(
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Column(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: c.accentSignal.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(Icons.bolt_rounded, color: c.accentSignal, size: 20),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'SR',
                      style: TextStyle(
                        color: c.text,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              labelType: NavigationRailLabelType.all,
              destinations: AppShell._destinations,
            ),
          ),
          // Contenuto principale
          Expanded(
            child: IndexedStack(
              index: index,
              children: AppShell._screens,
            ),
          ),
        ],
      ),
    );
  }
}

/// Layout mobile: contenuto + BottomNavigationBar in basso.
class _MobileLayout extends StatelessWidget {
  const _MobileLayout({
    required this.index,
    required this.c,
    required this.onIndexChanged,
  });

  final int index;
  final AppColors c;
  final ValueChanged<int> onIndexChanged;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: index,
        children: AppShell._screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: c.border)),
        ),
        child: BottomNavigationBar(
          currentIndex: index,
          onTap: onIndexChanged,
          backgroundColor: c.surface,
          selectedItemColor: c.accentSignal,
          unselectedItemColor: c.textTertiary,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
          type: BottomNavigationBarType.fixed,
          elevation: 0,
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
