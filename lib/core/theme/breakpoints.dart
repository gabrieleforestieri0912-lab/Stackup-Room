/// Breakpoint centralizzati — Fase 8 spec richiede >900 logical px per layout desktop 2-colonne.
/// Usare LayoutBuilder con questi valori, non MediaQuery sparso.
class Breakpoints {
  Breakpoints._();

  static const double mobile = 375; // iPhone SE
  static const double tablet = 600;
  static const double desktop = 900; // Windows 2-colonne

  static bool isDesktop(double width) => width >= desktop;
  static bool isTablet(double width) => width >= tablet && width < desktop;
  static bool isMobile(double width) => width < tablet;
}
