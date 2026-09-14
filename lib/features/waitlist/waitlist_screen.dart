import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';
import 'waitlist_repository.dart';

/// Schermata waitlist — mostrata quando ENABLE_PUBLIC_SIGNUP=false.
/// Form iscrizione minimale + link TestFlight/Play Internal Testing.
class WaitlistScreen extends StatefulWidget {
  const WaitlistScreen({super.key});

  @override
  State<WaitlistScreen> createState() => _WaitlistScreenState();
}

class _WaitlistScreenState extends State<WaitlistScreen> {
  final _emailCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _error;
  bool _success = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _join() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await WaitlistRepository().join(_emailCtrl.text.trim());
      if (!mounted) return;
      setState(() => _success = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Iscritto alla waitlist — ti avviseremo al lancio 🚀')),
      );
    } on StateError catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(16)),
                  child: Icon(Icons.mail_outline_rounded, color: c.primaryLight, size: 28),
                ),
                const SizedBox(height: 20),
                Text('Stackup Room è in accesso anticipato',
                    style: TextStyle(color: c.text, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
                const SizedBox(height: 8),
                Text('Stiamo aprendo a piccoli gruppi per garantire qualità. Iscriviti alla waitlist — ti invitiamo a breve.',
                    style: TextStyle(color: c.textSecondary, fontSize: 14, height: 1.5)),
                const SizedBox(height: 24),
                if (_success)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: c.success.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: c.success.withValues(alpha: 0.3)),
                    ),
                    child: Row(children: [
                      Icon(Icons.check_circle_rounded, color: c.success, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text('Sei in lista! Controlla ${_emailCtrl.text.trim()}', style: TextStyle(color: c.success, fontSize: 13))),
                    ]),
                  ),
                if (_error != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: c.error.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: c.error.withValues(alpha: 0.3)),
                    ),
                    child: Row(children: [
                      Icon(Icons.error_outline_rounded, color: c.error, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: TextStyle(color: c.error, fontSize: 13))),
                    ]),
                  ),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  enabled: !_success,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Inserisci la tua email';
                    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim())) return 'Email non valida';
                    return null;
                  },
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    hintText: 'tu@startup.com',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: (_loading || _success) ? null : _join,
                    child: _loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_success ? 'Iscritto ✓' : 'Iscriviti alla waitlist'),
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: c.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Beta tester?', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 13)),
                      const SizedBox(height: 6),
                      Text('Se hai ricevuto un invito TestFlight o Play Internal Testing, usa il link ricevuto via email. La waitlist pubblica e i canali beta possono coesistere.',
                          style: TextStyle(color: c.textSecondary, fontSize: 12, height: 1.5)),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                TextButton.icon(
                  onPressed: () async {
                    final uri = Uri.parse('https://stackuproom.com');
                    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
                  },
                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                  label: const Text('stackuproom.com'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
