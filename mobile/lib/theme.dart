import 'package:flutter/material.dart';

/// Tema scuro della Room: sfondo notte, accenti verde acqua (teal).
class RoomTheme {
  static const Color bg = Color(0xFF05070B);
  static const Color surface = Color(0xFF0A0B0E);
  static const Color card = Color(0xFF101318);
  static const Color border = Color(0xFF27272A);
  static const Color room = Color(0xFF4DE0C9);
  static const Color roomBright = Color(0xFF7FF0E1);
  static const Color text = Color(0xFFF4F4F5);
  static const Color textDim = Color(0xFFA1A1AA);
  static const Color textFaint = Color(0xFF71717A);
  static const Color danger = Color(0xFFF87171);
  static const Color warning = Color(0xFFFACC15);

  static ThemeData get theme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: bg,
        colorScheme: const ColorScheme.dark(
          primary: room,
          secondary: roomBright,
          surface: bg,
          error: danger,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surface,
          hintStyle: const TextStyle(color: textFaint),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: room, width: 1.4),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: room,
            foregroundColor: bg,
            minimumSize: const Size.fromHeight(48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: text,
            side: const BorderSide(color: border),
            minimumSize: const Size.fromHeight(48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        switchTheme: SwitchThemeData(
          thumbColor: WidgetStateProperty.all(room),
          trackColor: WidgetStateProperty.resolveWith(
            (states) => states.contains(WidgetState.selected)
                ? room.withValues(alpha: 0.4)
                : border,
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: surface,
          selectedItemColor: room,
          unselectedItemColor: textFaint,
          type: BottomNavigationBarType.fixed,
        ),
        snackBarTheme: const SnackBarThemeData(
          backgroundColor: card,
          contentTextStyle: TextStyle(color: text),
          behavior: SnackBarBehavior.floating,
        ),
      );
}
