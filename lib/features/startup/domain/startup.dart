enum StartupStatus { idea, inSviluppo, lanciata }

extension StartupStatusX on StartupStatus {
  String get label => switch (this) {
        StartupStatus.idea => 'Idea',
        StartupStatus.inSviluppo => 'In sviluppo',
        StartupStatus.lanciata => 'Lanciata',
      };
  String get dbValue => switch (this) {
        StartupStatus.idea => 'idea',
        StartupStatus.inSviluppo => 'in_sviluppo',
        StartupStatus.lanciata => 'lanciata',
      };
}

StartupStatus startupStatusFromDb(String v) => switch (v) {
      'idea' => StartupStatus.idea,
      'in_sviluppo' => StartupStatus.inSviluppo,
      'lanciata' => StartupStatus.lanciata,
      _ => StartupStatus.idea,
    };

class Startup {
  const Startup({
    required this.id,
    required this.ownerId,
    required this.name,
    required this.status,
    this.description,
    this.website,
    this.notes,
    this.mrrCents,
    this.isArchived = false,
    this.isPublic = false,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String ownerId;
  final String name;
  final StartupStatus status;
  final String? description; // <=280
  final String? website;
  final String? notes;
  final int? mrrCents; // null = non collegato (Fase 4 Stripe read-only)
  final bool isArchived;
  final bool isPublic; // Fase 7 — opt-in portfolio pubblico (default privacy-first: false)
  final DateTime createdAt;
  final DateTime updatedAt;

  factory Startup.fromJson(Map<String, dynamic> j) => Startup(
        id: j['id'] as String,
        ownerId: j['owner_id'] as String,
        name: j['name'] as String,
        status: startupStatusFromDb(j['status'] as String? ?? 'idea'),
        description: j['description'] as String?,
        website: j['website'] as String?,
        notes: j['notes'] as String?,
        mrrCents: j['mrr_cents'] as int?,
        isArchived: j['is_archived'] as bool? ?? false,
        isPublic: j['is_public'] as bool? ?? false,
        createdAt: DateTime.parse(j['created_at'] as String),
        updatedAt: DateTime.parse(j['updated_at'] as String),
      );

  Map<String, dynamic> toInsert(String ownerId) => {
        'owner_id': ownerId,
        'name': name.trim(),
        'status': status.dbValue,
        if (description != null) 'description': description,
        if (website != null) 'website': website,
        if (notes != null) 'notes': notes,
      };

  Startup copyWith({String? name, StartupStatus? status, String? description, String? website, String? notes, bool? isArchived, bool? isPublic, int? mrrCents}) => Startup(
        id: id,
        ownerId: ownerId,
        name: name ?? this.name,
        status: status ?? this.status,
        description: description ?? this.description,
        website: website ?? this.website,
        notes: notes ?? this.notes,
        mrrCents: mrrCents ?? this.mrrCents,
        isArchived: isArchived ?? this.isArchived,
        isPublic: isPublic ?? this.isPublic,
        createdAt: createdAt,
        updatedAt: updatedAt,
      );
}
