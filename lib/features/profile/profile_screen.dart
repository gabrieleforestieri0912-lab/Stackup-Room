import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/storage/hive_service.dart';
import '../../core/supabase/supabase_client.dart';
import '../../core/theme/app_colors.dart';
import '../../navigation/app_shell.dart';
import '../auth/auth_provider.dart';
import '../checkin/checkin_provider.dart';
import '../paywall/paywall_provider.dart';
import '../paywall/presentation/paywall_screen.dart';
import '../settings/presentation/settings_screen.dart';
import '../startup/domain/startup.dart';
import '../startup/startup_provider.dart';

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
    final paywall = ref.watch(paywallProvider);
    final startups = ref.watch(startupProvider);
    final streak = ref.watch(streakProvider);
    final badges = _badges(streak);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profilo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_rounded),
            tooltip: 'Impostazioni',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
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
          const SizedBox(height: 12),
          // Portfolio pubblico (Fase 7) — opt-in per progetto, privacy-first.
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(Icons.business_center_rounded, size: 14, color: c.accentSignal),
                const SizedBox(width: 6),
                Text('Portfolio pubblico', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 13)),
                const Spacer(),
                Text('${startups.items.where((s) => s.isPublic).length} pubblici su ${startups.items.length}', style: TextStyle(color: c.textTertiary, fontSize: 11)),
              ]),
              const SizedBox(height: 4),
              if (startups.items.isEmpty)
                Text('Nessun progetto — aggiungi dal tab Portfolio.', style: TextStyle(color: c.textSecondary, fontSize: 12))
              else
                for (final s in startups.items.take(3))
                  InkWell(
                    onTap: () => ref.read(startupProvider.notifier).setVisibility(s.id, !s.isPublic),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(children: [
                        Icon(s.isPublic ? Icons.public_rounded : Icons.lock_outline_rounded, size: 13, color: s.isPublic ? c.accentSignal : c.textTertiary),
                        const SizedBox(width: 6),
                        Expanded(child: Text('${s.name} • ${s.status.label}', style: TextStyle(color: c.textSecondary, fontSize: 12))),
                        Text(s.isPublic ? 'pubblico' : 'privato', style: TextStyle(color: s.isPublic ? c.accentSignal : c.textTertiary, fontSize: 10, fontWeight: FontWeight.w600)),
                      ]),
                    ),
                  ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => ref.read(shellIndexProvider.notifier).state = 1,
                child: const Text('Gestisci portfolio'),
              ),
            ]),
          ),
          const SizedBox(height: 12),
          // Badge streak
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Icon(Icons.emoji_events_rounded, size: 14, color: c.accentSignal), const SizedBox(width: 6), Text('Badge streak', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 13))]),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8, children: [for (final b in badges) Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), decoration: BoxDecoration(color: b.earned ? c.accentSignal.withValues(alpha: 0.15) : c.surfaceAlt, borderRadius: BorderRadius.circular(20), border: Border.all(color: b.earned ? c.accentSignal : c.border)), child: Text('${b.emoji} ${b.label}', style: TextStyle(color: b.earned ? c.accentSignal : c.textTertiary, fontSize: 11, fontWeight: b.earned ? FontWeight.w700 : FontWeight.w500)))]),
            ]),
          ),
          const SizedBox(height: 12),
          _Tile(icon: Icons.code_rounded, title: 'GitHub sync', subtitle: _githubSubtitle(profile), c: c, onTap: () => _githubSync(context, ref)),
          _Tile(icon: Icons.workspace_premium_rounded, title: paywall.hasMembership ? 'Membership attiva ✓' : 'Membership', subtitle: paywall.hasMembership ? 'Tier ${paywall.tier ?? "—"}' : 'Sblocca community + leaderboard + AI illimitato', c: c, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PaywallScreen()))),
          const SizedBox(height: 16),
          Text(
            auth.isAuthenticated
                ? 'ID: ${user?.id.substring(0, 8) ?? '—'}…  •  ${auth.needsOnboarding ? 'Onboarding da completare' : 'Onboarding completato'}'
                : 'Modalità ospite — accedi per sincronizzare il profilo.',
            style: TextStyle(color: c.textTertiary, fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  /// Sottotitolo tile GitHub — metadati denormalizzati su profiles (nessun token).
  String _githubSubtitle(Map<String, dynamic>? profile) {
    final login = profile?['github_login'] as String?;
    final contributions = profile?['github_contributions'] as int?;
    if (login == null || login.isEmpty) return 'Collega GitHub via OAuth — Edge Function github-sync';
    return '@$login • ${contributions ?? 0} attività (30gg)';
  }

  Future<void> _githubSync(BuildContext context, WidgetRef ref) async {
    final client = SupabaseService.clientOrNull;
    if (client == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Supabase non configurato — GitHub sync in modalità mock')));
      return;
    }
    try {
      // 1) OAuth: la Edge Function genera l'URL di autorizzazione.
      //    Client secret GitHub mai lato client (Supabase secrets).
      final authRes = await client.functions.invoke('github-sync', body: {'action': 'authorize'});
      final authData = authRes.data is Map ? authRes.data as Map : const {};
      final authorizeUrl = authData['authorize_url'] as String?;
      final connected = authData['connected'] == true;

      if (!connected && authorizeUrl != null && authorizeUrl.isNotEmpty) {
        final opened = await launchUrl(Uri.parse(authorizeUrl), mode: LaunchMode.externalApplication);
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(opened
              ? 'Autorizza Stackup Room su GitHub, poi torna qui e tocca di nuovo GitHub sync'
              : 'Impossibile aprire il browser — URL autorizzazione GitHub: $authorizeUrl'),
          duration: const Duration(seconds: 6),
        ));
        return;
      }

      // 2) Account già collegato (o OAuth non configurato) → sync attività.
      final res = await client.functions.invoke('github-sync', body: {'action': 'sync'});
      final data = res.data is Map ? res.data as Map : const {};
      final msg = data['message'] ?? res.data.toString();
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('GitHub: $msg')));
      // Aggiorna i metadati denormalizzati mostrati nel profilo (login/contributi).
      await ref.read(authProvider.notifier).refreshProfile();
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('GitHub sync errore: $e')));
    }
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

List<({String label, String emoji, bool earned})> _badges(int streak) => [
      (label: '3 giorni', emoji: '🔥', earned: streak >= 3),
      (label: '7 giorni', emoji: '🚀', earned: streak >= 7),
      (label: '30 giorni', emoji: '🏆', earned: streak >= 30),
    ];

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
