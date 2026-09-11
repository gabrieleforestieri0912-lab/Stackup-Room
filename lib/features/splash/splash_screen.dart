import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Splash minimale — Fase 3.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = AppColors.dark;
    return Scaffold(
      backgroundColor: c.background,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: c.border),
              ),
              child: Icon(Icons.layers_rounded, color: c.primary, size: 36),
            ),
            const SizedBox(height: 16),
            Text('Stackup Room',
                style: TextStyle(color: c.text, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
            const SizedBox(height: 4),
            Text('Daily momentum for serious founders',
                style: TextStyle(color: c.textSecondary, fontSize: 12, letterSpacing: 0.3)),
            const SizedBox(height: 28),
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: c.primary),
            ),
          ],
        ),
      ),
    );
  }
}
