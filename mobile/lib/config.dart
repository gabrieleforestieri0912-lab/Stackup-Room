/// Configurazione dell'app mobile.
///
/// L'app parla con le stesse API Next.js del sito web (deploy Vercel).
/// Valori custom: `flutter run --dart-define=API_BASE=https://altro-dominio`
class AppConfig {
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'https://stackup-room.vercel.app',
  );

  /// Opzionale: serve solo per l'accesso via codice email (OTP),
  /// per scambiare il codice con una sessione Supabase.
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );
}
