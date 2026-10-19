import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_client.dart';
import '../state/room_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'settings_screen.dart';

/// Sezione "Tu": profilo, startup, streak e contributi GitHub.
class YouScreen extends StatefulWidget {
  const YouScreen({super.key});

  @override
  State<YouScreen> createState() => _YouScreenState();
}

class _YouScreenState extends State<YouScreen> {
  int _ghTotal = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadGithub());
  }

  Future<void> _loadGithub() async {
    try {
      final api = context.read<ApiClient>();
      final j = await api.get('/api/room/github');
      final series = (j['series'] as List? ?? []).whereType<Map<String, dynamic>>();
      final total = series.fold<int>(0, (a, x) => a + ((x['count'] as num?)?.toInt() ?? 0));
      if (mounted) setState(() => _ghTotal = total);
    } catch (_) {
      // sezione non critica
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<RoomState>();
    final p = state.profile;

    return RefreshIndicator(
      color: RoomTheme.room,
      onRefresh: () => Future.wait([state.load(), _loadGithub()]),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Tu',
                  style: TextStyle(
                    color: RoomTheme.text,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.settings_outlined,
                    color: RoomTheme.textDim),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(builder: (_) => const SettingsScreen()),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Profilo
          SectionCard(
            kicker: 'Profilo',
            child: Row(
              children: [
                _Avatar(url: p['avatar_url'] as String?, name: state.displayName),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        state.displayName,
                        style: const TextStyle(
                          color: RoomTheme.text,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      if (p['handle'] != null)
                        Text(
                          '@${p['handle']}',
                          style: const TextStyle(
                              color: RoomTheme.room, fontSize: 12),
                        ),
                      if (p['locality'] != null)
                        Text(
                          p['locality'].toString(),
                          style: const TextStyle(
                              color: RoomTheme.textFaint, fontSize: 12),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Numeri
          SectionCard(
            kicker: 'I tuoi numeri',
            child: Column(
              children: [
                _StatRow(
                  icon: Icons.local_fire_department,
                  label: 'Streak di shipping',
                  value: '${state.streak.current} giorni',
                ),
                _StatRow(
                  icon: Icons.emoji_events_outlined,
                  label: 'Record',
                  value: '${state.streak.longest} giorni',
                ),
                _StatRow(
                  icon: Icons.code,
                  label: 'Contributi GitHub (365 gg)',
                  value: _ghTotal > 0 ? '$_ghTotal' : '—',
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Startup
          SectionCard(
            kicker: 'Le tue startup',
            child: state.startups.isEmpty
                ? const EmptyState(
                    icon: Icons.rocket_launch_outlined,
                    text: 'Nessuna startup. Aggiungila dalla web app.',
                  )
                : Column(
                    children: [
                      for (final s in state.startups)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Row(
                            children: [
                              _StartupLogo(url: s.logoUrl, name: s.name),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s.name,
                                      style: const TextStyle(
                                        color: RoomTheme.text,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                      ),
                                    ),
                                    if (s.tagline != null)
                                      Text(
                                        s.tagline!,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                            color: RoomTheme.textFaint,
                                            fontSize: 12),
                                      ),
                                  ],
                                ),
                              ),
                              Text(
                                s.stage.toUpperCase(),
                                style: const TextStyle(
                                  color: RoomTheme.room,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: RoomTheme.room, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(color: RoomTheme.text, fontSize: 13.5),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: RoomTheme.text,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({this.url, required this.name});
  final String? url;
  final String name;

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.isNotEmpty) {
      return CircleAvatar(
        radius: 26,
        backgroundColor: RoomTheme.surface,
        foregroundImage: NetworkImage(url!),
        onForegroundImageError: (_, __) {},
      );
    }
    return CircleAvatar(
      radius: 26,
      backgroundColor: RoomTheme.room.withValues(alpha: 0.2),
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
            color: RoomTheme.room, fontWeight: FontWeight.w900),
      ),
    );
  }
}

class _StartupLogo extends StatelessWidget {
  const _StartupLogo({this.url, required this.name});
  final String? url;
  final String name;

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.network(
          url!,
          width: 40,
          height: 40,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => _letter(),
        ),
      );
    }
    return _letter();
  }

  Widget _letter() => Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: RoomTheme.room.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: const TextStyle(
              color: RoomTheme.room, fontWeight: FontWeight.w900),
        ),
      );
}
