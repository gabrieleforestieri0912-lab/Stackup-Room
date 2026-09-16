// ignore_for_file: use_build_context_synchronously

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/startup.dart';
import '../startup_provider.dart';

class StartupDetailSheet extends ConsumerStatefulWidget {
  const StartupDetailSheet({super.key, required this.startup});
  final Startup startup;

  @override
  ConsumerState<StartupDetailSheet> createState() => _StartupDetailSheetState();
}

class _StartupDetailSheetState extends ConsumerState<StartupDetailSheet> {
  late TextEditingController _name;
  late TextEditingController _desc;
  late TextEditingController _website;
  late TextEditingController _notes;
  late StartupStatus _status;
  late bool _isPublic;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.startup.name);
    _desc = TextEditingController(text: widget.startup.description ?? '');
    _website = TextEditingController(text: widget.startup.website ?? '');
    _notes = TextEditingController(text: widget.startup.notes ?? '');
    _status = widget.startup.status;
    _isPublic = widget.startup.isPublic;
  }

  @override
  void dispose() {
    _name.dispose();
    _desc.dispose();
    _website.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Container(width: 36, height: 4, decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(2)), alignment: Alignment.center),
            const SizedBox(height: 16),
            Text(widget.startup.name, style: TextStyle(color: c.text, fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 4),
            Text('Creata ${widget.startup.createdAt.toIso8601String().substring(0, 10)} • Task associati in Today • MRR ${widget.startup.mrrCents == null ? "— (collega Stripe Fase 4)" : "€${widget.startup.mrrCents! / 100}"}', style: TextStyle(color: c.textTertiary, fontSize: 11)),
            const SizedBox(height: 16),
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Nome *', prefixIcon: Icon(Icons.badge_outlined))),
            const SizedBox(height: 10),
            DropdownButtonFormField<StartupStatus>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Stato'),
              items: StartupStatus.values.map((s) => DropdownMenuItem(value: s, child: Text(s.label))).toList(),
              onChanged: (v) => setState(() => _status = v ?? _status),
            ),
            const SizedBox(height: 10),
            TextField(controller: _desc, maxLength: 280, maxLines: 2, decoration: const InputDecoration(labelText: 'Descrizione (max 280)', prefixIcon: Icon(Icons.short_text_rounded))),
            const SizedBox(height: 10),
            TextField(controller: _website, decoration: const InputDecoration(labelText: 'Website (opzionale)', prefixIcon: Icon(Icons.link_rounded))),
            const SizedBox(height: 10),
            TextField(controller: _notes, maxLines: 3, decoration: const InputDecoration(labelText: 'Note private', prefixIcon: Icon(Icons.note_outlined))),
            const SizedBox(height: 4),
            // Fase 7 — privacy-first: il progetto è privato finché non lo rendi visibile.
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              value: _isPublic,
              onChanged: (v) => setState(() => _isPublic = v),
              title: Text('Portfolio pubblico', style: TextStyle(color: c.text, fontWeight: FontWeight.w600, fontSize: 13)),
              subtitle: Text(
                _isPublic
                    ? 'Visibile agli altri founder (nome, stato, descrizione — mai le note private)'
                    : 'Visibile solo a te',
                style: TextStyle(color: c.textTertiary, fontSize: 11),
              ),
              secondary: Icon(_isPublic ? Icons.public_rounded : Icons.lock_outline_rounded, color: _isPublic ? c.accentSignal : c.textTertiary),
            ),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: OutlinedButton.icon(onPressed: () => _archive(context), icon: Icon(Icons.archive_rounded, color: c.warning), label: Text('Archivia', style: TextStyle(color: c.warning)))),
              const SizedBox(width: 10),
              Expanded(child: ElevatedButton(onPressed: _save, child: const Text('Salva'))),
            ]),
          ]),
        ),
      ),
    );
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    if (name.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nome minimo 2 caratteri')));
      return;
    }
    if (_desc.text.length > 280) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Descrizione max 280')));
      return;
    }
    await ref.read(startupProvider.notifier).update(widget.startup, name: name, status: _status, description: _desc.text.isEmpty ? null : _desc.text, website: _website.text.isEmpty ? null : _website.text, notes: _notes.text.isEmpty ? null : _notes.text, isPublic: _isPublic);
    if (mounted) Navigator.pop(context);
  }

  Future<void> _archive(BuildContext context) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('Archiviare startup?'), content: Text('“${widget.startup.name}” verrà nascosta dalla lista e dal filtro Today. Potrai riattivarla in futuro.'), actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annulla')), FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Archivia'))]));
    if (ok != true) return;
    await ref.read(startupProvider.notifier).archive(widget.startup.id);
    if (mounted) Navigator.pop(context);
  }
}
