import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../../core/monetization/purchases_service.dart';
import '../../core/supabase/supabase_client.dart';

/// Gate paywall — Fase 7: RevenueCat SDK + listener CustomerInfo.
/// Offering 3/6/12 mesi configurata su dashboard RevenueCat — mai hardcoded product IDs definitivi.
/// Fallback mock se RevenueCat non configurato (offline / test).
class PaywallState {
  const PaywallState({required this.hasMembership, this.tier, this.customerInfo});

  final bool hasMembership;
  final String? tier; // 3m | 6m | 12m
  final CustomerInfo? customerInfo;

  bool get canSeeComparativeLeaderboard => hasMembership;
  bool get canAccessCommunity => hasMembership;
  bool get canUseAiUnlimited => hasMembership;
}

class PaywallNotifier extends StateNotifier<PaywallState> {
  PaywallNotifier() : super(const PaywallState(hasMembership: false)) {
    _init();
  }

  Future<void> _init() async {
    if (!PurchasesService.isInitialized) {
      debugPrint('[Paywall] SDK non inizializzato — stato free (mock)');
      return;
    }
    try {
      // Allinea l'utente RevenueCat all'utente Supabase corrente.
      await PurchasesService.syncUser(SupabaseService.authOrNull?.currentUser?.id);

      // Listener reattivo — gate feature paywalled basato su stato
      Purchases.addCustomerInfoUpdateListener((info) {
        final has = info.entitlements.active.isNotEmpty;
        final tier = has ? info.entitlements.active.values.first.productIdentifier : null;
        state = PaywallState(hasMembership: has, tier: tier, customerInfo: info);
        debugPrint('[Paywall] CustomerInfo update: hasMembership=$has tier=$tier');
      });
      final info = await Purchases.getCustomerInfo();
      final has = info.entitlements.active.isNotEmpty;
      state = PaywallState(hasMembership: has, tier: has ? info.entitlements.active.values.first.productIdentifier : null, customerInfo: info);
    } catch (e) {
      debugPrint('[Paywall] init errore (non configurato?): $e — mock free');
    }
  }

  Future<void> purchase(Package package) async {
    try {
      final info = await Purchases.purchasePackage(package);
      final has = info.entitlements.active.isNotEmpty;
      state = PaywallState(hasMembership: has, tier: has ? info.entitlements.active.values.first.productIdentifier : null, customerInfo: info);
    } catch (e) {
      debugPrint('[Paywall] purchase errore: $e');
      rethrow;
    }
  }

  Future<void> restore() async {
    try {
      final info = await Purchases.restorePurchases();
      final has = info.entitlements.active.isNotEmpty;
      state = PaywallState(hasMembership: has, tier: has ? info.entitlements.active.values.first.productIdentifier : null, customerInfo: info);
    } catch (e) {
      debugPrint('[Paywall] restore errore: $e');
    }
  }

  // Mock per test locale / preview senza store
  void mockGrant() => state = const PaywallState(hasMembership: true, tier: '12m');
  void mockRevoke() => state = const PaywallState(hasMembership: false);
}

final paywallProvider = StateNotifierProvider<PaywallNotifier, PaywallState>((ref) => PaywallNotifier());

/// Offering helper — ritorna packages 3/6/12 se disponibili, altrimenti mock
final paywallOfferingProvider = FutureProvider<Offering?>((ref) async {
  try {
    final offerings = await Purchases.getOfferings();
    return offerings.current ?? offerings.all.values.firstOrNull;
  } catch (e) {
    debugPrint('[Paywall] getOfferings errore: $e');
    return null;
  }
});

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
