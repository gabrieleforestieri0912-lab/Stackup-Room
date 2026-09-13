import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/startup.dart';
import '../startup_provider.dart';

/// Switcher rapido progetto in Home Today — dropdown / bottom sheet
/// Filtra Todo per singolo progetto o "tutti"
class ProjectSwitcher extends ConsumerWidget {
  const ProjectSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final startups = ref.watch(startupProvider);
    final selected = startups.selected;
    return InkWell(
      onTap: () => _showSheet(context, ref),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(color: c.surfaceAlt, borderRadius: BorderRadius.circular(20), border: Border.all(color: selected != null ? c.accentSignal.withValues(alpha: 0.5) : c.border)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.filter_alt_rounded, size: 14, color: selected != null ? c.accentSignal : c.textTertiary),
          const SizedBox(width: 6),
          Text(selected?.name ?? 'Tutti i progetti', style: TextStyle(color: selected != null ? c.text : c.textSecondary, fontWeight: FontWeight.w600, fontSize: 12)),
          const SizedBox(width: 4),
          Icon(Icons.expand_more_rounded, size: 14, color: c.textTertiary),
        ]),
      ),
    );
  }

  void _showSheet(BuildContext context, WidgetRef ref) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final state = ref.read(startupProvider);
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Container(width: 36, height: 4, decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(2)), alignment: Alignment.center),
            const SizedBox(height: 12),
            Text('Filtra per progetto', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 12),
            ListTile(
              leading: Icon(Icons.apps_rounded, color: state.selectedId == null ? c.accentSignal : c.textTertiary),
              title: Text('Tutti i progetti', style: TextStyle(color: state.selectedId == null ? c.text : c.textSecondary, fontWeight: state.selectedId == null ? FontWeight.w700 : FontWeight.w500)),
              trailing: state.selectedId == null ? Icon(Icons.check_rounded, color: c.accentSignal) : null,
              onTap: () {
                ref.read(startupProvider.notifier).setSelected(null);
                Navigator.pop(ctx);
              },
            ),
            for (final s in state.items)
              ListTile(
                leading: Icon(Icons.rocket_launch_rounded, color: state.selectedId == s.id ? c.accentSignal : c.textTertiary, size: 18),
                title: Text(s.name, style: TextStyle(color: state.selectedId == s.id ? c.text : c.textSecondary, fontWeight: state.selectedId == s.id ? FontWeight.w700 : FontWeight.w500, fontSize: 14)),
                subtitle: Text(s.status.label, style: TextStyle(color: c.textTertiary, fontSize: 11)),
                trailing: state.selectedId == s.id ? Icon(Icons.check_rounded, color: c.accentSignal) : null,
                onTap: () {
                  ref.read(startupProvider.notifier).setSelected(s.id);
                  Navigator.pop(ctx);
                },
              ),
            if (state.items.isEmpty) Padding(padding: const EdgeInsets.all(12), child: Text('Nessun progetto — creane uno dal Portfolio.', style: TextStyle(color: c.textTertiary, fontSize: 12))),
          ]),
        ),
      ),
    );
  }
}
