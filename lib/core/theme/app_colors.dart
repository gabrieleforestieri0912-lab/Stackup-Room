import 'package:flutter/material.dart';

/// Palette Stackup Room — dark default.
///
/// Vertex monocromatico #0A0A0A / #C4C4C4 con accentSignal vivo #FF6A3D
/// per gamification (streak, leaderboard, momentum). Uso parsimonioso.
class AppColors {
  const AppColors({
    required this.background,
    required this.surface,
    required this.surfaceAlt,
    required this.primary,
    required this.primaryLight,
    required this.primaryMuted,
    required this.accentSignal,
    required this.text,
    required this.textSecondary,
    required this.textTertiary,
    required this.border,
    required this.error,
    required this.success,
    required this.warning,
  });

  final Color background;
  final Color surface;
  final Color surfaceAlt;
  final Color primary;
  final Color primaryLight;
  final Color primaryMuted;
  /// Colore vivo per streak/leaderboard/gamification — arancio momentum.
  /// Non usare per CTA generiche; solo badge, counter, highlight competitivi.
  final Color accentSignal;
  final Color text;
  final Color textSecondary;
  final Color textTertiary;
  final Color border;
  final Color error;
  final Color success;
  final Color warning;

  static const dark = AppColors(
    background: Color(0xFF0A0A0A),
    surface: Color(0xFF161616),
    surfaceAlt: Color(0xFF1F1F1F),
    primary: Color(0xFFC4C4C4),
    primaryLight: Color(0xFFF2F2F2),
    primaryMuted: Color(0xFF2A2A2A),
    accentSignal: Color(0xFFFF6A3D),
    text: Color(0xFFF2F2F2),
    textSecondary: Color(0xFF9A9A9A),
    textTertiary: Color(0xFF6B7280),
    border: Color(0xFF2A2A2A),
    error: Color(0xFFF87171),
    success: Color(0xFF4ADE80),
    warning: Color(0xFFFBBF24),
  );

  static const light = AppColors(
    background: Color(0xFFF8F7FF),
    surface: Color(0xFFFFFFFF),
    surfaceAlt: Color(0xFFF3F0FF),
    primary: Color(0xFF7C3AED),
    primaryLight: Color(0xFFEDE9FE),
    primaryMuted: Color(0xFFE9E3FF),
    accentSignal: Color(0xFFFF6A3D),
    text: Color(0xFF111827),
    textSecondary: Color(0xFF6B7280),
    textTertiary: Color(0xFF9CA3AF),
    border: Color(0xFFE5E7EB),
    error: Color(0xFFEF4444),
    success: Color(0xFF10B981),
    warning: Color(0xFFF59E0B),
  );
}
