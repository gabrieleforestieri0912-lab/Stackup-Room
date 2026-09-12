import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stackup_room/main.dart';

void main() {
  testWidgets('App smoke test — monta senza crash e mostra splash', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: StackupApp()));
    expect(find.text('Stackup Room'), findsWidgets);
    // Avanza oltre splash min duration (800ms)
    await tester.pump(const Duration(milliseconds: 800));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    // Verifica MaterialApp presente (non crash)
    expect(find.byType(StackupApp), findsOneWidget);
  });

  testWidgets('StackupApp contiene AuthGate', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: StackupApp()));
    expect(find.byType(AuthGate), findsOneWidget);
    // Consuma il timer di _AuthGateState._boot (800ms) per evitare Timer pending
    await tester.pump(const Duration(milliseconds: 800));
    await tester.pump();
  });
}
