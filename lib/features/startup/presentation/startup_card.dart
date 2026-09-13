import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/startup.dart';

class StartupCard extends StatelessWidget {
  const StartupCard({super.key, required this.startup, this.onTap, this.selected = false});
  final Startup startup;
  final VoidCallback? onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final statusColor = switch (startup.status) {
      StartupStatus.idea => c.textTertiary,
      StartupStatus.inSviluppo => c.accentSignal,
      StartupStatus.lanciata => c.success,
    };
    return RepaintBoundary(
      child: Material(
        color: selected ? c.primaryMuted.withValues(alpha: 0.6) : c.surface,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: selected ? c.accentSignal.withValues(alpha: 0.5) : c.border)),
            child: Row(children: [
              Container(width: 40, height: 40, decoration: BoxDecoration(color: c.surfaceAlt, borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)), child: Icon(Icons.rocket_launch_rounded, size: 18, color: statusColor)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(startup.name, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 2),
                  Row(children: [
                    Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)), child: Text(startup.status.label, style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.3))),
                    const SizedBox(width: 6),
                    if (startup.mrrCents != null) Text('MRR €${(startup.mrrCents! / 100).toStringAsFixed(0)}', style: TextStyle(color: c.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)) else Text('MRR —', style: TextStyle(color: c.textTertiary, fontSize: 11)),
                  ]),
                  if (startup.description != null) ...[const SizedBox(height: 4), Text(startup.description!, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: c.textSecondary, fontSize: 12, height: 1.3))],
                ]),
              ),
              Icon(Icons.chevron_right_rounded, color: c.textTertiary),
            ]),
          ),
        ),
      ),
    );
  }
}
