import 'package:flutter/material.dart';

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialBanner(
      backgroundColor: Colors.amber.shade700,
      leading: const Icon(Icons.wifi_off_rounded, color: Colors.white),
      content: const Text(
        'Nessuna connessione — i dati mostrati potrebbero non essere aggiornati.',
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
      ),
      actions: const [SizedBox.shrink()],
    );
  }
}
