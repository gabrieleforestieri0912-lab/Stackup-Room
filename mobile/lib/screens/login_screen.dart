import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 2, vsync: this);

  final _email = TextEditingController();
  final _password = TextEditingController();
  final _code = TextEditingController();

  bool _busy = false;
  bool _otpSent = false;
  String? _error;

  @override
  void dispose() {
    _tabs.dispose();
    _email.dispose();
    _password.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthService>();
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(Icons.rocket_launch, size: 44, color: RoomTheme.room),
                  const SizedBox(height: 12),
                  const Text(
                    'Stackup Room',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: RoomTheme.text,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'La community dei builder, in tasca.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: RoomTheme.textDim, fontSize: 13),
                  ),
                  const SizedBox(height: 28),
                  Container(
                    decoration: BoxDecoration(
                      color: RoomTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: RoomTheme.border),
                    ),
                    child: TabBar(
                      controller: _tabs,
                      labelColor: RoomTheme.room,
                      unselectedLabelColor: RoomTheme.textFaint,
                      indicatorColor: RoomTheme.room,
                      tabs: const [
                        Tab(text: 'Password'),
                        Tab(text: 'Codice email'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 240,
                    child: TabBarView(
                      controller: _tabs,
                      children: [
                        _passwordForm(auth),
                        _otpForm(auth),
                      ],
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: RoomTheme.danger, fontSize: 13),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _passwordForm(AuthService auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          decoration: const InputDecoration(hintText: 'Email'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          obscureText: true,
          decoration: const InputDecoration(hintText: 'Password'),
          onSubmitted: (_) => _submitPassword(auth),
        ),
        const SizedBox(height: 18),
        FilledButton(
          onPressed: _busy ? null : () => _submitPassword(auth),
          child: _busy
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: RoomTheme.bg),
                )
              : const Text('Accedi'),
        ),
      ],
    );
  }

  Widget _otpForm(AuthService auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(hintText: 'Email'),
        ),
        const SizedBox(height: 12),
        if (_otpSent) ...[
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(hintText: 'Codice a 6 cifre'),
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: _busy
                ? null
                : () => _run(() => auth.verifyOtp(_email.text, _code.text)),
            child: const Text('Verifica e entra'),
          ),
          TextButton(
            onPressed: _busy
                ? null
                : () => _run(() async {
                      await auth.requestOtp(_email.text);
                      setState(() => _otpSent = true);
                    }),
            child: const Text(
              'Richiedi un nuovo codice',
              style: TextStyle(color: RoomTheme.textDim, fontSize: 13),
            ),
          ),
        ] else
          FilledButton(
            onPressed: _busy
                ? null
                : () => _run(() async {
                      await auth.requestOtp(_email.text);
                      setState(() => _otpSent = true);
                    }),
            child: const Text('Invia codice via email'),
          ),
      ],
    );
  }

  void _submitPassword(AuthService auth) =>
      _run(() => auth.login(_email.text, _password.text));
}
