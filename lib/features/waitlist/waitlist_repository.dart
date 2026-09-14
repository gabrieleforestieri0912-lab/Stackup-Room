import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase/supabase_client.dart';

/// Repository waitlist — Giorno 5 Fase 1.
/// Insert pubblico (RLS permette anon insert), nessuna select lato client.
class WaitlistRepository {
  Future<void> join(String email) async {
    final client = SupabaseService.clientOrNull;
    // Offline / non configurato: simula successo (non blocca demo)
    if (client == null) {
      debugPrint('[Waitlist] Offline mock: $email iscritta');
      await Future.delayed(const Duration(milliseconds: 400));
      return;
    }
    try {
      await client.from('waitlist').insert({'email': email.trim().toLowerCase()});
    } on PostgrestException catch (e) {
      // Duplicate key = già iscritto
      if (e.code == '23505') throw StateError('Sei già in lista — ti avviseremo al lancio.');
      if (e.code == '23514') throw StateError('Email non valida.');
      rethrow;
    }
  }
}
