import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Gate paywall — Fase 4/7 spec: metriche personali free, leaderboard comparativa dietro membership.
/// RevenueCat SDK Flutter (purchases_flutter) da integrare in Fase 7.
/// Per ora mock reattivo via Riverpod; ascolta CustomerInfo in futuro.
///
/// TODO: confermare pricing 3/6/12 mesi su RevenueCat dashboard — non hardcodare product IDs.
class PaywallState {
  const PaywallState({required this.hasMembership, this.tier});

  final bool hasMembership;
  final String? tier; // '3m' | '6m' | '12m' | null

  bool get canSeeComparativeLeaderboard => hasMembership;
  bool get canAccessCommunity => hasMembership;
}

class PaywallNotifier extends StateNotifier<PaywallState> {
  PaywallNotifier() : super(const PaywallState(hasMembership: false));

  // Chiamato da RevenueCat listener in Fase 7: Purchases.addCustomerInfoUpdateListener
  void setMembership(bool v, {String? tier}) {
    state = PaywallState(hasMembership: v, tier: tier);
  }

  // Mock per test locale
  void mockGrant() => state = const PaywallState(hasMembership: true, tier: '12m');
  void mockRevoke() => state = const PaywallState(hasMembership: false);
}

final paywallProvider = StateNotifierProvider<PaywallNotifier, PaywallState>((ref) {
  return PaywallNotifier();
});
