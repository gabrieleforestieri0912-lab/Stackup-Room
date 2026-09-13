import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/community.dart';

class GuideDetailSheet extends StatelessWidget {
  const GuideDetailSheet({super.key, required this.guide});
  final Guide guide;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(width: 36, height: 4, decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(2)), alignment: Alignment.center),
            const SizedBox(height: 16),
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: c.accentSignal.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)), child: Text(guide.category, style: TextStyle(color: c.accentSignal, fontSize: 11, fontWeight: FontWeight.w700))),
            const SizedBox(height: 8),
            Text(guide.title, style: TextStyle(color: c.text, fontWeight: FontWeight.w800, fontSize: 20, height: 1.2)),
            const SizedBox(height: 16),
            // Markdown semplice — per MVP testo + bold/quote; in Fase 8 sostituire con flutter_markdown
            Text(guide.bodyMd, style: TextStyle(color: c.textSecondary, fontSize: 13, height: 1.6)),
            const SizedBox(height: 16),
            Text('Guide playbook — community paywalled (Fase 6).', style: TextStyle(color: c.textTertiary, fontSize: 10)),
          ]),
        ),
      ),
    );
  }
}
