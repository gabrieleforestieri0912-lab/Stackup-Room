import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/notifications/notification_service.dart';
import '../../../core/storage/hive_service.dart';
import '../../../core/sync/outbox_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/auth_provider.dart';
import '../../leaderboard/leaderboard_provider.dart';
import '../../paywall/paywall_provider.dart';
import '../../paywall/presentation/paywall_screen.dart';

/// Settings (Fase 8) — account, notifiche, privacy metriche, abbonamento, sync.
///
/// L'abbonamento si gestisce SOLO tramite lo store (deep link a App Store /
/// Play Store subscription settings, o `managementURL` di RevenueCat):
/// nessun flow di cancellazione custom, come richiesto da Apple/Google.
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _notifGranted = false;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _checkPermission();
  }

  Future<void> _checkPermission() async {
    final granted = await NotificationService.hasPermission();
    if (mounted) setState(() => _notifGranted = granted);
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final auth = ref.watch(authProvider);
    final paywall = ref.watch(paywallProvider);
    final optIn = ref.watch(leaderboardProvider).optIn;
    final pendingSync = ref.watch(outboxPendingProvider);

    final displayName = (auth.profile?['display_name'] as String?) ?? HiveService.onboardingDisplayName ?? 'Founder';
    final email = auth.user?.email ?? 'Ospite — non autenticato';
    final reminderHour = HiveService.reminderHour;

    return Scaffold(
      appBar: AppBar(title: const Text('Impostazioni')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _SectionTitle('Account', c: c),
          _Tile(icon: Icons.person_rounded, title: displayName, subtitle: email, c: c),
          if (auth.isAuthenticated)
            _Tile(
              icon: Icons.logout_rounded,
              title: 'Esci',
              subtitle: 'Termina la sessione su questo dispositivo',
              c: c,
              danger: true,
              onTap: () => _confirmLogout(),
            ),

          _SectionTitle('Notifiche', c: c),
          _Tile(
            icon: _notifGranted ? Icons.notifications_active_rounded : Icons.notifications_off_rounded,
            title: _notifGranted ? 'Notifiche attive' : 'Notifiche disattivate',
            subtitle: _notifGranted ? 'Promemoria giornaliero abilitato' : 'Tocca per concedere il permesso',
            c: c,
            onTap: () async {
              if (_notifGranted) {
                await NotificationService.openSettings();
              } else {
                await NotificationService.requestPermission();
                await _checkPermission();
                await NotificationService.scheduleDailyReminder(hour: HiveService.reminderHour);
              }
            },
          ),
          _Tile(
            icon: Icons.schedule_rounded,
            title: 'Promemoria ${reminderHour.toString().padLeft(2, '0')}:00',
            subtitle: 'Tocca per cambiare orario',
            c: c,
            onTap: _showReminderPicker,
          ),

          _SectionTitle('Privacy metriche', c: c),
          _SwitchTile(
            c: c,
            title: 'Mostra il mio MRR',
            subtitle: 'Revenue verificata in classifica e portfolio pubblico',
            value: optIn?['show_mrr'] as bool? ?? true,
            onChanged: (v) => ref.read(leaderboardProvider.notifier).setOptIn(showMrr: v),
          ),
          _SwitchTile(
            c: c,
            title: 'Mostra attività GitHub',
            subtitle: 'Contributi degli ultimi 30 giorni',
            value: optIn?['show_github'] as bool? ?? false,
            onChanged: (v) => ref.read(leaderboardProvider.notifier).setOptIn(showGithub: v),
          ),
          _SwitchTile(
            c: c,
            title: 'Mostra la streak',
            subtitle: 'Giorni consecutivi di check-in',
            value: optIn?['show_streak'] as bool? ?? true,
            onChanged: (v) => ref.read(leaderboardProvider.notifier).setOptIn(showStreak: v),
          ),

          _SectionTitle('Abbonamento', c: c),
          _Tile(
            icon: Icons.workspace_premium_rounded,
            title: paywall.hasMembership ? 'Membership attiva' : 'Nessuna membership',
            subtitle: paywall.hasMembership ? 'Tier ${paywall.tier ?? '—'}' : 'Community, leaderboard comparativa, AI illimitato',
            c: c,
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PaywallScreen())),
          ),
          _Tile(
            icon: Icons.settings_suggest_rounded,
            title: 'Gestisci abbonamento',
            subtitle: 'Si aprono le impostazioni dello store (nessuna cancellazione in-app)',
            c: c,
            onTap: _manageSubscription,
          ),
          _Tile(
            icon: Icons.restore_rounded,
            title: 'Ripristina acquisti',
            subtitle: 'Recupera una membership già acquistata',
            c: c,
            onTap: () async {
              await ref.read(paywallProvider.notifier).restore();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ripristino completato')));
              }
            },
          ),

          _SectionTitle('Sincronizzazione', c: c),
          _Tile(
            icon: Icons.cloud_sync_rounded,
            title: 'Dati in attesa',
            subtitle: pendingSync.when(
              data: (n) => n == 0 ? 'Tutto sincronizzato' : '$n operazioni da inviare',
              loading: () => 'Verifica in corso…',
              error: (e, s) => 'Stato non disponibile',
            ),
            c: c,
            onTap: _syncing ? null : _syncNow,
            trailing: _syncing
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : pendingSync.maybeWhen(data: (n) => n > 0 ? _Pill(text: '$n', color: c.accentSignal) : null, orElse: () => null),
          ),

          const SizedBox(height: 20),
          Text('Stackup Room • Fase 8', textAlign: TextAlign.center, style: TextStyle(color: c.textTertiary, fontSize: 11)),
        ],
      ),
    );
  }

  Future<void> _syncNow() async {
    setState(() => _syncing = true);
    final res = await OutboxService.flush();
    ref.invalidate(outboxPendingProvider);
    if (!mounted) return;
    setState(() => _syncing = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(res.pending == 0
          ? (res.sent == 0 ? 'Niente da sincronizzare' : '${res.sent} operazioni sincronizzate')
          : 'Offline — ${res.pending} operazioni restano in coda'),
    ));
  }

  Future<void> _manageSubscription() async {
    // RevenueCat fornisce l'URL di gestione dello store quando disponibile.
    final managementUrl = ref.read(paywallProvider).customerInfo?.managementURL;
    final fallback = defaultTargetPlatform == TargetPlatform.iOS
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    final target = managementUrl ?? fallback;
    final ok = await launchUrl(Uri.parse(target), mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Impossibile aprire lo store — $target')));
    }
  }

  void _confirmLogout() {
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
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }

  void _showReminderPicker() {
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
                    IconButton(onPressed: () => setSheetState(() => hour = (hour - 1).clamp(0, 23)), icon: Icon(Icons.remove_circle_outline_rounded, color: c.primary)),
                    Container(
                      width: 96,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(12)),
                      child: Text('${hour.toString().padLeft(2, '0')}:00', textAlign: TextAlign.center, style: TextStyle(color: c.primaryLight, fontSize: 20, fontWeight: FontWeight.w800)),
                    ),
                    IconButton(onPressed: () => setSheetState(() => hour = (hour + 1).clamp(0, 23)), icon: Icon(Icons.add_circle_outline_rounded, color: c.primary)),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () async {
                      await HiveService.setReminderHour(hour);
                      try {
                        await NotificationService.scheduleDailyReminder(hour: hour);
                      } catch (_) {}
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (mounted) setState(() {});
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

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.label, {required this.c});
  final String label;
  final AppColors c;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 18, 4, 8),
        child: Text(label.toUpperCase(), style: TextStyle(color: c.textTertiary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8)),
      );
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, required this.color});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withValues(alpha: 0.4))),
        child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w800)),
      );
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.title, required this.subtitle, required this.c, this.onTap, this.trailing, this.danger = false});
  final IconData icon;
  final String title;
  final String subtitle;
  final AppColors c;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: danger ? c.error.withValues(alpha: 0.4) : c.border)),
      child: Material(
        color: c.surface,
        borderRadius: BorderRadius.circular(12),
        child: ListTile(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          leading: Icon(icon, color: danger ? c.error : c.textSecondary),
          title: Text(title, style: TextStyle(color: danger ? c.error : c.text, fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text(subtitle, style: TextStyle(color: c.textTertiary, fontSize: 12)),
          trailing: trailing ?? (onTap == null ? null : Icon(Icons.chevron_right_rounded, color: c.textTertiary)),
          onTap: onTap,
        ),
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({required this.c, required this.title, required this.subtitle, required this.value, required this.onChanged});
  final AppColors c;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)),
      child: Material(
        color: c.surface,
        borderRadius: BorderRadius.circular(12),
        child: SwitchListTile.adaptive(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          value: value,
          onChanged: onChanged,
          title: Text(title, style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text(subtitle, style: TextStyle(color: c.textTertiary, fontSize: 12)),
        ),
      ),
    );
  }
}
