import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
    // La sessione è stabilita lato server: la risposta porta direttamente
    // i token, non un magic link da scambiare.
    final j = await api.post('/api/auth/otp/verify', {
      'email': email.trim(),
      'code': code.trim(),
    });
    final token = j['token']?.toString() ?? '';
    if (token.isEmpty) {
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
