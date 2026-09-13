class LeaderboardEntry {
  const LeaderboardEntry({
    required this.userId,
    required this.displayName,
    this.avatarUrl,
    this.startupId,
    this.startupName,
    this.startupStatus,
    this.latestRevenueCents,
    this.currency,
    this.streakDays = 0,
    this.deltaCents,
  });

  final String userId;
  final String displayName;
  final String? avatarUrl;
  final String? startupId;
  final String? startupName;
  final String? startupStatus;
  final int? latestRevenueCents;
  final String? currency;
  final int streakDays;
  final int? deltaCents; // variazione vs periodo precedente

  bool get hasRevenue => latestRevenueCents != null;
  String get mrrLabel => latestRevenueCents == null ? '—' : '€${(latestRevenueCents! / 100).toStringAsFixed(0)}';

  factory LeaderboardEntry.fromView(Map<String, dynamic> j) => LeaderboardEntry(
        userId: j['user_id'] as String,
        displayName: j['display_name'] as String? ?? 'Founder',
        avatarUrl: j['avatar_url'] as String?,
        startupId: j['startup_id'] as String?,
        startupName: j['startup_name'] as String?,
        startupStatus: j['startup_status'] as String?,
        latestRevenueCents: j['latest_revenue_cents'] as int?,
        currency: j['currency'] as String?,
      );

  LeaderboardEntry withStreak(int streak, int? delta) => LeaderboardEntry(
        userId: userId,
        displayName: displayName,
        avatarUrl: avatarUrl,
        startupId: startupId,
        startupName: startupName,
        startupStatus: startupStatus,
        latestRevenueCents: latestRevenueCents,
        currency: currency,
        streakDays: streak,
        deltaCents: delta,
      );
}
