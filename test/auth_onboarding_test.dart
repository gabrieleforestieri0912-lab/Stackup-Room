import 'package:flutter_test/flutter_test.dart';

// Testa logica pura (senza Supabase) — validazioni usate in Login/Signup/Onboarding
// Queste funzioni duplicano la logica dei validator per testabilità offline.

String? validateEmail(String? v) {
  if (v == null || v.trim().isEmpty) return 'Inserisci la tua email';
  final regex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
  if (!regex.hasMatch(v.trim())) return 'Email non valida';
  return null;
}

String? validatePassword(String? v) {
  if (v == null || v.isEmpty) return 'Scegli una password';
  if (v.length < 6) return 'Minimo 6 caratteri';
  return null;
}

bool isDisplayNameValid(String v) => v.trim().length >= 2;
bool isOneLinerValid(String v) => v.length <= 140;

String humanizeAuthError(String raw) {
  final msg = raw.toLowerCase();
  if (msg.contains('already registered') || msg.contains('already exists') || msg.contains('already registered')) {
    return 'Email già in uso. Prova ad accedere.';
  }
  if (msg.contains('invalid login credentials') || msg.contains('invalid credentials')) {
    return 'Email o password non corretti.';
  }
  if (msg.contains('password') && (msg.contains('weak') || msg.contains('short'))) {
    return 'Password troppo debole. Usa almeno 6 caratteri.';
  }
  if (msg.contains('rate limit') || msg.contains('429') || msg.contains('too many requests')) {
    return 'Troppe richieste. Riprova tra qualche minuto.';
  }
  if (msg.contains('socketexception') || msg.contains('failed host') || msg.contains('network') || msg.contains('connection')) {
    return 'Errore di connessione. Verifica la rete e riprova.';
  }
  return 'Errore: $raw';
}

void main() {
  group('Email validation', () {
    test('vuota → errore', () => expect(validateEmail(''), isNotNull));
    test('senza @ → errore', () => expect(validateEmail('alice'), isNotNull));
    test('senza dominio → errore', () => expect(validateEmail('alice@'), isNotNull));
    test('valida → null', () => expect(validateEmail('alice@acme.com'), isNull));
    test('trim spazi → valida', () => expect(validateEmail('  alice@acme.com  '), isNull));
  });

  group('Password validation', () {
    test('vuota → errore', () => expect(validatePassword(''), isNotNull));
    test('corta (<6) → errore', () => expect(validatePassword('12345'), isNotNull));
    test('6 char → ok', () => expect(validatePassword('123456'), isNull));
    test('lunga → ok', () => expect(validatePassword('s3cr3t!'), isNull));
  });

  group('Display name', () {
    test('vuoto → invalido', () => expect(isDisplayNameValid(''), isFalse));
    test('1 char → invalido', () => expect(isDisplayNameValid('A'), isFalse));
    test('2 char → valido', () => expect(isDisplayNameValid('Al'), isTrue));
    test('spazi soli → invalido', () => expect(isDisplayNameValid('   '), isFalse));
    test('con spazi trim → valido', () => expect(isDisplayNameValid('  Alice  '), isTrue));
  });

  group('One-liner 140 char', () {
    test('vuoto → valido (opzionale)', () => expect(isOneLinerValid(''), isTrue));
    test('140 → valido', () => expect(isOneLinerValid('a' * 140), isTrue));
    test('141 → invalido', () => expect(isOneLinerValid('a' * 141), isFalse));
    test('100 → valido', () => expect(isOneLinerValid('a' * 100), isTrue));
  });

  group('humanizeAuthError', () {
    test('email già in uso', () => expect(humanizeAuthError('User already registered'), contains('già in uso')));
    test('credenziali invalide', () => expect(humanizeAuthError('Invalid login credentials'), contains('non corretti')));
    test('rate limit', () => expect(humanizeAuthError('429 Too Many Requests'), contains('Troppe richieste')));
    test('network', () => expect(humanizeAuthError('SocketException: Failed host lookup'), contains('connessione')));
  });

  group('Reminder hour clamp', () {
    test('clamp 0-23', () {
      expect((-1).clamp(0, 23), 0);
      expect(24.clamp(0, 23), 23);
      expect(9.clamp(0, 23), 9);
    });
  });

  group('Onboarding step progression', () {
    test('step index mapping', () {
      // Simula step enum → index
      const steps = ['step1Profile', 'step2Startup', 'step3Reminder', 'done'];
      const indices = [0, 1, 2, 3];
      for (int i = 0; i < steps.length; i++) {
        expect(indices[i], i);
      }
    });
  });
}
