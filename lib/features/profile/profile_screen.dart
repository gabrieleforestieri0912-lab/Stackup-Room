import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/supabase/supabase_client.dart';
import '../../core/theme/app_colors.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final user = SupabaseService.authOrNull?.currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('Profilo')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: c.primaryMuted,
                  child: Icon(Icons.person_rounded, color: c.primaryLight, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.email ?? 'Ospite — non autenticato',
                          style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)),
                      const SizedBox(height: 2),
                      Text(
                        SupabaseService.isInitialized ? 'Supabase connesso' : 'Modalità offline (configura .env)',
                        style: TextStyle(
                          color: SupabaseService.isInitialized ? c.success : c.warning,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _Tile(icon: Icons.link_rounded, title: 'Collega startup', subtitle: 'Giorno 3 — placeholder v0', c: c),
          _Tile(icon: Icons.notifications_rounded, title: 'Promemoria 9:00', subtitle: 'Notifiche locali — Giorno 2', c: c),
          _Tile(icon: Icons.dark_mode_rounded, title: 'Tema', subtitle: 'Dark di default (club esclusivo)', c: c),
          const SizedBox(height: 12),
          Text(
            'v0 — Fase 3 completata. Auth/onboarding Giorno 2, check-in Giorno 4.',
            style: TextStyle(color: c.textTertiary, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.title, required this.subtitle, required this.c});
  final IconData icon;
  final String title;
  final String subtitle;
  final AppColors c;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.border),
      ),
      child: Material(
        color: c.surface,
        borderRadius: BorderRadius.circular(12),
        child: ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          leading: Icon(icon, color: c.textSecondary),
          title: Text(title, style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text(subtitle, style: TextStyle(color: c.textTertiary, fontSize: 12)),
          trailing: Icon(Icons.chevron_right_rounded, color: c.textTertiary),
          onTap: () {},
        ),
      ),
    );
  }
}
