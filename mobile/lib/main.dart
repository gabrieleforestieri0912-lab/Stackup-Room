import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'screens/login_screen.dart';
import 'screens/shell_screen.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'state/room_state.dart';
import 'theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient();
  final auth = AuthService(api);
  await auth.restore();
  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        ChangeNotifierProvider<AuthService>.value(value: auth),
        ChangeNotifierProvider<RoomState>(create: (_) => RoomState(api)),
      ],
      child: const StackupRoomApp(),
    ),
  );
}

class StackupRoomApp extends StatelessWidget {
  const StackupRoomApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Stackup Room',
      debugShowCheckedModeBanner: false,
      theme: RoomTheme.theme,
      home: Consumer<AuthService>(
        builder: (context, auth, _) {
          if (!auth.ready) {
            return const Scaffold(
              backgroundColor: RoomTheme.bg,
              body: Center(
                child: CircularProgressIndicator(color: RoomTheme.room),
              ),
            );
          }
          return auth.user == null ? const LoginScreen() : const ShellScreen();
        },
      ),
    );
  }
}
