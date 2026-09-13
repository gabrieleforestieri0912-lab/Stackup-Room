class CommunityChannel {
  const CommunityChannel({required this.id, required this.name, this.description});
  final String id;
  final String name;
  final String? description;
  factory CommunityChannel.fromJson(Map<String, dynamic> j) => CommunityChannel(id: j['id'] as String, name: j['name'] as String, description: j['description'] as String?);
}

class CommunityMessage {
  const CommunityMessage({required this.id, required this.channelId, required this.userId, required this.content, this.replyTo, this.voiceUrl, this.reactions = const {}, required this.createdAt, this.displayName, this.avatarUrl});
  final String id;
  final String channelId;
  final String userId;
  final String content;
  final String? replyTo;
  final String? voiceUrl;
  final Map<String, List<String>> reactions; // emoji -> userIds
  final DateTime createdAt;
  final String? displayName;
  final String? avatarUrl;

  factory CommunityMessage.fromJson(Map<String, dynamic> j) {
    final raw = j['reactions'] as Map<String, dynamic>? ?? {};
    final map = <String, List<String>>{};
    raw.forEach((k, v) => map[k] = (v as List).cast<String>());
    return CommunityMessage(id: j['id'] as String, channelId: j['channel_id'] as String, userId: j['user_id'] as String, content: j['content'] as String, replyTo: j['reply_to'] as String?, voiceUrl: j['voice_url'] as String?, reactions: map, createdAt: DateTime.parse(j['created_at'] as String));
  }
}

class Guide {
  const Guide({required this.id, required this.title, required this.category, required this.bodyMd});
  final String id;
  final String title;
  final String category;
  final String bodyMd;
  factory Guide.fromJson(Map<String, dynamic> j) => Guide(id: j['id'] as String, title: j['title'] as String, category: j['category'] as String, bodyMd: j['body_md'] as String);
}
