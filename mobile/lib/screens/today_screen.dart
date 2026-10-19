import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../state/room_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'shell_screen.dart';

class TodayScreen extends StatefulWidget {
  const TodayScreen({super.key});

  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
  List<TaskItem> _tasks = [];
  Standup? _standup;
  bool _loadingTasks = true;
  String? _loadedSid;

  final _done = TextEditingController();
  final _todo = TextEditingController();
  final _blockers = TextEditingController();

  @override
  void dispose() {
    _done.dispose();
    _todo.dispose();
    _blockers.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final state = context.read<RoomState>();
    final api = context.read<ApiClient>();
    final sid = state.startupId;
    if (sid == null) {
      setState(() {
        _loadingTasks = false;
      });
      return;
    }
    setState(() => _loadingTasks = true);
    try {
      final t = await api.get('/api/room/tasks?startup_id=$sid');
      final s = await api.get('/api/room/standups?startup_id=$sid');
      setState(() {
        _tasks = (t['tasks'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(TaskItem.fromJson)
            .toList();
        final list = (s['standups'] as List? ?? []).whereType<Map<String, dynamic>>();
        _standup = list.isEmpty ? null : Standup.fromJson(list.first);
        _done.text = _standup?.done ?? '';
        _todo.text = _standup?.todo ?? '';
        _blockers.text = _standup?.blockers ?? '';
      });
    } catch (e) {
      if (mounted) showApiError(context, e);
    } finally {
      if (mounted) setState(() => _loadingTasks = false);
    }
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 5) return 'Buonanotte';
    if (h < 12) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  }

  String get _today => DateTime.now().toIso8601String().substring(0, 10);

  Future<void> _toggleTask(TaskItem t) async {
    final api = context.read<ApiClient>();
    final state = context.read<RoomState>();
    final messenger = ScaffoldMessenger.of(context);
    final next = t.done ? 'todo' : 'done';
    setState(() => _tasks = [
          for (final x in _tasks) x.id == t.id ? x.withStatus(next) : x,
        ]);
    try {
      await api.patch('/api/room/tasks/${t.id}', {'status': next});
      if (next == 'done' && state.streak.todayDone == false) {
        await state.refreshStreak();
      }
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.toString())));
      _load();
    }
  }

  Future<void> _addTask() async {
    final title = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: RoomTheme.card,
        title: const Text('Nuovo task', style: TextStyle(color: RoomTheme.text)),
        content: TextField(
          controller: title,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Cosa devi fare?'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annulla', style: TextStyle(color: RoomTheme.textDim)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Aggiungi', style: TextStyle(color: RoomTheme.room)),
          ),
        ],
      ),
    );
    if (ok != true || title.text.trim().isEmpty) return;
    if (!mounted) return;
    final api = context.read<ApiClient>();
    final state = context.read<RoomState>();
    final sid = state.startupId;
    if (sid == null) return;
    try {
      final j = await api.post('/api/room/tasks', {
        'title': title.text.trim(),
        'startup_id': sid,
        'priority': 'med',
      });
      final task = j['task'];
      if (task is Map<String, dynamic>) {
        setState(() => _tasks = [..._tasks, TaskItem.fromJson(task)]);
      }
    } catch (e) {
      if (mounted) showApiError(context, e);
    }
  }

  Future<void> _saveStandup() async {
    final api = context.read<ApiClient>();
    final state = context.read<RoomState>();
    final messenger = ScaffoldMessenger.of(context);
    final sid = state.startupId;
    if (sid == null) return;
    try {
      await api.post('/api/room/standups', {
        'startup_id': sid,
        'day': _today,
        'done': _done.text.trim(),
        'todo': _todo.text.trim(),
        'blockers': _blockers.text.trim(),
      });
      await state.refreshStreak();
      messenger.showSnackBar(
        const SnackBar(content: Text('Standup salvato. Buon shipping!')),
      );
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<RoomState>();
    final name = state.displayName;

    // Carica task/standup appena la startup attiva è disponibile.
    if (!_loadingTasks &&
        state.startupId != null &&
        _loadedSid != state.startupId) {
      _loadedSid = state.startupId;
      Future.microtask(_load);
    }

    return RefreshIndicator(
      color: RoomTheme.room,
      onRefresh: () => Future.wait([state.load(), _load()]),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Saluto
          Row(
            children: [
              Expanded(
                child: Text(
                  '$_greeting, $name',
                  style: const TextStyle(
                    color: RoomTheme.text,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const Icon(Icons.wb_sunny_outlined, color: RoomTheme.room),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            ddmmyyyy(DateTime.now()),
            style: const TextStyle(color: RoomTheme.textFaint, fontSize: 12),
          ),
          const SizedBox(height: 16),

          // Selettore startup
          if (state.startups.isNotEmpty)
            DropdownButton<String>(
              value: state.startupId,
              isExpanded: true,
              underline: const SizedBox.shrink(),
              dropdownColor: RoomTheme.card,
              style: const TextStyle(color: RoomTheme.text, fontSize: 14),
              items: [
                for (final s in state.startups)
                  DropdownMenuItem(value: s.id, child: Text(s.name)),
              ],
              onChanged: (v) {
                state.selectStartup(v);
                _load();
              },
            ),
          const SizedBox(height: 16),

          // Streak
          SectionCard(
            kicker: 'Streak di shipping',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.local_fire_department,
                        color: RoomTheme.room, size: 28),
                    const SizedBox(width: 10),
                    Text(
                      '${state.streak.current} giorni',
                      style: const TextStyle(
                        color: RoomTheme.text,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'record ${state.streak.longest}',
                      style: const TextStyle(
                          color: RoomTheme.textFaint, fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: state.streak.todayDone
                      ? null
                      : () async {
                          final messenger = ScaffoldMessenger.of(context);
                          try {
                            await state.markShipped();
                          } catch (e) {
                            messenger.showSnackBar(
                                SnackBar(content: Text(e.toString())));
                          }
                        },
                  icon: Icon(
                    state.streak.todayDone ? Icons.check : Icons.rocket_launch,
                    size: 18,
                  ),
                  label: Text(state.streak.todayDone
                      ? 'Oggi hai shippato ✓'
                      : 'Ho shippato oggi'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Standup
          SectionCard(
            kicker: 'Standup di oggi',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StandupField(
                  controller: _done,
                  label: 'Cosa hai fatto',
                  hint: 'Le cose completate oggi…',
                ),
                _StandupField(
                  controller: _todo,
                  label: 'Cosa farai',
                  hint: 'I prossimi passi…',
                ),
                _StandupField(
                  controller: _blockers,
                  label: 'Bloccanti',
                  hint: 'Cosa ti sta fermando…',
                  maxLines: 2,
                ),
                const SizedBox(height: 4),
                FilledButton(
                  onPressed: _saveStandup,
                  child: const Text('Salva standup'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Task
          SectionCard(
            kicker: 'Task',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_loadingTasks)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: RoomTheme.room),
                      ),
                    ),
                  )
                else if (_tasks.isEmpty)
                  const EmptyState(
                    icon: Icons.checklist_outlined,
                    text: 'Nessun task. Aggiungi il prossimo passo.',
                  )
                else
                  for (final t in _tasks)
                    CheckboxListTile(
                      value: t.done,
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      activeColor: RoomTheme.room,
                      checkColor: RoomTheme.bg,
                      title: Text(
                        t.title,
                        style: TextStyle(
                          color: t.done ? RoomTheme.textFaint : RoomTheme.text,
                          fontSize: 14,
                          decoration: t.done ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      onChanged: (_) => _toggleTask(t),
                    ),
                const SizedBox(height: 4),
                OutlinedButton.icon(
                  onPressed: _addTask,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Nuovo task'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _StandupField extends StatelessWidget {
  const _StandupField({
    required this.controller,
    required this.label,
    required this.hint,
    this.maxLines = 3,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: RoomTheme.textDim,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: controller,
            maxLines: maxLines,
            style: const TextStyle(color: RoomTheme.text, fontSize: 13),
            decoration: InputDecoration(hintText: hint),
          ),
        ],
      ),
    );
  }
}
