import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import 'api_client.dart';

class AppUser {
  AppUser({
    required this.id,
    required this.name,
    required this.email,
    this.avatar,
    this.onboardingCompleted = false,
  });

  final String id;
  final String name;
  final String email;
  final String? avatar;
  final bool onboardingCompleted;

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        email: j['email']?.toString() ?? '',
        avatar: j['avatar'] as String?,
        onboardingCompleted: j['onboardingCompleted'] == true,
      );
}

/// Autenticazione: riusa le API di login del sito (stesso account Supabase).
class AuthService extends ChangeNotifier {
  AuthService(this.api);

  final ApiClient api;
  AppUser? user;
  bool ready = false;

  Future<void> restore() async {
    final p = await SharedPreferences.getInstance();
    api.token = p.getString('token');
    final raw = p.getString('user');
    if (api.token != null && raw != null) {
      try {
        user = AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {
        user = null;
      }
    }
    ready = true;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final j = await api.post('/api/auth/login', {
      'email': email.trim(),
      'password': password,
    });
    final token = j['token']?.toString() ?? '';
    if (token.isEmpty) throw ApiException('Login senza sessione');
    await _save(token, (j['user'] as Map<String, dynamic>?) ?? {});
  }

  Future<void> requestOtp(String email) async {
    await api.post('/api/auth/otp/request', {'email': email.trim()});
  }

  Future<void> verifyOtp(String email, String code) async {
    final j = await api.post('/api/auth/otp/verify', {
      'email': email.trim(),
      'code': code.trim(),
    });
    final otpToken = j['emailOtpToken']?.toString();
    if (otpToken == null || AppConfig.supabaseUrl.isEmpty) {
      throw ApiException(
        'Accesso OTP non configurato per il mobile: usa la login con password.',
      );
    }
    final res = await http
        .post(
          Uri.parse('${AppConfig.supabaseUrl}/auth/v1/verify'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'type': 'email',
            'email': email.trim(),
            'token': otpToken,
          }),
        )
        .timeout(const Duration(seconds: 25));
    Map<String, dynamic> data;
    try {
      data = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      data = <String, dynamic>{};
    }
    final token = data['access_token']?.toString() ?? '';
    if (res.statusCode >= 400 || token.isEmpty) {
      throw ApiException('Verifica del codice fallita');
    }
    await _save(token, (j['user'] as Map<String, dynamic>?) ?? {});
  }

  Future<void> _save(String token, Map<String, dynamic> u) async {
    api.token = token;
    user = AppUser.fromJson(u);
    final p = await SharedPreferences.getInstance();
    await p.setString('token', token);
    await p.setString('user', jsonEncode(u));
    notifyListeners();
  }

  Future<void> logout() async {
    api.token = null;
    user = null;
    final p = await SharedPreferences.getInstance();
    await p.remove('token');
    await p.remove('user');
    notifyListeners();
  }
}
