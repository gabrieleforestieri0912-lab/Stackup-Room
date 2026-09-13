import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stackup_room/core/theme/app_theme.dart';
import 'package:stackup_room/core/widgets/two_pane_layout.dart';
import 'package:stackup_room/features/community/presentation/community_screen.dart';
import 'package:stackup_room/features/paywall/paywall_provider.dart';

/// Verifica responsive dei breakpoint centralizzati (Fase 8):
/// 375px mobile, 768px tablet, ≥900px desktop Windows a due colonne.
void main() {
  const mobile = 375.0;
  const tablet = 768.0;
  const desktop = 1280.0;

  Future<void> pumpAt(WidgetTester tester, Widget child, {required double width}) async {
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = Size(width, 900);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(ProviderScope(child: MaterialApp(theme: AppTheme.dark(), home: child)));
    await tester.pumpAndSettle();
  }

  group('TwoPaneLayout — breakpoint', () {
    Widget twoPane() => TwoPaneLayout(
          bodyBuilder: (context, isDesktop) => Text(isDesktop ? 'LISTA desktop' : 'LISTA mobile'),
          secondary: const Text('DETTAGLIO'),
        );

    testWidgets('375px: una sola colonna, nessun pane di dettaglio', (tester) async {
      await pumpAt(tester, twoPane(), width: mobile);
      expect(find.text('LISTA mobile'), findsOneWidget);
      expect(find.text('DETTAGLIO'), findsNothing);
    });

    testWidgets('768px (tablet): resta a una colonna, sotto la soglia 900', (tester) async {
      await pumpAt(tester, twoPane(), width: tablet);
      expect(find.text('LISTA mobile'), findsOneWidget);
      expect(find.text('DETTAGLIO'), findsNothing);
    });

    testWidgets('1280px (Windows desktop): due colonne con dettaglio', (tester) async {
      await pumpAt(tester, twoPane(), width: desktop);
      expect(find.text('LISTA desktop'), findsOneWidget);
      expect(find.text('DETTAGLIO'), findsOneWidget);
    });
  });

  group('Community — layout responsive', () {
    Future<void> pumpCommunity(WidgetTester tester, double width) async {
      final container = ProviderContainer();
      addTearDown(container.dispose);
      // Sblocca il gate paywall per montare la sezione community (nessuno store reale).
      container.read(paywallProvider.notifier).mockGrant();
      tester.view.devicePixelRatio = 1.0;
      tester.view.physicalSize = Size(width, 900);
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: MaterialApp(theme: AppTheme.dark(), home: const CommunityScreen()),
        ),
      );
      await tester.pumpAndSettle();
    }

    testWidgets('mobile: canali nello strip orizzontale, nessun pane laterale', (tester) async {
      await pumpCommunity(tester, mobile);
      expect(find.text('Canali'), findsNothing);
      expect(find.text('#generale'), findsOneWidget);
    });

    testWidgets('desktop ≥900: i canali si spostano nel pane destro', (tester) async {
      await pumpCommunity(tester, desktop);
      expect(find.text('Canali'), findsOneWidget);
      expect(find.text('#generale'), findsOneWidget);
    });
  });
}
