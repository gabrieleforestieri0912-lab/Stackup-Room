// ignore_for_file: unnecessary_underscores

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/two_pane_layout.dart';
import '../domain/startup.dart';
import '../startup_provider.dart';
import 'startup_card.dart';
import 'startup_detail_sheet.dart';

class PortfolioScreen extends ConsumerWidget {
  const PortfolioScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final state = ref.watch(startupProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Portfolio'), actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: () => ref.read(startupProvider.notifier).refresh())]),
      // Desktop ≥900px: lista a sinistra + dettaglio a destra.
      body: TwoPaneLayout(
        secondaryWidth: 380,
        bodyBuilder: (context, isDesktop) => _ListPane(c: c, state: state, isDesktop: isDesktop),
        secondary: _DetailPane(c: c, state: state),
      ),
      floatingActionButton: FloatingActionButton.extended(onPressed: () => _showAdd(context, ref), label: const Text('Nuova startup'), icon: const Icon(Icons.add_rounded)),
    );
  }

  void _showAdd(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final webCtrl = TextEditingController();
    StartupStatus status = StartupStatus.idea;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) {
          final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
          return SafeArea(
            child: Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 20, right: 20, top: 20),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Container(width: 36, height: 4, decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(2)), alignment: Alignment.center),
                const SizedBox(height: 16),
                Text('Nuova startup', style: TextStyle(color: c.text, fontWeight: FontWeight.w800, fontSize: 18)),
                const SizedBox(height: 12),
                TextField(controller: nameCtrl, autofocus: true, decoration: const InputDecoration(labelText: 'Nome *', hintText: 'Es. Acme AI', prefixIcon: Icon(Icons.rocket_launch_rounded))),
                const SizedBox(height: 10),
                DropdownButtonFormField<StartupStatus>(initialValue: status, decoration: const InputDecoration(labelText: 'Stato'), items: StartupStatus.values.map((s) => DropdownMenuItem(value: s, child: Text(s.label))).toList(), onChanged: (v) => setS(() => status = v ?? status)),
                const SizedBox(height: 10),
                TextField(controller: descCtrl, maxLength: 280, maxLines: 2, decoration: const InputDecoration(labelText: 'Descrizione (opzionale, 280)', prefixIcon: Icon(Icons.short_text_rounded))),
                const SizedBox(height: 10),
                TextField(controller: webCtrl, decoration: const InputDecoration(labelText: 'Website (opzionale)', prefixIcon: Icon(Icons.link_rounded))),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    final name = nameCtrl.text.trim();
                    if (name.length < 2) {
                      ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Nome minimo 2 caratteri')));
                      return;
                    }
                    final s = await ref.read(startupProvider.notifier).create(name: name, status: status, description: descCtrl.text.isEmpty ? null : descCtrl.text, website: webCtrl.text.isEmpty ? null : webCtrl.text);
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (s != null && context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Startup “${s.name}” creata')));
                  },
                  child: const Text('Crea'),
                ),
                const SizedBox(height: 12),
              ]),
            ),
          );
        },
      ),
    );
  }
}

class _ListPane extends ConsumerWidget {
  const _ListPane({required this.c, required this.state, required this.isDesktop});
  final AppColors c;
  final StartupState state;
  final bool isDesktop;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (state.isLoading && state.items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state.items.isEmpty) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: c.border)),
            child: Column(children: [
              Container(width: 56, height: 56, decoration: BoxDecoration(color: c.surfaceAlt, borderRadius: BorderRadius.circular(16)), child: Icon(Icons.business_center_outlined, color: c.textTertiary)),
              const SizedBox(height: 12),
              Text('Nessuna startup ancora', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 4),
              Text('Aggiungi la tua prima startup per organizzare task, note e metriche.', textAlign: TextAlign.center, style: TextStyle(color: c.textSecondary, fontSize: 12, height: 1.4)),
              const SizedBox(height: 12),
              Text('Stato: idea → in sviluppo → lanciata', style: TextStyle(color: c.textTertiary, fontSize: 11)),
            ]),
          ),
        ],
      );
    }
    return RefreshIndicator(
      onRefresh: () => ref.read(startupProvider.notifier).refresh(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: state.items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, i) {
          final s = state.items[i];
          final sel = state.selectedId == s.id;
          return StartupCard(
            startup: s,
            selected: sel,
            onTap: () {
              if (isDesktop) {
                ref.read(startupProvider.notifier).setSelected(s.id);
              } else {
                showModalBottomSheet(context: context, isScrollControlled: true, shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))), builder: (_) => StartupDetailSheet(startup: s));
              }
            },
          );
        },
      ),
    );
  }
}

class _DetailPane extends ConsumerWidget {
  const _DetailPane({required this.c, required this.state});
  final AppColors c;
  final StartupState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sel = state.selected;
    if (sel == null) {
      return Center(child: Padding(padding: const EdgeInsets.all(24), child: Text('Seleziona una startup a sinistra per vederne dettaglio, task associati e note.', textAlign: TextAlign.center, style: TextStyle(color: c.textTertiary, fontSize: 12))));
    }
    return StartupDetailSheet(startup: sel);
  }
}
