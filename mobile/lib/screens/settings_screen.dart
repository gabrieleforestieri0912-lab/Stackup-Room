import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../state/room_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

/// Impostazioni: profilo, consenso IA, supporto, legale, esci.
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _name = TextEditingController();
  final _locality = TextEditingController();
  bool _filled = false;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _locality.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final state = context.read<RoomState>();
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _saving = true);
    try {
      await state.saveProfile({
        'name': _name.text.trim(),
        'locality': _locality.text.trim(),
      });
      messenger.showSnackBar(
        const SnackBar(content: Text('Profilo salvato')),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<RoomState>();
    final auth = context.read<AuthService>();
    final p = state.profile;

    if (!_filled) {
      _name.text = (p['name'] as String?) ?? '';
      _locality.text = (p['locality'] as String?) ?? '';
      _filled = true;
    }

    final aiConsent = p['ai_consent'] == true;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: RoomTheme.bg,
        foregroundColor: RoomTheme.text,
        title: const Text(
          'Impostazioni',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            kicker: 'Profilo',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _name,
                  style: const TextStyle(color: RoomTheme.text),
                  decoration: const InputDecoration(labelText: 'Nome'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _locality,
                  style: const TextStyle(color: RoomTheme.text),
                  decoration: const InputDecoration(
                    labelText: 'Dove ti trovi',
                    hintText: 'Milano, Lombardia, Italia',
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_saving ? 'Salvataggio…' : 'Salva profilo'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            kicker: 'Funzioni IA',
            child: SettingRow(
              icon: Icons.auto_awesome_outlined,
              title: 'Condividi contesto con il coach',
              desc:
                  'Invia dettagli startup, task e standup al provider AI quando usi il coach. Disattivando, il coach usa solo le risposte offline.',
              trailing: Switch(
                value: aiConsent,
                onChanged: (v) async {
                  final messenger = ScaffoldMessenger.of(context);
                  try {
                    await state.saveProfile({'ai_consent': v});
                  } catch (e) {
                    messenger.showSnackBar(
                        SnackBar(content: Text(e.toString())));
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            kicker: 'Supporto',
            child: Column(
              children: [
                SettingRow(
                  icon: Icons.mail_outline,
                  title: 'Scrivici',
                  desc: 'Domande, abbonamenti, qualsiasi cosa — al founder.',
                ),
                SettingRow(
                  icon: Icons.bug_report_outlined,
                  title: 'Segnala un bug',
                  desc: 'Due minuti ci aiutano a sistemarlo in fretta.',
                ),
                SettingRow(
                  icon: Icons.lightbulb_outline,
                  title: 'Richiedi una funzione',
                  desc: 'Dicci cosa costruire dopo.',
                ),
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'gabriele.forestieri0912@gmail.com',
                    style: TextStyle(color: RoomTheme.textFaint, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            kicker: 'Legale',
            child: Column(
              children: [
                SettingRow(
                  icon: Icons.description_outlined,
                  title: 'Termini di servizio',
                  desc: 'stackup-room.vercel.app/terms',
                ),
                SettingRow(
                  icon: Icons.shield_outlined,
                  title: 'Privacy policy',
                  desc: 'stackup-room.vercel.app/privacy',
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            kicker: 'Account',
            child: Column(
              children: [
                SettingRow(
                  icon: Icons.rocket_launch_outlined,
                  title: 'Builder — gratis',
                  desc: auth.user?.email ?? '',
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () => auth.logout(),
                  icon: const Icon(Icons.logout, size: 18, color: RoomTheme.danger),
                  label: const Text(
                    'Esci',
                    style: TextStyle(color: RoomTheme.danger),
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
