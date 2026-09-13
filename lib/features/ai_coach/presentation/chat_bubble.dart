import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/ai_message.dart';

class ChatBubble extends StatelessWidget {
  const ChatBubble({super.key, required this.message});
  final AiMessage message;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    final isUser = message.isUser;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: isUser ? c.primary : c.surface,
          borderRadius: BorderRadius.circular(16).copyWith(bottomRight: isUser ? const Radius.circular(4) : null, bottomLeft: !isUser ? const Radius.circular(4) : null),
          border: Border.all(color: isUser ? c.primary : c.border),
        ),
        child: Text(message.content, style: TextStyle(color: isUser ? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0A0A0A) : Colors.white) : c.text, fontSize: 13, height: 1.4)),
      ),
    );
  }
}

class StreamingBubble extends StatelessWidget {
  const StreamingBubble({super.key, required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).brightness == Brightness.dark ? AppColors.dark : AppColors.light;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(16).copyWith(bottomLeft: const Radius.circular(4)), border: Border.all(color: c.border)),
        child: Text(text.isEmpty ? '…' : text, style: TextStyle(color: c.text, fontSize: 13, height: 1.4)),
      ),
    );
  }
}
