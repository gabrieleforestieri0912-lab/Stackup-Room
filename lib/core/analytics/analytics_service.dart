import 'package:flutter/foundation.dart';

import '../supabase/supabase_client.dart';

/// Analytics minimali — Giorno 5 Fase 4.
///
/// Eventi chiave funnel (nessun SDK esterno, tabella Supabase `analytics_events`).
/// Coerente con "defer infrastructure until demand is proven" — se il volume
/// cresce, si migra a PostHog/Mixpanel/Amplitude senza cambiare call site.
///
/// Errori mai bloccanti: logga e prosegue.
class AnalyticsService {
  AnalyticsService._();

  /// Nomi evento consentiti (check lato DB).
  static const signupCompleted = 'signup_completed';
  static const onboardingCompleted = 'onboarding_completed';
  static const firstCheckinCompleted = 'first_checkin_completed';
  static const revenueConnected = 'revenue_connected';
  static const githubConnected = 'github_connected';
  static const paywallViewed = 'paywall_viewed';
  static const subscriptionPurchased = 'subscription_purchased';

  static Future<void> track(String eventName, {Map<String, dynamic>? properties}) async {
    final client = SupabaseService.clientOrNull;
    final userId = SupabaseService.authOrNull?.currentUser?.id;
    if (client == null || userId == null) {
      debugPrint('[Analytics] skip $eventName (offline / anon) props=${properties ?? {}}');
      return;
    }
    try {
      await client.from('analytics_events').insert({
        'user_id': userId,
        'event_name': eventName,
        'properties': properties ?? {},
      });
      debugPrint('[Analytics] $eventName ok');
    } catch (e) {
      debugPrint('[Analytics] $eventName errore (non bloccante): $e');
    }
  }
}
