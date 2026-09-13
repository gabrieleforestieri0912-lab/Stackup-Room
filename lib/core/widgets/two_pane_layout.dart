import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/breakpoints.dart';

/// Layout responsive a due colonne (>900 logical px → Windows desktop):
/// contenuto principale a sinistra, pannello di dettaglio a destra.
///
/// Centralizza qui il breakpoint (vedi [Breakpoints]) così le schermate a lista
/// (Today, Portfolio, Leaderboard, Community) non duplicano `MediaQuery`/layout
/// condizionali sparsi nel codice.
///
/// [bodyBuilder] riceve `isDesktop` per adattare il contenuto principale
/// (es. la Community nasconde lo strip canali quando i canali sono nel pane).
class TwoPaneLayout extends StatelessWidget {
  const TwoPaneLayout({
    super.key,
    required this.bodyBuilder,
    this.secondary,
    this.secondaryWidth = 360,
  });

  final Widget Function(BuildContext context, bool isDesktop) bodyBuilder;
  final Widget? secondary;
  final double secondaryWidth;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = Breakpoints.isDesktop(constraints.maxWidth);
        final body = bodyBuilder(context, isDesktop);
        if (!isDesktop) return body;

        final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
        return Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: body),
            Container(width: 1, color: c.border),
            SizedBox(width: secondaryWidth, child: secondary ?? const SizedBox.shrink()),
          ],
        );
      },
    );
  }
}
