import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_client.dart';
import '../state/room_state.dart';
import '../theme.dart';
import 'club_screen.dart';
import 'coach_screen.dart';
import 'settings_screen.dart';
import 'today_screen.dart';
import 'you_screen.dart';

/// Contenitore con la navigazione in basso della Room:
/// Oggi · Club · Coach · Tu.
class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    // Carica profilo, startup e streak appena si entra nella Room.
    context.read<RoomState>().load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _index,
          children: const [
            TodayScreen(),
            ClubScreen(),
            CoachScreen(),
            YouScreen(),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.today_outlined), label: 'Oggi'),
          BottomNavigationBarItem(icon: Icon(Icons.forum_outlined), label: 'Club'),
          BottomNavigationBarItem(icon: Icon(Icons.auto_awesome), label: 'Coach'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Tu'),
        ],
      ),
      floatingActionButton: _index == 3
          ? FloatingActionButton(
              backgroundColor: RoomTheme.card,
              foregroundColor: RoomTheme.room,
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const SettingsScreen()),
              ),
              child: const Icon(Icons.settings_outlined),
            )
          : null,
    );
  }
}

/// Helper per mostrare errori come SnackBar.
void showApiError(BuildContext context, Object e) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(e.toString())));
}

ApiClient apiOf(BuildContext context) => context.read<ApiClient>();
