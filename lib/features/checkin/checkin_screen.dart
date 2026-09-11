import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_error_view.dart';

/// Home / Check-in — placeholder v0 (logica completa Giorno 4).
class CheckinScreen extends StatefulWidget {
  const CheckinScreen({super.key});

  @override
  State<CheckinScreen> createState() => _CheckinScreenState();
}

class _CheckinScreenState extends State<CheckinScreen> {
  bool _hasError = false;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;

    if (_hasError) {
      return Scaffold(
        appBar: AppBar(title: const Text('Stackup Room')),
        body: AppErrorView(
          title: 'Supabase non raggiungibile',
          message: 'Verifica la connessione o la configurazione in .env. L\'app resta usabile in modalità offline.',
          onRetry: () => setState(() => _hasError = false),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Stackup Room')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header club esclusivo
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: c.primaryMuted,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(Icons.bolt_rounded, color: c.primaryLight),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Daily momentum',
                              style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 15)),
                          Text('Un check-in al giorno. Streak > vanity.',
                              style: TextStyle(color: c.textSecondary, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text('Cosa hai mosso oggi?',
                    style: TextStyle(color: c.textTertiary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
                const SizedBox(height: 8),
                TextField(
                  maxLength: 280,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Es. Chiuso onboarding Stripe, MRR +€120...',
                    counterStyle: TextStyle(color: c.textTertiary, fontSize: 11),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Check-in — logica Giorno 4. v0: solo UI.')),
                      );
                    },
                    child: const Text('Pubblica check-in'),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: TextButton(
                    onPressed: () => setState(() => _hasError = true),
                    child: Text('Simula errore connessione', style: TextStyle(color: c.textTertiary, fontSize: 12)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text('Storico',
              style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 13, letterSpacing: 0.3)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.border),
            ),
            child: Column(
              children: [
                Icon(Icons.inbox_rounded, color: c.textTertiary, size: 32),
                const SizedBox(height: 8),
                Text('Nessun check-in ancora',
                    style: TextStyle(color: c.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
                Text('Il tuo primo check-in apparirà qui.',
                    style: TextStyle(color: c.textTertiary, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
