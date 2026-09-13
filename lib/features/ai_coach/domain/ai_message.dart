class AiMessage {
  const AiMessage({required this.id, required this.role, required this.content, this.startupId, required this.createdAt});
  final String id;
  final String role; // user | assistant
  final String content;
  final String? startupId;
  final DateTime createdAt;

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';

  factory AiMessage.fromJson(Map<String, dynamic> j) => AiMessage(
        id: j['id'] as String,
        role: j['role'] as String,
        content: j['content'] as String,
        startupId: j['startup_id'] as String?,
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}
