import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../features/checkin/checkin_screen.dart';
import '../features/leaderboard/leaderboard_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/startup/presentation/portfolio_screen.dart';

/// Shell di navigazione — Fase 3: Today, Portfolio, Leaderboard, Profilo.
/// IndexedStack per evitare rebuild costosi.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _screens = [
    CheckinScreen(),
    PortfolioScreen(),
    LeaderboardScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: c.border)),
        ),
        child: BottomNavigationBar(
          currentIndex: _index,
          onTap: (i) => setState(() => _index = i),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.edit_note_rounded), label: 'Today'),
            BottomNavigationBarItem(icon: Icon(Icons.business_center_rounded), label: 'Portfolio'),
            BottomNavigationBarItem(icon: Icon(Icons.leaderboard_rounded), label: 'Leaderboard'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profilo'),
          ],
        ),
      ),
    );
  }
}
