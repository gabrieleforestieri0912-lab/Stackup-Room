import 'package:flutter/material.dart';

/// Palette "club esclusivo per founder seri" — dark default.
///
/// Riferimento concettuale: Taskly dark (0xFF0F0F1A / 0xFF1A1A2E / 0xFFA67CFF)
/// declinato come identità autonoma StackUp Room.
class AppColors {
  const AppColors({
    required this.background,
    required this.surface,
    required this.surfaceAlt,
    required this.primary,
    required this.primaryLight,
    required this.primaryMuted,
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
  final Color text;
  final Color textSecondary;
  final Color textTertiary;
  final Color border;
  final Color error;
  final Color success;
  final Color warning;

  static const dark = AppColors(
    background: Color(0xFF0A0A14),
    surface: Color(0xFF141428),
    surfaceAlt: Color(0xFF1E1E3A),
    primary: Color(0xFF8B5CF6),
    primaryLight: Color(0xFFA78BFA),
    primaryMuted: Color(0xFF2D1B69),
    text: Color(0xFFF1F1F5),
    textSecondary: Color(0xFF9CA3AF),
    textTertiary: Color(0xFF6B7280),
    border: Color(0xFF2A2A4A),
    error: Color(0xFFF87171),
    success: Color(0xFF34D399),
    warning: Color(0xFFFBBF24),
  );

  static const light = AppColors(
    background: Color(0xFFF8F7FF),
    surface: Color(0xFFFFFFFF),
    surfaceAlt: Color(0xFFF3F0FF),
    primary: Color(0xFF7C3AED),
    primaryLight: Color(0xFFEDE9FE),
    primaryMuted: Color(0xFFE9E3FF),
    text: Color(0xFF111827),
    textSecondary: Color(0xFF6B7280),
    textTertiary: Color(0xFF9CA3AF),
    border: Color(0xFFE5E7EB),
    error: Color(0xFFEF4444),
    success: Color(0xFF10B981),
    warning: Color(0xFFF59E0B),
  );
}
