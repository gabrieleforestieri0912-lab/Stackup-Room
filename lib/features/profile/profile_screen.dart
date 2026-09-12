import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/notifications/notification_service.dart';
import '../../core/storage/hive_service.dart';
import '../../core/supabase/supabase_client.dart';
import '../../core/theme/app_colors.dart';
import '../auth/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final auth = ref.watch(authProvider);
    final user = auth.user ?? SupabaseService.authOrNull?.currentUser;
    final profile = auth.profile;

    final displayName = (profile?['display_name'] as String?) ?? HiveService.onboardingDisplayName ?? user?.email?.split('@').first ?? 'Ospite';
    final avatarUrl = (profile?['avatar_url'] as String?) ?? HiveService.onboardingAvatarUrl;
    final startupName = (profile?['startup_name'] as String?) ?? HiveService.onboardingStartupName;
    final oneLiner = (profile?['one_liner'] as String?) ?? HiveService.onboardingOneLiner;
    final reminderHour = HiveService.reminderHour;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profilo'),
        actions: [
          if (auth.isAuthenticated)
            IconButton(
              icon: const Icon(Icons.logout_rounded),
              tooltip: 'Logout',
              onPressed: () => _confirmLogout(context, ref),
            ),
        ],
      ),
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
                _Avatar(avatarUrl: avatarUrl, c: c),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(displayName,
                          style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 2),
                      Text(user?.email ?? 'Ospite — non autenticato',
                          style: TextStyle(color: c.textSecondary, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(
                        auth.isAuthenticated
                            ? (auth.needsOnboarding ? 'Onboarding incompleto' : 'Profilo attivo ✓')
                            : (SupabaseService.isInitialized ? 'Non autenticato' : 'Modalità offline'),
                        style: TextStyle(
                          color: auth.isAuthenticated
                              ? (auth.needsOnboarding ? c.warning : c.success)
                              : c.textTertiary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (startupName != null || oneLiner != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: c.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (startupName != null)
                    Row(
                      children: [
                        Icon(Icons.rocket_launch_rounded, size: 14, color: c.primary),
                        const SizedBox(width: 6),
                        Text(startupName, style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: 13)),
                      ],
                    ),
                  if (startupName != null && oneLiner != null) const SizedBox(height: 6),
                  if (oneLiner != null)
                    Text(oneLiner, style: TextStyle(color: c.textSecondary, fontSize: 12, height: 1.4)),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          _Tile(
            icon: Icons.link_rounded,
            title: 'Collega startup',
            subtitle: startupName ?? 'Giorno 3 — placeholder v0',
            c: c,
            onTap: () {},
          ),
          _Tile(
            icon: Icons.notifications_rounded,
            title: 'Promemoria ${reminderHour.toString().padLeft(2, '0')}:00',
            subtitle: 'Tocca per cambiare orario',
            c: c,
            onTap: () => _showReminderPicker(context, ref),
          ),
          _Tile(
            icon: Icons.dark_mode_rounded,
            title: 'Tema',
            subtitle: 'Dark di default (club esclusivo)',
            c: c,
            onTap: () {},
          ),
          if (auth.isAuthenticated) ...[
            const SizedBox(height: 16),
            SizedBox(
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () => _confirmLogout(context, ref),
                icon: const Icon(Icons.logout_rounded, size: 18),
                label: const Text('Logout'),
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: c.error.withValues(alpha: 0.5)),
                  foregroundColor: c.error,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Text(
            auth.isAuthenticated
                ? 'ID: ${user?.id.substring(0, 8) ?? '—'}…  •  ${auth.needsOnboarding ? 'Onboarding da completare' : 'Onboarding completato'}'
                : 'v0 — Giorno 1. Giorno 2: auth + onboarding.',
            style: TextStyle(color: c.textTertiary, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout?'),
        content: const Text('Verrai riportato alla schermata di accesso.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annulla')),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).signOut();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Logout effettuato')));
              }
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  void _showReminderPicker(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    int hour = HiveService.reminderHour;
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 36, height: 4, decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 16),
                Text('Orario promemoria', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      onPressed: () => setSheetState(() => hour = (hour - 1).clamp(0, 23)),
                      icon: Icon(Icons.remove_circle_outline_rounded, color: c.primary),
                    ),
                    Container(
                      width: 96,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(12)),
                      child: Text('${hour.toString().padLeft(2, '0')}:00',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: c.primaryLight, fontSize: 20, fontWeight: FontWeight.w800)),
                    ),
                    IconButton(
                      onPressed: () => setSheetState(() => hour = (hour + 1).clamp(0, 23)),
                      icon: Icon(Icons.add_circle_outline_rounded, color: c.primary),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () async {
                      await HiveService.setReminderHour(hour);
                      // Aggiorna anche Supabase se autenticato (reminder_hour non è in profiles Giorno 2, ma Hive basta per MVP)
                      try {
                        await NotificationService.scheduleDailyReminder(hour: hour);
                      } catch (_) {}
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Promemoria impostato alle ${hour.toString().padLeft(2, '0')}:00')));
                      }
                    },
                    child: const Text('Salva'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({this.avatarUrl, required this.c});
  final String? avatarUrl;
  final AppColors c;

  @override
  Widget build(BuildContext context) {
    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 28,
        backgroundColor: c.primaryMuted,
        backgroundImage: NetworkImage(avatarUrl!),
        // ignore: unnecessary_underscores
        onBackgroundImageError: (_, __) {},
        child: avatarUrl!.isEmpty ? Icon(Icons.person_rounded, color: c.primaryLight, size: 28) : null,
      );
    }
    return CircleAvatar(
      radius: 28,
      backgroundColor: c.primaryMuted,
      child: Icon(Icons.person_rounded, color: c.primaryLight, size: 28),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.title, required this.subtitle, required this.c, this.onTap});
  final IconData icon;
  final String title;
  final String subtitle;
  final AppColors c;
  final VoidCallback? onTap;

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
          onTap: onTap,
        ),
      ),
    );
  }
}
