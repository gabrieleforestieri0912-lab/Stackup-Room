// Modelli dei dati della Room (formato identico alle API web).

class Startup {
  Startup({
    required this.id,
    required this.name,
    this.domain,
    this.logoUrl,
    this.stage = 'idea',
    this.tagline,
  });

  final String id;
  final String name;
  final String? domain;
  final String? logoUrl;
  final String stage;
  final String? tagline;

  factory Startup.fromJson(Map<String, dynamic> j) => Startup(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? 'Startup',
        domain: j['domain'] as String?,
        logoUrl: j['logo_url'] as String?,
        stage: j['stage']?.toString() ?? 'idea',
        tagline: j['tagline'] as String?,
      );
}

class ChatMessage {
  ChatMessage({
    required this.id,
    required this.body,
    required this.author,
    required this.mine,
    required this.createdAt,
    this.replyAuthor,
    this.replyBody,
  });

  final String id;
  final String body;
  final String author;
  final bool mine;
  final DateTime createdAt;
  final String? replyAuthor;
  final String? replyBody;

  factory ChatMessage.fromJson(Map<String, dynamic> j) {
    final reply = j['reply'] as Map<String, dynamic>?;
    return ChatMessage(
      id: j['id']?.toString() ?? '',
      body: j['body']?.toString() ?? '',
      author: j['author']?.toString() ?? 'Founder',
      mine: j['mine'] == true,
      createdAt: DateTime.tryParse(j['created_at']?.toString() ?? '') ??
          DateTime.now(),
      replyAuthor: reply?['author'] as String?,
      replyBody: reply?['body'] as String?,
    );
  }
}

class TaskItem {
  TaskItem({
    required this.id,
    required this.title,
    this.status = 'todo',
    this.priority = 'med',
  });

  final String id;
  final String title;
  final String status;
  final String priority;

  bool get done => status == 'done';

  factory TaskItem.fromJson(Map<String, dynamic> j) => TaskItem(
        id: j['id']?.toString() ?? '',
        title: j['title']?.toString() ?? '',
        status: j['status']?.toString() ?? 'todo',
        priority: j['priority']?.toString() ?? 'med',
      );

  TaskItem withStatus(String s) =>
      TaskItem(id: id, title: title, status: s, priority: priority);
}

class Standup {
  Standup({
    required this.startupId,
    required this.day,
    this.done = '',
    this.todo = '',
    this.blockers = '',
  });

  final String startupId;
  final String day;
  final String done;
  final String todo;
  final String blockers;

  factory Standup.fromJson(Map<String, dynamic> j) => Standup(
        startupId: j['startup_id']?.toString() ?? '',
        day: j['day']?.toString() ?? '',
        done: j['done']?.toString() ?? '',
        todo: j['todo']?.toString() ?? '',
        blockers: j['blockers']?.toString() ?? '',
      );
}

class Streak {
  Streak({this.current = 0, this.longest = 0, this.todayDone = false, this.days = const []});

  final int current;
  final int longest;
  final bool todayDone;
  final List<String> days;

  factory Streak.fromJson(Map<String, dynamic> j) => Streak(
        current: (j['current'] as num?)?.toInt() ?? 0,
        longest: (j['longest'] as num?)?.toInt() ?? 0,
        todayDone: j['todayDone'] == true,
        days: (j['heatmap'] as List? ?? []).map((d) => d.toString()).toList(),
      );
}

class CoachTurn {
  CoachTurn({required this.role, required this.text});
  final String role; // 'user' | 'assistant'
  final String text;
}
