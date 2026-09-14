import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_colors.dart';

/// URL pubblici — placeholder in attesa del dominio stackuproom.com.
/// Per la submission store devono essere URL pubblici raggiungibili (non solo in-app).
class LegalUrls {
  static const privacy = 'https://stackuproom.com/privacy.html';
  static const terms = 'https://stackuproom.com/terms.html';
  static const support = 'https://stackuproom.com';
}

Future<void> openLegalUrl(BuildContext context, String url) async {
  final uri = Uri.parse(url);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  } else if (context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Impossibile aprire $url')));
  }
}

/// Schermata legale in-app (fallback se offline) — mostra link esterno + anteprima testo breve.
/// Il testo completo è ospitato su site/privacy.html e site/terms.html (hosting pubblico).
class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy Policy')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              Icon(Icons.privacy_tip_rounded, color: c.primaryLight),
              const SizedBox(width: 10),
              Expanded(child: Text('Versione completa online', style: TextStyle(color: c.text, fontWeight: FontWeight.w700))),
              TextButton(onPressed: () => openLegalUrl(context, LegalUrls.privacy), child: const Text('Apri')),
            ]),
          ),
          const SizedBox(height: 16),
          Text('Stackup Room raccoglie solo i dati funzionali all\'app (account, profilo, check-in, eventuale Stripe/GitHub se colleghi). Nessun tracking cross-app, nessun dato venduto.',
              style: TextStyle(color: c.textSecondary, height: 1.5)),
          const SizedBox(height: 12),
          _Bullet(c, 'Contatto privacy: privacy@stackuproom.com'),
          _Bullet(c, 'Vedi site/privacy.html per il testo completo (hosting pubblico richiesto per submission store).'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => openLegalUrl(context, LegalUrls.privacy),
              icon: const Icon(Icons.open_in_new_rounded, size: 16),
              label: const Text('Apri privacy policy completa'),
            ),
          ),
        ],
      ),
    );
  }
}

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Scaffold(
      appBar: AppBar(title: const Text('Termini di Servizio')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              Icon(Icons.gavel_rounded, color: c.primaryLight),
              const SizedBox(width: 10),
              Expanded(child: Text('Versione completa online', style: TextStyle(color: c.text, fontWeight: FontWeight.w700))),
              TextButton(onPressed: () => openLegalUrl(context, LegalUrls.terms), child: const Text('Apri')),
            ]),
          ),
          const SizedBox(height: 16),
          Text('Usando Stackup Room accetti i Termini e la Privacy Policy. Servizio 18+, un account per persona. Abbonamenti via IAP (RevenueCat), Stripe solo per verifica revenue esterna.',
              style: TextStyle(color: c.textSecondary, height: 1.5)),
          const SizedBox(height: 12),
          _Bullet(c, 'Contatto: support@stackuproom.com'),
          _Bullet(c, 'Vedi site/terms.html per il testo completo.'),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => openLegalUrl(context, LegalUrls.terms),
              icon: const Icon(Icons.open_in_new_rounded, size: 16),
              label: const Text('Apri termini completi'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bullet extends StatelessWidget {
  const _Bullet(this.c, this.text);
  final dynamic c;
  final String text;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('•  ', style: TextStyle(color: c.textSecondary)),
        Expanded(child: Text(text, style: TextStyle(color: c.textSecondary, fontSize: 13))),
      ]),
    );
  }
}
