import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/notifications/notification_service.dart';
import '../../core/theme/app_colors.dart';
import 'onboarding_provider.dart';

/// Wizard onboarding 3-step — lightweight, coerente con docs/scope.md.
/// Step 1: display_name + avatar (skippabile)
/// Step 2: startup_name + one_liner 140char + counter
/// Step 3: reminder hour picker + permessi notifiche + welcome/confirm
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key, this.onProfileRefreshed});

  /// Callback chiamato dopo completamento (per refresh auth).
  final VoidCallback? onProfileRefreshed;

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _nameCtrl = TextEditingController();
  final _startupCtrl = TextEditingController();
  final _oneLinerCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final s = ref.read(onboardingProvider);
      _nameCtrl.text = s.displayName;
      _startupCtrl.text = s.startupName ?? '';
      _oneLinerCtrl.text = s.oneLiner;
    });
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _startupCtrl.dispose();
    _oneLinerCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(onboardingProvider);
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;

    // Sincronizza controller quando lo stato cambia esternamente (es. loadFromProfile)
    if (_nameCtrl.text != state.displayName && state.displayName.isNotEmpty) {
      _nameCtrl.text = state.displayName;
    }

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _ProgressBar(step: state.stepIndex, color: c),
            Expanded(
              child: switch (state.step) {
                OnboardingStep.step1Profile => _Step1Profile(
                    state: state,
                    nameCtrl: _nameCtrl,
                    c: c,
                  ),
                OnboardingStep.step2Startup => _Step2Startup(
                    state: state,
                    startupCtrl: _startupCtrl,
                    oneLinerCtrl: _oneLinerCtrl,
                    c: c,
                  ),
                OnboardingStep.step3Reminder => _Step3Reminder(state: state, c: c),
                OnboardingStep.done => _StepDone(c: c),
              },
            ),
            if (state.error != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: c.error.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: c.error.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline_rounded, color: c.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(state.error!, style: TextStyle(color: c.error, fontSize: 13))),
                  ],
                ),
              ),
            _BottomBar(state: state, c: c, onDone: widget.onProfileRefreshed),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({required this.step, required this.color});
  final int step;
  final AppColors color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        children: [
          for (int i = 0; i < 3; i++)
            Expanded(
              child: Container(
                height: 4,
                margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                decoration: BoxDecoration(
                  color: i <= step ? color.primary : color.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          const SizedBox(width: 12),
          Text('${(step + 1).clamp(1, 3)}/3',
              style: TextStyle(color: color.textTertiary, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------
// Step 1 — Profilo
// ------------------------------------------------------------
class _Step1Profile extends ConsumerWidget {
  const _Step1Profile({required this.state, required this.nameCtrl, required this.c});
  final OnboardingState state;
  final TextEditingController nameCtrl;
  final AppColors c;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Chi sei?', style: TextStyle(color: c.text, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
          const SizedBox(height: 6),
          Text('Il tuo nome nella Room. L\'avatar è opzionale.',
              style: TextStyle(color: c.textSecondary, fontSize: 14, height: 1.4)),
          const SizedBox(height: 28),
          Center(
            child: Stack(
              children: [
                _AvatarPreview(state: state, c: c),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Material(
                    color: c.primary,
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () => _showAvatarSheet(context, ref),
                      child: const Padding(
                        padding: EdgeInsets.all(8),
                        child: Icon(Icons.camera_alt_rounded, color: Colors.white, size: 16),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: TextButton(
              onPressed: state.avatarLocalPath != null || state.avatarUrl != null
                  ? () => ref.read(onboardingProvider.notifier).removeAvatar()
                  : null,
              child: Text('Rimuovi avatar', style: TextStyle(color: c.textTertiary, fontSize: 12)),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: nameCtrl,
            textInputAction: TextInputAction.done,
            textCapitalization: TextCapitalization.words,
            onChanged: (v) => ref.read(onboardingProvider.notifier).setDisplayName(v),
            decoration: InputDecoration(
              labelText: 'Nome visualizzato *',
              hintText: 'Es. Alice — founder @ Acme',
              prefixIcon: const Icon(Icons.person_outline_rounded),
            ),
          ),
          const SizedBox(height: 8),
          Text('Minimo 2 caratteri. Visibile in leaderboard.',
              style: TextStyle(color: c.textTertiary, fontSize: 11)),
        ],
      ),
    );
  }

  void _showAvatarSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 36, height: 4, margin: const EdgeInsets.only(bottom: 16), decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(2))),
              ListTile(
                leading: Icon(Icons.photo_library_rounded, color: c.primary),
                title: const Text('Scegli dalla galleria'),
                onTap: () {
                  Navigator.pop(ctx);
                  ref.read(onboardingProvider.notifier).pickAvatar();
                },
              ),
              ListTile(
                leading: Icon(Icons.photo_camera_rounded, color: c.primary),
                title: const Text('Scatta foto'),
                onTap: () {
                  Navigator.pop(ctx);
                  ref.read(onboardingProvider.notifier).pickAvatarCamera();
                },
              ),
              if (state.avatarLocalPath != null || state.avatarUrl != null)
                ListTile(
                  leading: Icon(Icons.delete_outline_rounded, color: c.error),
                  title: Text('Rimuovi avatar', style: TextStyle(color: c.error)),
                  onTap: () {
                    Navigator.pop(ctx);
                    ref.read(onboardingProvider.notifier).removeAvatar();
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AvatarPreview extends StatelessWidget {
  const _AvatarPreview({required this.state, required this.c});
  final OnboardingState state;
  final AppColors c;

  @override
  Widget build(BuildContext context) {
    final localPath = state.avatarLocalPath;
    final url = state.avatarUrl;
    Widget? image;
    if (localPath != null) {
      final file = File(localPath);
      // ignore: unnecessary_underscores
      image = ClipOval(child: Image.file(file, width: 96, height: 96, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _placeholder()));
    } else if (url != null) {
      // ignore: unnecessary_underscores
      image = ClipOval(child: Image.network(url, width: 96, height: 96, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _placeholder()));
    }
    return Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        color: c.surfaceAlt,
        shape: BoxShape.circle,
        border: Border.all(color: c.border, width: 1.5),
      ),
      child: image ?? _placeholder(),
    );
  }

  Widget _placeholder() {
    return Center(child: Icon(Icons.person_rounded, color: c.textTertiary, size: 40));
  }
}

// ------------------------------------------------------------
// Step 2 — Startup
// ------------------------------------------------------------
class _Step2Startup extends ConsumerWidget {
  const _Step2Startup({required this.state, required this.startupCtrl, required this.oneLinerCtrl, required this.c});
  final OnboardingState state;
  final TextEditingController startupCtrl;
  final TextEditingController oneLinerCtrl;
  final AppColors c;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remaining = 140 - state.oneLiner.length;
    final nearLimit = remaining <= 20;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('La tua startup', style: TextStyle(color: c.text, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
          const SizedBox(height: 6),
          Text('Opzionale — puoi saltare e completare dopo.',
              style: TextStyle(color: c.textSecondary, fontSize: 14, height: 1.4)),
          const SizedBox(height: 28),
          TextField(
            controller: startupCtrl,
            textInputAction: TextInputAction.next,
            textCapitalization: TextCapitalization.words,
            onChanged: (v) => ref.read(onboardingProvider.notifier).setStartupName(v.isEmpty ? null : v),
            decoration: const InputDecoration(
              labelText: 'Nome startup (opzionale)',
              hintText: 'Es. Acme AI',
              prefixIcon: Icon(Icons.rocket_launch_outlined),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: oneLinerCtrl,
            maxLength: 140,
            maxLines: 3,
            buildCounter: (ctx, {required currentLength, required isFocused, maxLength}) {
              final rem = (maxLength ?? 140) - currentLength;
              return Text('$rem/140',
                  style: TextStyle(
                    color: rem < 0
                        ? c.error
                        : rem <= 20
                            ? c.warning
                            : c.textTertiary,
                    fontSize: 11,
                    fontWeight: rem <= 20 ? FontWeight.w600 : FontWeight.w400,
                  ));
            },
            onChanged: (v) => ref.read(onboardingProvider.notifier).setOneLiner(v),
            decoration: InputDecoration(
              labelText: 'One-liner (opzionale)',
              hintText: 'Descrivi la tua startup in una frase',
              prefixIcon: const Icon(Icons.short_text_rounded),
              counterStyle: TextStyle(color: nearLimit ? c.warning : c.textTertiary, fontSize: 11),
            ),
          ),
          const SizedBox(height: 4),
          Text('Max 140 caratteri — apparirà nella leaderboard.',
              style: TextStyle(color: c.textTertiary, fontSize: 11)),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------
// Step 3 — Reminder
// ------------------------------------------------------------
class _Step3Reminder extends ConsumerWidget {
  const _Step3Reminder({required this.state, required this.c});
  final OnboardingState state;
  final AppColors c;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Promemoria giornaliero',
              style: TextStyle(color: c.text, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
          const SizedBox(height: 6),
          Text('A che ora vuoi ricevere il promemoria per il check-in?',
              style: TextStyle(color: c.textSecondary, fontSize: 14, height: 1.4)),
          const SizedBox(height: 28),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: c.border),
            ),
            child: Column(
              children: [
                Icon(Icons.notifications_active_rounded, color: c.primary, size: 32),
                const SizedBox(height: 12),
                Text('Ogni giorno alle',
                    style: TextStyle(color: c.textSecondary, fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 0.3)),
                const SizedBox(height: 12),
                _HourPicker(hour: state.reminderHour, c: c),
                const SizedBox(height: 12),
                Text('Notifica locale — puoi cambiarla dopo dal profilo.',
                    style: TextStyle(color: c.textTertiary, fontSize: 11), textAlign: TextAlign.center),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (state.notificationGranted == false)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: c.warning.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: c.warning.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.notifications_off_rounded, color: c.warning, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('Permesso notifiche negato. Completare comunque senza promemoria.',
                        style: TextStyle(color: c.warning, fontSize: 12)),
                  ),
                  TextButton(
                    onPressed: () => NotificationService.openSettings(),
                    child: const Text('Impostazioni', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _HourPicker extends ConsumerWidget {
  const _HourPicker({required this.hour, required this.c});
  final int hour;
  final AppColors c;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          onPressed: () => ref.read(onboardingProvider.notifier).setReminderHour(hour - 1),
          icon: Icon(Icons.remove_circle_outline_rounded, color: c.primary),
        ),
        Container(
          width: 96,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: c.primaryMuted,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '${hour.toString().padLeft(2, '0')}:00',
            textAlign: TextAlign.center,
            style: TextStyle(color: c.primaryLight, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: 0.5),
          ),
        ),
        IconButton(
          onPressed: () => ref.read(onboardingProvider.notifier).setReminderHour(hour + 1),
          icon: Icon(Icons.add_circle_outline_rounded, color: c.primary),
        ),
      ],
    );
  }
}

// ------------------------------------------------------------
// Done — Welcome
// ------------------------------------------------------------
class _StepDone extends StatelessWidget {
  const _StepDone({required this.c});
  final AppColors c;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Spacer(),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(24)),
            child: Icon(Icons.check_rounded, color: c.primaryLight, size: 40),
          ),
          const SizedBox(height: 20),
          Text('Benvenuto nella Room 🚀',
              style: TextStyle(color: c.text, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5),
              textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text('Profilo attivo. Pronto per il tuo primo daily check-in?',
              style: TextStyle(color: c.textSecondary, fontSize: 14, height: 1.4), textAlign: TextAlign.center),
          const Spacer(),
        ],
      ),
    );
  }
}

// ------------------------------------------------------------
// Bottom bar
// ------------------------------------------------------------
class _BottomBar extends ConsumerWidget {
  const _BottomBar({required this.state, required this.c, this.onDone});
  final OnboardingState state;
  final AppColors c;
  final VoidCallback? onDone;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(onboardingProvider.notifier);

    Future<void> handlePrimary() async {
      switch (state.step) {
        case OnboardingStep.step1Profile:
          final ok = await notifier.completeStep1();
          if (!ok && context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.error ?? 'Controlla i campi')));
          }
          break;
        case OnboardingStep.step2Startup:
          await notifier.completeStep2();
          break;
        case OnboardingStep.step3Reminder:
          final ok = await notifier.completeStep3();
          if (ok) {
            onDone?.call();
            // Refresh auth per navigare a home
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.notificationGranted == false
                      ? 'Profilo attivo — promemoria disattivato (permesso negato)'
                      : 'Profilo attivo — promemoria alle ${state.reminderHour}:00 🔔'),
                ),
              );
            }
          }
          break;
        case OnboardingStep.done:
          onDone?.call();
          break;
      }
    }

    final isStep3 = state.step == OnboardingStep.step3Reminder;
    final isDone = state.step == OnboardingStep.done;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: state.isSaving
                  ? null
                  : () {
                      if (state.step == OnboardingStep.step1Profile && !state.canProceedStep1) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Inserisci un nome di almeno 2 caratteri')));
                        return;
                      }
                      handlePrimary();
                    },
              child: state.isSaving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(
                      switch (state.step) {
                        OnboardingStep.step1Profile => 'Continua',
                        OnboardingStep.step2Startup => 'Continua',
                        OnboardingStep.step3Reminder => 'Entra nella Room →',
                        OnboardingStep.done => 'Vai al check-in',
                      },
                    ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (state.step != OnboardingStep.step1Profile && !isDone)
                TextButton(
                  onPressed: state.isSaving ? null : () => notifier.goBack(),
                  child: const Text('Indietro'),
                ),
              const Spacer(),
              if (state.step == OnboardingStep.step1Profile)
                TextButton(
                  onPressed: state.isSaving
                      ? null
                      : () async {
                          if (!state.canProceedStep1) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Inserisci prima un nome valido')));
                            return;
                          }
                          await notifier.completeStep1();
                        },
                  child: Text('Salta avatar', style: TextStyle(color: c.textSecondary)),
                ),
              if (state.step == OnboardingStep.step2Startup)
                TextButton(
                  onPressed: state.isSaving ? null : () => notifier.skipStep2(),
                  child: Text('Salta per ora', style: TextStyle(color: c.textSecondary)),
                ),
              if (isStep3)
                TextButton(
                  onPressed: state.isSaving
                      ? null
                      : () async {
                          // Completa anche senza permesso notifiche
                          final ok = await notifier.completeStep3();
                          if (ok) onDone?.call();
                        },
                  child: Text('Continua senza promemoria', style: TextStyle(color: c.textTertiary, fontSize: 12)),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
