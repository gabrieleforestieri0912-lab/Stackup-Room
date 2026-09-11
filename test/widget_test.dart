import 'package:flutter_test/flutter_test.dart';
import 'package:stackup_room/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const StackupApp());
    expect(find.text('Stackup Room'), findsWidgets);
    // Avanza oltre lo splash (800ms)
    await tester.pump(const Duration(milliseconds: 900));
    await tester.pump();
    expect(find.text('Check-in'), findsOneWidget);
  });
}
