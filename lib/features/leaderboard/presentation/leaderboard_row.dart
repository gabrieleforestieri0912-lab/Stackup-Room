// ignore_for_file: unnecessary_underscores

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/leaderboard_entry.dart';

class LeaderboardRow extends StatelessWidget {
  const LeaderboardRow({super.key, required this.entry, required this.rank, required this.isMe, required this.c});
  final LeaderboardEntry entry;
  final int rank;
  final bool isMe;
  final AppColors c;

  @override
  Widget build(BuildContext context) {
    final isTop = rank <= 3;
    final delta = entry.deltaCents;
    return RepaintBoundary(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isMe ? c.accentSignal.withValues(alpha: 0.10) : c.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isMe ? c.accentSignal : (isTop ? c.accentSignal.withValues(alpha: 0.35) : c.border), width: isMe ? 1.5 : 1),
        ),
        child: Row(children: [
          SizedBox(width: 28, child: Text('#$rank', style: TextStyle(color: isMe ? c.accentSignal : (isTop ? c.accentSignal : c.textTertiary), fontWeight: FontWeight.w800, fontSize: 13))),
          CircleAvatar(
            radius: 18,
            backgroundColor: c.surfaceAlt,
            backgroundImage: entry.avatarUrl != null ? NetworkImage(entry.avatarUrl!) : null,
            onBackgroundImageError: entry.avatarUrl != null ? (_, __) {} : null,
            child: entry.avatarUrl == null ? Text(entry.displayName.isNotEmpty ? entry.displayName[0].toUpperCase() : '?', style: TextStyle(color: c.textSecondary, fontWeight: FontWeight.w700)) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Flexible(child: Text(entry.displayName, overflow: TextOverflow.ellipsis, style: TextStyle(color: c.text, fontWeight: isMe ? FontWeight.w800 : FontWeight.w600, fontSize: 14))),
                if (isMe) Container(margin: const EdgeInsets.only(left: 6), padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: c.accentSignal, borderRadius: BorderRadius.circular(6)), child: const Text('TU', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800))),
              ]),
              const SizedBox(height: 2),
              Text('${entry.startupName ?? "—"}  •  streak ${entry.streakDays}🔥', style: TextStyle(color: c.textTertiary, fontSize: 11)),
            ]),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(entry.mrrLabel, style: TextStyle(color: c.text, fontWeight: FontWeight.w700, fontSize: 13)),
            const SizedBox(height: 2),
            if (delta != null)
              Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(delta >= 0 ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded, size: 10, color: delta >= 0 ? c.success : c.error),
                const SizedBox(width: 2),
                Text('${delta >= 0 ? "+" : ""}€${(delta.abs() / 100).toStringAsFixed(0)}', style: TextStyle(color: delta >= 0 ? c.success : c.error, fontSize: 11, fontWeight: FontWeight.w600)),
              ])
            else
              Text('—', style: TextStyle(color: c.textTertiary, fontSize: 11)),
          ]),
        ]),
      ),
    );
  }
}
