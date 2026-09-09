import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/api/api_config.dart';

/// Talks to the Workers custom-auth API (`/api/v1/auth/*`) directly — the
/// app's single source of identity. The access token is short-lived and
/// kept in memory only; the refresh token is the durable credential, held
/// in the platform keystore via [FlutterSecureStorage].
///
/// [_accessToken], [_email], and [_authStateController] are `static`
/// rather than instance fields: call sites across the app each construct
/// their own `AuthRepository()` (see `main.dart`, `dashboard_screen.dart`),
/// mirroring how `FirebaseAuth.instance` was implicitly a shared singleton
/// under the old wrapper. Making the session state static preserves that
/// behavior without touching every call site.
class AuthRepository {
  AuthRepository({Dio? dio, FlutterSecureStorage? secureStorage})
    : _dio = dio ?? _buildDefaultDio(),
      _secureStorage = secureStorage ?? const FlutterSecureStorage();

  final Dio _dio;
  final FlutterSecureStorage _secureStorage;

  static const _refreshTokenKey = 'ace_refresh_token';
  static const _emailKey = 'ace_auth_email';

  static String? _accessToken;
  static String? _email;
  static final StreamController<bool> _authStateController =
      StreamController<bool>.broadcast();

  static Dio _buildDefaultDio() => Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: const {'Content-Type': 'application/json'},
    ),
  );

  /// Emits `true`/`false` on sign-in/sign-out. Mirrors what
  /// `FirebaseAuth.authStateChanges` used to provide, but backed by our own
  /// token state. Does not replay the current value to new subscribers —
  /// callers needing the current value at build time should combine this
  /// with [restoreSession]'s result (see `main.dart`'s `_AuthGate`).
  Stream<bool> get authStateChanges => _authStateController.stream;

  bool get isAuthenticated => _accessToken != null;

  /// Attempts to silently resume a session from the stored refresh token.
  /// Call once at app startup, before the first authenticated request.
  Future<bool> restoreSession() async {
    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    if (refreshToken == null) {
      _authStateController.add(false);
      return false;
    }

    _email = await _secureStorage.read(key: _emailKey);
    final refreshed = await _refresh(refreshToken);
    _authStateController.add(refreshed);
    return refreshed;
  }

  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    await _applyTokenResponse(response.data, email: email);
  }

  Future<void> signUpWithEmail({
    required String email,
    required String password,
    String? firstName,
  }) async {
    final response = await _dio.post(
      '/auth/signup',
      data: {
        'email': email,
        'password': password,
        if (firstName != null) 'firstName': firstName,
      },
    );
    await _applyTokenResponse(response.data, email: email);
  }

  Future<void> sendPasswordResetEmail(String email) {
    return _dio.post('/auth/request-password-reset', data: {'email': email});
  }

  Future<void> signOut() async {
    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    await _clearSession();
    if (refreshToken != null) {
      try {
        await _dio.post('/auth/logout', data: {'refreshToken': refreshToken});
      } catch (_) {
        // best-effort — local session is already cleared
      }
    }
  }

  /// Re-proves the user's identity with their password before a
  /// destructive operation (account deletion). There's no separate
  /// "reauthenticate" endpoint in the custom auth system — logging in
  /// again with the known email *is* the reauthentication, and refreshes
  /// the local session as a side effect. Throws on wrong password, same
  /// as the old `reauthenticateWithCredential` contract.
  Future<void> reauthenticateWithPassword(String password) async {
    final email = _email;
    if (email == null) {
      throw StateError('No signed-in email/password user to reauthenticate.');
    }
    await signInWithEmail(email: email, password: password);
  }

  /// Ends the local session after the backend account-deletion call has
  /// already succeeded (see `delete_account_flow.dart`). There is no
  /// separate "delete the identity" step to call here — deleting the D1
  /// user row already cascades to every refresh token tied to it.
  Future<void> deleteAccount() async {
    await _clearSession();
  }

  /// The Bearer credential every authenticated endpoint needs. Pass
  /// [forceRefresh] to mint a new one via the stored refresh token, e.g.
  /// after a 401 (see [AuthInterceptor]).
  Future<String?> getAccessToken({bool forceRefresh = false}) async {
    if (!forceRefresh && _accessToken != null) {
      return _accessToken;
    }

    final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
    if (refreshToken == null) return null;

    final refreshed = await _refresh(refreshToken);
    return refreshed ? _accessToken : null;
  }

  Future<bool> _refresh(String refreshToken) async {
    try {
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      _accessToken = response.data['accessToken'] as String;
      await _secureStorage.write(
        key: _refreshTokenKey,
        value: response.data['refreshToken'] as String,
      );
      return true;
    } catch (_) {
      await _clearSession();
      return false;
    }
  }

  Future<void> _applyTokenResponse(dynamic data, {required String email}) async {
    _accessToken = data['accessToken'] as String;
    _email = email;
    await _secureStorage.write(key: _refreshTokenKey, value: data['refreshToken'] as String);
    await _secureStorage.write(key: _emailKey, value: email);
    _authStateController.add(true);
  }

  Future<void> _clearSession() async {
    _accessToken = null;
    _email = null;
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _emailKey);
    _authStateController.add(false);
  }
}
