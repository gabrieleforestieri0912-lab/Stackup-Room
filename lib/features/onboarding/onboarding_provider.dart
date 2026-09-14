import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/analytics/analytics_service.dart';
import '../../core/notifications/notification_service.dart';
import '../../core/storage/hive_service.dart';
import '../../core/supabase/supabase_client.dart';

/// Stato onboarding incrementale — 3 step + welcome.
/// Persistito in Hive ad ogni step (resume se app chiusa a metà) + sync su Supabase.

enum OnboardingStep { step1Profile, step2Startup, step3Reminder, done }

class OnboardingState {
  const OnboardingState({
    this.step = OnboardingStep.step1Profile,
    this.displayName = '',
    this.avatarLocalPath,
    this.avatarUrl,
    this.startupName,
    this.oneLiner = '',
    this.reminderHour = 9,
    this.notificationGranted,
    this.isSaving = false,
    this.error,
  });

  final OnboardingStep step;
  final String displayName;
  final String? avatarLocalPath;
  final String? avatarUrl;
  final String? startupName;
  final String oneLiner; // max 140
  final int reminderHour; // 0-23
  final bool? notificationGranted; // null = non ancora chiesto
  final bool isSaving;
  final String? error;

  int get stepIndex {
    switch (step) {
      case OnboardingStep.step1Profile:
        return 0;
      case OnboardingStep.step2Startup:
        return 1;
      case OnboardingStep.step3Reminder:
        return 2;
      case OnboardingStep.done:
        return 3;
    }
  }

  bool get canProceedStep1 => displayName.trim().length >= 2;
  /// Obbligatorio con defer esplicito: per procedere via "Continua" serve nome startup >=2.
  /// La via "Lo faccio dopo" passa da skipStep2() che azzera i campi.
  bool get canProceedStep2 => (startupName?.trim().length ?? 0) >= 2;
  bool get isOneLinerValid => oneLiner.length <= 140;

  OnboardingState copyWith({
    OnboardingStep? step,
    String? displayName,
    String? avatarLocalPath,
    String? avatarUrl,
    String? startupName,
    String? oneLiner,
    int? reminderHour,
    bool? notificationGranted,
    bool? isSaving,
    String? error,
    bool clearError = false,
    bool clearAvatar = false,
  }) {
    return OnboardingState(
      step: step ?? this.step,
      displayName: displayName ?? this.displayName,
      avatarLocalPath: clearAvatar ? null : (avatarLocalPath ?? this.avatarLocalPath),
      avatarUrl: clearAvatar ? null : (avatarUrl ?? this.avatarUrl),
      startupName: startupName ?? this.startupName,
      oneLiner: oneLiner ?? this.oneLiner,
      reminderHour: reminderHour ?? this.reminderHour,
      notificationGranted: notificationGranted ?? this.notificationGranted,
      isSaving: isSaving ?? this.isSaving,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class OnboardingNotifier extends StateNotifier<OnboardingState> {
  OnboardingNotifier() : super(const OnboardingState()) {
    _loadFromHive();
  }

  final _picker = ImagePicker();

  void _loadFromHive() {
    final cache = HiveService.getOnboardingCache();
    final stepInt = cache['step'] as int? ?? 0;
    final step = switch (stepInt) {
      0 => OnboardingStep.step1Profile,
      1 => OnboardingStep.step2Startup,
      2 => OnboardingStep.step3Reminder,
      _ => OnboardingStep.done,
    };
    // Se Hive dice done ma Supabase non ancora → resta done locale
    state = OnboardingState(
      step: step,
      displayName: (cache['display_name'] as String?) ?? '',
      avatarLocalPath: cache['avatar_local_path'] as String?,
      avatarUrl: cache['avatar_url'] as String?,
      startupName: cache['startup_name'] as String?,
      oneLiner: (cache['one_liner'] as String?) ?? '',
      reminderHour: (cache['reminder_hour'] as int?) ?? 9,
      notificationGranted: null,
    );
    debugPrint('[Onboarding] Caricato da Hive: step=$stepInt displayName=${state.displayName}');
  }

  /// Carica profilo remoto per pre-riempire (se utente ha già dati su Supabase).
  Future<void> loadFromProfile(Map<String, dynamic>? profile) async {
    if (profile == null) return;
    // Non sovrascrivere se Hive ha già dati più recenti (step > 0)
    if (HiveService.onboardingStep > 0) return;

    state = state.copyWith(
      displayName: (profile['display_name'] as String?) ?? state.displayName,
      avatarUrl: (profile['avatar_url'] as String?) ?? state.avatarUrl,
      startupName: (profile['startup_name'] as String?) ?? state.startupName,
      oneLiner: (profile['one_liner'] as String?) ?? state.oneLiner,
    );
  }

  // --- Mutators locali (senza sync) ---

  void setDisplayName(String v) => state = state.copyWith(displayName: v, clearError: true);
  void setStartupName(String? v) => state = state.copyWith(startupName: v, clearError: true);
  void setOneLiner(String v) {
    if (v.length <= 140) state = state.copyWith(oneLiner: v, clearError: true);
  } // guarda validazione in completeStep2 (max 140)

  void setReminderHour(int h) => state = state.copyWith(reminderHour: h.clamp(0, 23), clearError: true);

  // --- Avatar ---

  Future<void> pickAvatar() async {
    try {
      final xfile = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 800, imageQuality: 85);
      if (xfile == null) return;
      state = state.copyWith(avatarLocalPath: xfile.path, clearError: true);
      await HiveService.setOnboardingAvatarLocalPath(xfile.path);
    } catch (e) {
      state = state.copyWith(error: 'Errore selezione immagine: $e');
    }
  }

  Future<void> pickAvatarCamera() async {
    try {
      final xfile = await _picker.pickImage(source: ImageSource.camera, maxWidth: 800, imageQuality: 85);
      if (xfile == null) return;
      state = state.copyWith(avatarLocalPath: xfile.path, clearError: true);
      await HiveService.setOnboardingAvatarLocalPath(xfile.path);
    } catch (e) {
      state = state.copyWith(error: 'Errore fotocamera: $e');
    }
  }

  void removeAvatar() {
    state = state.copyWith(clearAvatar: true, clearError: true);
    HiveService.setOnboardingAvatarLocalPath(null);
    HiveService.setOnboardingAvatarUrl(null);
  }

  Future<String?> _uploadAvatar(String userId) async {
    final localPath = state.avatarLocalPath;
    if (localPath == null) return state.avatarUrl; // già caricato o nessuno
    final client = SupabaseService.clientOrNull;
    if (client == null) {
      debugPrint('[Onboarding] Skip upload avatar — offline');
      return null;
    }
    try {
      final file = File(localPath);
      if (!await file.exists()) return null;
      final ext = localPath.split('.').last.toLowerCase();
      final mimeExt = (ext == 'jpg' || ext == 'jpeg') ? 'jpg' : ext;
      final path = '$userId/avatar.$mimeExt';
      final bytes = await file.readAsBytes();
      await client.storage.from('avatars').uploadBinary(
            path,
            bytes,
            fileOptions: FileOptions(upsert: true, contentType: 'image/$mimeExt'),
          );
      final url = client.storage.from('avatars').getPublicUrl(path);
      debugPrint('[Onboarding] Avatar caricato: $url');
      await HiveService.setOnboardingAvatarUrl(url);
      state = state.copyWith(avatarUrl: url);
      return url;
    } catch (e) {
      debugPrint('[Onboarding] Upload avatar errore: $e');
      // Non blocca onboarding — avatar skippabile
      return state.avatarUrl;
    }
  }

  // --- Step completions (Hive + Supabase sync) ---

  Future<bool> completeStep1() async {
    if (!state.canProceedStep1) {
      state = state.copyWith(error: 'Inserisci un nome di almeno 2 caratteri');
      return false;
    }
    state = state.copyWith(isSaving: true, clearError: true);
    try {
      final client = SupabaseService.clientOrNull;
      final userId = client?.auth.currentUser?.id;

      // Upload avatar se presente (non bloccante)
      String? avatarUrl = state.avatarUrl;
      if (userId != null && state.avatarLocalPath != null) {
        avatarUrl = await _uploadAvatar(userId);
      }

      // Sync Supabase
      if (client != null && userId != null) {
        await client.from('profiles').update({
          'display_name': state.displayName.trim(),
          if (avatarUrl != null) 'avatar_url': avatarUrl,
        }).eq('id', userId);
      }

      // Hive cache incrementale
      await HiveService.saveOnboardingStep1(
        displayName: state.displayName.trim(),
        avatarLocalPath: state.avatarLocalPath,
        avatarUrl: avatarUrl,
      );

      state = state.copyWith(step: OnboardingStep.step2Startup, isSaving: false, avatarUrl: avatarUrl);
      return true;
    } catch (e) {
      debugPrint('[Onboarding] completeStep1 errore: $e');
      // Anche se Supabase fallisce, salva in Hive per offline-first
      await HiveService.saveOnboardingStep1(
        displayName: state.displayName.trim(),
        avatarLocalPath: state.avatarLocalPath,
        avatarUrl: state.avatarUrl,
      );
      state = state.copyWith(step: OnboardingStep.step2Startup, isSaving: false);
      return true;
    }
  }

  Future<bool> completeStep2() async {
    if (!state.isOneLinerValid) {
      state = state.copyWith(error: 'One-liner troppo lungo (max 140)');
      return false;
    }
    if (!state.canProceedStep2) {
      state = state.copyWith(error: 'Inserisci il nome della startup (min 2 caratteri) o scegli “Lo faccio dopo”');
      return false;
    }
    state = state.copyWith(isSaving: true, clearError: true);
    try {
      final client = SupabaseService.clientOrNull;
      final userId = client?.auth.currentUser?.id;

      final payload = <String, dynamic>{
        'startup_name': (state.startupName?.trim().isEmpty ?? true) ? null : state.startupName?.trim(),
        'one_liner': state.oneLiner.trim().isEmpty ? null : state.oneLiner.trim(),
      };

      if (client != null && userId != null) {
        await client.from('profiles').update(payload).eq('id', userId);
      }

      await HiveService.saveOnboardingStep2(
        startupName: payload['startup_name'] as String?,
        oneLiner: payload['one_liner'] as String?,
      );

      state = state.copyWith(step: OnboardingStep.step3Reminder, isSaving: false);
      return true;
    } catch (e) {
      debugPrint('[Onboarding] completeStep2 errore: $e');
      await HiveService.saveOnboardingStep2(
        startupName: state.startupName?.trim(),
        oneLiner: state.oneLiner.trim().isEmpty ? null : state.oneLiner.trim(),
      );
      state = state.copyWith(step: OnboardingStep.step3Reminder, isSaving: false);
      return true;
    }
  }

  Future<bool> completeStep3() async {
    state = state.copyWith(isSaving: true, clearError: true);
    try {
      final client = SupabaseService.clientOrNull;
      final userId = client?.auth.currentUser?.id;
      final nowIso = DateTime.now().toIso8601String();

      // Richiedi permesso notifiche — se negato, completa comunque (fallback richiesto)
      bool granted = false;
      try {
        await NotificationService.initialize();
        granted = await NotificationService.requestPermission();
        state = state.copyWith(notificationGranted: granted);
        if (granted) {
          await NotificationService.scheduleDailyReminder(hour: state.reminderHour);
        }
      } catch (e) {
        debugPrint('[Onboarding] Notifiche errore: $e');
      }

      if (client != null && userId != null) {
        await client.from('profiles').update({
          'onboarding_completed_at': nowIso,
        }).eq('id', userId);
      }

      await HiveService.saveOnboardingStep3(
        reminderHourValue: state.reminderHour,
        completedAtIso: nowIso,
      );

      state = state.copyWith(step: OnboardingStep.done, isSaving: false, notificationGranted: granted);
      // ignore: discarded_futures
      AnalyticsService.track(AnalyticsService.onboardingCompleted, properties: {'reminder_hour': state.reminderHour, 'granted': granted});
      return true;
    } catch (e) {
      debugPrint('[Onboarding] completeStep3 errore: $e');
      final nowIso = DateTime.now().toIso8601String();
      await HiveService.saveOnboardingStep3(
        reminderHourValue: state.reminderHour,
        completedAtIso: nowIso,
      );
      state = state.copyWith(step: OnboardingStep.done, isSaving: false);
      return true;
    }
  }

  /// Salta step 2 (startup opzionale).
  Future<void> skipStep2() async {
    state = state.copyWith(startupName: '', oneLiner: '');
    await completeStep2();
  }

  /// Salta avatar (step 1).
  Future<bool> skipAvatar() async {
    // Mantiene display_name, rimuove avatar se presente
    if (state.avatarLocalPath != null) removeAvatar();
    return completeStep1();
  }

  void goBack() {
    switch (state.step) {
      case OnboardingStep.step2Startup:
        state = state.copyWith(step: OnboardingStep.step1Profile, clearError: true);
        break;
      case OnboardingStep.step3Reminder:
        state = state.copyWith(step: OnboardingStep.step2Startup, clearError: true);
        break;
      default:
        break;
    }
  }

  void reset() {
    HiveService.clearOnboardingCache();
    state = const OnboardingState();
  }
}

final onboardingProvider = StateNotifierProvider<OnboardingNotifier, OnboardingState>((ref) {
  return OnboardingNotifier();
});
