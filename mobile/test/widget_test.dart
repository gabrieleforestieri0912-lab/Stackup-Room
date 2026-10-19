import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stackup_room_mobile/theme.dart';

void main() {
  testWidgets('il tema della Room renderizza', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: RoomTheme.theme,
        home: const Scaffold(
          body: Center(child: Text('Stackup Room')),
        ),
      ),
    );
    expect(find.text('Stackup Room'), findsOneWidget);
  });
}
