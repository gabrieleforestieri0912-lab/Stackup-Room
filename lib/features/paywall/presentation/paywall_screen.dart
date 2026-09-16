import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../paywall_provider.dart';

class PaywallScreen extends ConsumerStatefulWidget {
  const PaywallScreen({super.key});

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  String _selected = '12m'; // preselezionato Miglior valore
  bool _buying = false;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final offeringAsync = ref.watch(paywallOfferingProvider);
    final reduce = MediaQuery.of(context).disableAnimations;

    return Scaffold(
      appBar: AppBar(title: const Text('Membership')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(16)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Icon(Icons.star_rounded, color: c.primaryLight), const SizedBox(width: 6), Text('Sblocca Stackup Room', style: TextStyle(color: c.primaryLight, fontWeight: FontWeight.w800, fontSize: 16))]),
            const SizedBox(height: 8),
            for (final f in ['Community chat + voice notes', 'Leaderboard comparativa verificata', 'AI Coach senza limiti']) Row(children: [Icon(Icons.check_rounded, size: 14, color: c.primaryLight), const SizedBox(width: 6), Text(f, style: TextStyle(color: c.primaryLight, fontSize: 12))]),
          ]),
        ),
        const SizedBox(height: 16),
        offeringAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _PlanList(c: c, selected: _selected, onSelect: (v) => setState(() => _selected = v), reduce: reduce, mock: true),
          data: (offering) {
            if (offering == null) return _PlanList(c: c, selected: _selected, onSelect: (v) => setState(() => _selected = v), reduce: reduce, mock: true);
            return _OfferingList(offering: offering, selected: _selected, onSelect: (v) => setState(() => _selected = v), reduce: reduce, c: c, buying: _buying, onBuy: _buy);
          },
        ),
        const SizedBox(height: 16),
        if (offeringAsync.hasValue && offeringAsync.value != null)
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: _buying ? null : () => _buy(offeringAsync.value!),
              style: ElevatedButton.styleFrom(backgroundColor: c.accentSignal, foregroundColor: Colors.white),
              child: _buying ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Continua'),
            ),
          )
        else
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                // Test locale: sblocca la membership senza store (nessun addebito).
                ref.read(paywallProvider.notifier).mockGrant();
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                  content: Text('Membership mock attiva — solo per test locale'),
                ));
              },
              style: ElevatedButton.styleFrom(backgroundColor: c.accentSignal, foregroundColor: Colors.white),
              child: Text('Mock sblocca $_selected'),
            ),
          ),
        const SizedBox(height: 8),
        TextButton(onPressed: () => ref.read(paywallProvider.notifier).restore(), child: const Text('Ripristina acquisti')),
        const SizedBox(height: 4),
        Text('Piani e prezzi configurati su RevenueCat (offering 3/6/12 mesi) — gestiti da App Store / Play Store.', textAlign: TextAlign.center, style: TextStyle(color: c.textTertiary, fontSize: 10)),
        const SizedBox(height: 8),
        Text('Gestione abbonamento: deep link a App Store/Play Store settings (non flow cancellazione custom).', textAlign: TextAlign.center, style: TextStyle(color: c.textTertiary, fontSize: 10)),
      ]),
    );
  }

  Future<void> _buy(Offering offering) async {
    final pkg = offering.availablePackages.firstWhere((p) => p.identifier.contains(_selected) || p.packageType == PackageType.annual, orElse: () => offering.availablePackages.first);
    setState(() => _buying = true);
    try {
      await ref.read(paywallProvider.notifier).purchase(pkg);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Acquisto riuscito — benvenuto!')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Acquisto annullato o errore: $e')));
    } finally {
      if (mounted) setState(() => _buying = false);
    }
  }
}

class _PlanList extends StatelessWidget {
  const _PlanList({required this.c, required this.selected, required this.onSelect, required this.reduce, required this.mock});
  final AppColors c;
  final String selected;
  final void Function(String) onSelect;
  final bool reduce;
  final bool mock;

  @override
  Widget build(BuildContext context) {
    // Anteprima mock locale — prezzi placeholder solo quando l'offering RevenueCat non è disponibile (offline/dev); in produzione i prezzi arrivano dallo Store via offering.
    final plans = [
      ('3m', '3 mesi', '€29', null),
      ('6m', '6 mesi', '€49', null),
      ('12m', '12 mesi', '€79', 'Miglior valore'),
    ];
    return Column(children: [for (final p in plans) _PlanCard(id: p.$1, label: p.$2, price: p.$3, badge: p.$4, selected: selected == p.$1, onTap: () => onSelect(p.$1), c: c, reduce: reduce)]);
  }
}

class _OfferingList extends StatelessWidget {
  const _OfferingList({required this.offering, required this.selected, required this.onSelect, required this.reduce, required this.c, required this.buying, required this.onBuy});
  final Offering offering;
  final String selected;
  final void Function(String) onSelect;
  final bool reduce;
  final AppColors c;
  final bool buying;
  final void Function(Offering) onBuy;

  @override
  Widget build(BuildContext context) {
    // Preselezione = piano con badge “Miglior valore” (annuale) finché l'utente
    // non sceglie: gli identifier arrivano dalla dashboard RevenueCat, quindi
    // il default locale ('12m') non corrisponde a nessun package reale.
    final packages = offering.availablePackages;
    final hasSelection = packages.any((p) => p.identifier == selected);
    final effectiveSelected = hasSelection
        ? selected
        : packages.firstWhere((p) => p.packageType == PackageType.annual, orElse: () => packages.first).identifier;

    return Column(children: [
      for (final pkg in packages)
        _PlanCard(
          id: pkg.identifier,
          label: pkg.storeProduct.title,
          price: pkg.storeProduct.priceString,
          badge: pkg.packageType == PackageType.annual ? 'Miglior valore' : null,
          selected: effectiveSelected == pkg.identifier,
          onTap: () => onSelect(pkg.identifier),
          c: c,
          reduce: reduce,
        ),
    ]);
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.id, required this.label, required this.price, this.badge, required this.selected, required this.onTap, required this.c, required this.reduce});
  final String id;
  final String label;
  final String price;
  final String? badge;
  final bool selected;
  final VoidCallback onTap;
  final AppColors c;
  final bool reduce;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: reduce ? Duration.zero : const Duration(milliseconds: 180),
      curve: Curves.easeOut,
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: selected ? c.accentSignal.withValues(alpha: 0.12) : c.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: selected ? c.accentSignal : c.border, width: selected ? 1.5 : 1),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              AnimatedScale(duration: reduce ? Duration.zero : const Duration(milliseconds: 180), scale: selected ? 1.08 : 1, child: Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded, color: selected ? c.accentSignal : c.textTertiary, size: 20)),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)), if (badge != null) Container(margin: const EdgeInsets.only(top: 4), padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: c.accentSignal, borderRadius: BorderRadius.circular(6)), child: Text(badge!, style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)))])),
              Text(price, style: TextStyle(color: c.text, fontWeight: FontWeight.w800, fontSize: 14)),
            ]),
          ),
        ),
      ),
    );
  }
}
