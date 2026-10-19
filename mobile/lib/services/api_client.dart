import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.status});
  final String message;
  final int? status;

  @override
  String toString() => message;
}

/// Cliente HTTP minimo per le API della Room (stesse route del sito web).
/// Autenticazione: header `Authorization: Bearer <token Supabase>`.
class ApiClient {
  String? token;

  Map<String, String> _headers() => {
        'Content-Type': 'application/json',
        if (token != null && token!.isNotEmpty) 'Authorization': 'Bearer $token',
      };

  Uri _uri(String path) => Uri.parse('${AppConfig.apiBase}$path');

  Future<Map<String, dynamic>> get(String path) => _send('GET', path);

  Future<Map<String, dynamic>> post(String path, [Object? body]) =>
      _send('POST', path, body);

  Future<Map<String, dynamic>> patch(String path, [Object? body]) =>
      _send('PATCH', path, body);

  Future<Map<String, dynamic>> delete(String path) => _send('DELETE', path);

  Future<Map<String, dynamic>> _send(String method, String path,
      [Object? body]) async {
    final req = http.Request(method, _uri(path));
    req.headers.addAll(_headers());
    if (body != null) req.body = jsonEncode(body);
    final http.StreamedResponse res;
    try {
      res = await req.send().timeout(const Duration(seconds: 25));
    } on Exception {
      throw ApiException('Connessione fallita. Controlla la rete.');
    }
    final raw =
        await res.stream.bytesToString().catchError((Object _) => '');
    Map<String, dynamic> json;
    try {
      json = raw.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      json = <String, dynamic>{};
    }
    if (res.statusCode >= 400) {
      throw ApiException(
        json['message']?.toString() ?? 'Errore ${res.statusCode}',
        status: res.statusCode,
      );
    }
    return json;
  }

  /// Richiesta in streaming (SSE) usata dal coach.
  Future<http.StreamedResponse> postStream(String path, Object body) async {
    final req = http.Request('POST', _uri(path));
    req.headers.addAll(_headers());
    req.body = jsonEncode(body);
    return http.Client().send(req);
  }
}
