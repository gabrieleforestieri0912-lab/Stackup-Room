import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/analytics/analytics_service.dart';
import '../../core/storage/hive_service.dart';
import '../../core/sync/outbox_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_error_view.dart';
import '../../core/widgets/two_pane_layout.dart';
import '../auth/auth_provider.dart';
import '../startup/presentation/project_switcher.dart';
import '../startup/startup_provider.dart';
import 'checkin_provider.dart';

/// Home "Today" — Fase 2
/// AppBar saluto + streak, Tab Todo/Schedule, lista task, standup rapido, empty state.
/// Animazioni rispettano MediaQuery.disableAnimations + RepaintBoundary per sezioni animate.
class CheckinScreen extends ConsumerStatefulWidget {
  const CheckinScreen({super.key});

  @override
  ConsumerState<CheckinScreen> createState() => _CheckinScreenState();
}

class _CheckinScreenState extends ConsumerState<CheckinScreen> with SingleTickerProviderStateMixin {
  bool _hasError = false;
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final auth = ref.watch(authProvider);
    final streak = ref.watch(streakProvider);
    final reduceMotion = MediaQuery.of(context).disableAnimations;

    if (_hasError) {
      return Scaffold(
        appBar: AppBar(title: const Text('Stackup Room')),
        body: AppErrorView(
          title: 'Supabase non raggiungibile',
          message: 'Verifica la connessione. L\'app resta usabile offline (Hive).',
          onRetry: () => setState(() => _hasError = false),
        ),
      );
    }

    final displayName = (auth.profile?['display_name'] as String?) ?? HiveService.onboardingDisplayName ?? auth.user?.email?.split('@').first ?? 'Founder';
    final startupName = (auth.profile?['startup_name'] as String?) ?? HiveService.onboardingStartupName;
    final hasStartup = startupName != null && startupName.trim().isNotEmpty;

    // Desktop ≥900px: TwoPaneLayout mette lista a sinistra e dettaglio a destra
    // (breakpoint centralizzato in Breakpoints, vedi core/widgets/two_pane_layout.dart).
    final body = CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              backgroundColor: c.background,
              title: Text(_greeting(displayName), style: TextStyle(color: c.text, fontSize: 16, fontWeight: FontWeight.w700)),
              actions: [
                const ProjectSwitcher(),
                const SizedBox(width: 8),
                RepaintBoundary(child: _StreakBadge(streak: streak, c: c, reduceMotion: reduceMotion)),
                const SizedBox(width: 12),
              ],
              bottom: TabBar(
                controller: _tab,
                labelColor: c.text,
                unselectedLabelColor: c.textTertiary,
                indicatorColor: c.accentSignal,
                indicatorWeight: 2.5,
                tabs: const [Tab(text: 'Todo'), Tab(text: 'Schedule')],
              ),
            ),
            SliverToBoxAdapter(child: _StandupCard(c: c)),
            if (!hasStartup)
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: c.accentSignal.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(12), border: Border.all(color: c.accentSignal.withValues(alpha: 0.25))),
                  child: Row(children: [
                    Icon(Icons.rocket_launch_rounded, size: 18, color: c.accentSignal),
                    const SizedBox(width: 10),
                    Expanded(child: Text('Aggiungi la tua prima startup per filtrare i task per progetto.', style: TextStyle(color: c.text, fontSize: 12, fontWeight: FontWeight.w500))),
                    TextButton(onPressed: () => DefaultTabController.of(context), child: Text('Aggiungi', style: TextStyle(color: c.accentSignal, fontWeight: FontWeight.w700))),
                  ]),
                ),
              ),
            SliverFillRemaining(
              child: TabBarView(
                controller: _tab,
                children: [
                  _TodoTab(c: c, reduceMotion: reduceMotion, hasStartup: hasStartup),
                  _ScheduleTab(c: c, reduceMotion: reduceMotion),
                ],
              ),
            ),
          ],
        );

    return Scaffold(
      backgroundColor: c.background,
      body: TwoPaneLayout(
        bodyBuilder: (context, isDesktop) => body,
        secondary: _DesktopDetailPane(c: c),
      ),
    );
  }

  String _greeting(String name) {
    final h = DateTime.now().hour;
    final saluto = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera';
    return '$saluto, $name';
  }
}

class _DesktopDetailPane extends StatelessWidget {
  const _DesktopDetailPane({required this.c});
  final AppColors c;
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Dettaglio', style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 14)),
        const SizedBox(height: 8),
        Text('Seleziona un task o un blocco orario per vederne il dettaglio. (Fase 3: portfolio startup)', style: TextStyle(color: c.textSecondary, fontSize: 12, height: 1.4)),
        const SizedBox(height: 16),
        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: c.border)), child: Text('Windows layout 2-colonne attivo (>900px) — verifica responsive Fase 8.', style: TextStyle(color: c.textTertiary, fontSize: 11))),
      ],
    );
  }
}

// ------------------------------------------------------------
// Streak badge con bounce scale quando incrementa
// ------------------------------------------------------------
class _StreakBadge extends StatefulWidget {
  const _StreakBadge({required this.streak, required this.c, required this.reduceMotion});
  final int streak;
  final AppColors c;
  final bool reduceMotion;
  @override
  State<_StreakBadge> createState() => _StreakBadgeState();
}

class _StreakBadgeState extends State<_StreakBadge> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;
  int _prev = 0;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(duration: const Duration(milliseconds: 520), vsync: this);
    _scale = Tween<double>(begin: 1, end: 1.18).animate(CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut));
  }

  @override
  void didUpdateWidget(covariant _StreakBadge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.streak > _prev && !widget.reduceMotion) {
      _ctrl.forward(from: 0).then((_) => _ctrl.reverse());
    }
    _prev = widget.streak;
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _scale,
        builder: (context, child) => Transform.scale(scale: _scale.value, child: child),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: widget.streak > 0 ? widget.c.accentSignal : widget.c.surfaceAlt, borderRadius: BorderRadius.circular(20), border: Border.all(color: widget.streak > 0 ? widget.c.accentSignal : widget.c.border)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.local_fire_department_rounded, size: 16, color: widget.streak > 0 ? Colors.white : widget.c.textTertiary),
            const SizedBox(width: 4),
            Text('${widget.streak}', style: TextStyle(color: widget.streak > 0 ? Colors.white : widget.c.textTertiary, fontWeight: FontWeight.w800, fontSize: 13)),
          ]),
        ),
      ),
    );
  }
}

// ------------------------------------------------------------
// Standup rapido — 3 campi brevi, salva su Hive + Supabase
// ------------------------------------------------------------
class _StandupCard extends ConsumerStatefulWidget {
  const _StandupCard({required this.c});
  final AppColors c;
  @override
  ConsumerState<_StandupCard> createState() => _StandupCardState();
}

class _StandupCardState extends ConsumerState<_StandupCard> {
  final _ieri = TextEditingController();
  final _oggi = TextEditingController();
  final _blocchi = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _ieri.dispose();
    _oggi.dispose();
    _blocchi.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: widget.c.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: widget.c.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [Icon(Icons.wb_sunny_rounded, size: 16, color: widget.c.accentSignal), const SizedBox(width: 6), Text('Standup rapido — <30s', style: TextStyle(color: widget.c.text, fontWeight: FontWeight.w700, fontSize: 13))]),
        const SizedBox(height: 4),
        Text('Cosa hai fatto ieri / oggi / blocchi?', style: TextStyle(color: widget.c.textSecondary, fontSize: 12)),
        const SizedBox(height: 12),
        TextField(controller: _ieri, decoration: InputDecoration(hintText: 'Ieri: ...', prefixIcon: const Icon(Icons.history_rounded, size: 18)), maxLines: 1),
        const SizedBox(height: 8),
        TextField(controller: _oggi, decoration: InputDecoration(hintText: 'Oggi: ...', prefixIcon: const Icon(Icons.today_rounded, size: 18)), maxLines: 1),
        const SizedBox(height: 8),
        TextField(controller: _blocchi, decoration: InputDecoration(hintText: 'Blocchi: ...', prefixIcon: const Icon(Icons.block_rounded, size: 18)), maxLines: 1),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _saving
                ? null
                : () async {
                    final messenger = ScaffoldMessenger.of(context);
                    setState(() => _saving = true);
                    final body = 'Ieri:${_ieri.text} | Oggi:${_oggi.text} | Blocchi:${_blocchi.text}';
                    final date = DateTime.now().toIso8601String().substring(0, 10);
                    await ref.read(checkinProvider.notifier).setLastCheckin(date, body);
                    // Fase 8: sync offline-first — upsert idempotente su user_id+day.
                    await OutboxService.queueStandup(
                      day: date,
                      yesterday: _ieri.text.trim().isEmpty ? null : _ieri.text.trim(),
                      today: _oggi.text.trim().isEmpty ? null : _oggi.text.trim(),
                      blockers: _blocchi.text.trim().isEmpty ? null : _blocchi.text.trim(),
                    );
                    final sync = await OutboxService.flush();
                    // Analytics: primo check-in (streak passa da 0 a 1)
                    final isFirst = ref.read(streakProvider) == 1;
                    if (isFirst) {
                      // ignore: discarded_futures
                      AnalyticsService.track(AnalyticsService.firstCheckinCompleted);
                    }
                    if (!mounted) return;
                    messenger.showSnackBar(SnackBar(content: Text(sync.pending > 0
                        ? 'Standup salvato offline — in attesa di sync (${sync.pending}) 🔥'
                        : 'Standup salvato — streak ${ref.read(streakProvider)} 🔥')));
                    _ieri.clear();
                    _oggi.clear();
                    _blocchi.clear();
                    setState(() => _saving = false);
                  },
            child: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Salva standup'),
          ),
        ),
      ]),
    );
  }
}

// ------------------------------------------------------------
// Todo tab — lista task raggruppati per progetto, checkbox con animazione
// ------------------------------------------------------------
class _TodoTab extends ConsumerStatefulWidget {
  const _TodoTab({required this.c, required this.reduceMotion, required this.hasStartup});
  final AppColors c;
  final bool reduceMotion;
  final bool hasStartup;
  @override
  ConsumerState<_TodoTab> createState() => _TodoTabState();
}

class _TodoTabState extends ConsumerState<_TodoTab> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(todayProvider);
    final startups = ref.watch(startupProvider);
    final filterName = startups.selected?.name;
    final filtered = filterName == null ? state.tasks : state.tasks.where((t) => (t.project ?? 'Generale') == filterName).toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (filterName != null)
          Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: widget.c.accentSignal.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(8)), child: Text('Filtrato: $filterName — ${filtered.length} task', style: TextStyle(color: widget.c.accentSignal, fontSize: 11, fontWeight: FontWeight.w600))),
        Row(children: [
          Expanded(child: TextField(controller: _ctrl, decoration: InputDecoration(hintText: filterName == null ? 'Aggiungi task del giorno...' : 'Aggiungi task per $filterName...', prefixIcon: const Icon(Icons.add_task_rounded)), onSubmitted: (v) => _add())),
          const SizedBox(width: 8),
          ElevatedButton(onPressed: _add, child: const Text('Aggiungi')),
        ]),
        const SizedBox(height: 16),
        if (filtered.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: widget.c.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: widget.c.border)),
            child: Column(children: [
              Icon(Icons.task_alt_rounded, color: widget.c.textTertiary, size: 32),
              const SizedBox(height: 8),
              Text('Nessun task ancora', style: TextStyle(color: widget.c.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 4),
              Text('Aggiungi il primo task per iniziare il momentum.', style: TextStyle(color: widget.c.textTertiary, fontSize: 12), textAlign: TextAlign.center),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: () => _ctrl.text = 'Es. Definisci MVP pricing', child: const Text('Suggerisci esempio')),
            ]),
          )
        else
          ..._grouped(filtered),
      ],
    );
  }

  void _add() {
    final v = _ctrl.text.trim();
    if (v.isEmpty) return;
    final sel = ref.read(startupProvider).selected?.name;
    ref.read(todayProvider.notifier).addTask(v, project: sel);
    _ctrl.clear();
  }

  List<Widget> _grouped(List<TodayTask> tasks) {
    final byProject = <String, List<TodayTask>>{};
    for (final t in tasks) {
      byProject.putIfAbsent(t.project ?? 'Generale', () => []).add(t);
    }
    final out = <Widget>[];
    for (final entry in byProject.entries) {
      out.add(Padding(
        padding: const EdgeInsets.only(top: 12, bottom: 6),
        child: Text(entry.key, style: TextStyle(color: widget.c.textSecondary, fontWeight: FontWeight.w700, fontSize: 11, letterSpacing: 0.6)),
      ));
      for (final task in entry.value) {
        out.add(_TaskRow(task: task, c: widget.c, reduceMotion: widget.reduceMotion));
      }
    }
    return out;
  }
}

class _TaskRow extends ConsumerWidget {
  const _TaskRow({required this.task, required this.c, required this.reduceMotion});
  final TodayTask task;
  final AppColors c;
  final bool reduceMotion;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final completed = task.completed;
    return RepaintBoundary(
      child: AnimatedContainer(
        duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 220),
        curve: Curves.easeOut,
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(color: completed ? c.surfaceAlt.withValues(alpha: 0.6) : c.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: completed ? c.border.withValues(alpha: 0.6) : c.border)),
        child: AnimatedOpacity(
          duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
          opacity: completed ? 0.62 : 1,
          child: ListTile(
            leading: Checkbox(
              value: completed,
              activeColor: c.success,
              onChanged: (_) => ref.read(todayProvider.notifier).toggle(task.id),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            title: AnimatedDefaultTextStyle(
              duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 200),
              style: TextStyle(color: completed ? c.textTertiary : c.text, fontWeight: FontWeight.w500, fontSize: 14, decoration: completed ? TextDecoration.lineThrough : TextDecoration.none, decorationColor: c.textTertiary),
              child: Text(task.title),
            ),
            trailing: IconButton(icon: Icon(Icons.close_rounded, size: 18, color: c.textTertiary), onPressed: () => ref.read(todayProvider.notifier).remove(task.id)),
            onTap: () => ref.read(todayProvider.notifier).toggle(task.id),
          ),
        ),
      ),
    );
  }
}

// ------------------------------------------------------------
// Schedule tab — blocchi trascinabili con LongPressDraggable
// ------------------------------------------------------------
class _ScheduleTab extends ConsumerWidget {
  const _ScheduleTab({required this.c, required this.reduceMotion});
  final AppColors c;
  final bool reduceMotion;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sched = ref.watch(scheduleProvider);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Trascina i blocchi per ripianificare (long-press)', style: TextStyle(color: c.textTertiary, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.3)),
        const SizedBox(height: 12),
        for (int hour = 7; hour <= 20; hour++)
          _HourSlot(hour: hour, c: c, reduceMotion: reduceMotion, blocks: sched.blocks.where((b) => b.hour == hour).toList()),
        const SizedBox(height: 12),
        OutlinedButton.icon(onPressed: () => _addDialog(context, ref), icon: const Icon(Icons.add_rounded, size: 18), label: const Text('Aggiungi blocco')),
      ],
    );
  }

  void _addDialog(BuildContext context, WidgetRef ref) {
    final ctrl = TextEditingController();
    int hour = 10;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) => AlertDialog(
            title: const Text('Nuovo blocco'),
            content: Column(mainAxisSize: MainAxisSize.min, children: [
              TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'Titolo blocco'), autofocus: true),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                IconButton(onPressed: () => setS(() => hour = (hour - 1).clamp(0, 23)), icon: Icon(Icons.remove_circle_outline_rounded, color: c.primary)),
                Container(width: 80, padding: const EdgeInsets.symmetric(vertical: 8), decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(8)), child: Text('${hour.toString().padLeft(2, '0')}:00', textAlign: TextAlign.center, style: TextStyle(color: c.primaryLight, fontWeight: FontWeight.w700))),
                IconButton(onPressed: () => setS(() => hour = (hour + 1).clamp(0, 23)), icon: Icon(Icons.add_circle_outline_rounded, color: c.primary)),
              ]),
            ]),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annulla')),
              ElevatedButton(onPressed: () { if (ctrl.text.trim().isNotEmpty) ref.read(scheduleProvider.notifier).add(hour, ctrl.text.trim()); Navigator.pop(ctx); }, child: const Text('Aggiungi')),
            ],
          )),
    );
  }
}

class _HourSlot extends ConsumerWidget {
  const _HourSlot({required this.hour, required this.c, required this.reduceMotion, required this.blocks});
  final int hour;
  final AppColors c;
  final bool reduceMotion;
  final List<ScheduleBlock> blocks;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DragTarget<ScheduleBlock>(
      onAcceptWithDetails: (d) => ref.read(scheduleProvider.notifier).move(d.data.id, hour),
      builder: (context, candidate, rejected) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(color: candidate.isNotEmpty ? c.accentSignal.withValues(alpha: 0.08) : c.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: candidate.isNotEmpty ? c.accentSignal.withValues(alpha: 0.4) : c.border)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 52, child: Text('${hour.toString().padLeft(2, '0')}:00', style: TextStyle(color: c.textTertiary, fontWeight: FontWeight.w700, fontSize: 11))),
          Expanded(
            child: blocks.isEmpty
                ? Text('— libero', style: TextStyle(color: c.textTertiary, fontSize: 12, fontStyle: FontStyle.italic))
                : Column(children: [for (final b in blocks) _DraggableBlock(block: b, c: c, reduceMotion: reduceMotion)]),
          ),
        ]),
      ),
    );
  }
}

class _DraggableBlock extends StatelessWidget {
  const _DraggableBlock({required this.block, required this.c, required this.reduceMotion});
  final ScheduleBlock block;
  final AppColors c;
  final bool reduceMotion;

  @override
  Widget build(BuildContext context) {
    final child = Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: c.primaryMuted, borderRadius: BorderRadius.circular(10), border: Border.all(color: c.border)),
      child: Row(children: [Icon(Icons.drag_indicator_rounded, size: 16, color: c.textTertiary), const SizedBox(width: 8), Expanded(child: Text(block.title, style: TextStyle(color: c.text, fontSize: 13, fontWeight: FontWeight.w500))), IconButton(padding: EdgeInsets.zero, constraints: const BoxConstraints(), icon: Icon(Icons.close_rounded, size: 16, color: c.textTertiary), onPressed: () {})]),
    );
    if (reduceMotion) return child;
    return LongPressDraggable<ScheduleBlock>(
      data: block,
      feedback: Transform.scale(scale: 1.04, child: Material(color: Colors.transparent, child: Opacity(opacity: 0.9, child: child))),
      childWhenDragging: Opacity(opacity: 0.35, child: child),
      child: child,
    );
  }
}
