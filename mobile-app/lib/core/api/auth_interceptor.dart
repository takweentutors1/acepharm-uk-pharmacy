import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// Attaches the current Firebase ID token as a Bearer credential to every
/// outgoing request. On a 401 — rejected by the API's JWKS-backed
/// `requireAuth` middleware — it force-refreshes the token and retries
/// once before giving up and notifying [onUnauthenticated].
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.dio,
    FirebaseAuth? firebaseAuth,
    this.onUnauthenticated,
  }) : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final Dio dio;
  final FirebaseAuth _firebaseAuth;
  final VoidCallback? onUnauthenticated;

  static const _retriedKey = 'ace_auth_retried';

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final user = _firebaseAuth.currentUser;
    if (user != null) {
      final token = await user.getIdToken();
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final user = _firebaseAuth.currentUser;
    final isUnauthorized = err.response?.statusCode == 401;
    final alreadyRetried = err.requestOptions.extra[_retriedKey] == true;

    if (!isUnauthorized || user == null) {
      return handler.next(err);
    }

    if (alreadyRetried) {
      onUnauthenticated?.call();
      return handler.next(err);
    }

    try {
      final freshToken = await user.getIdToken(true);
      final retryOptions = err.requestOptions
        ..headers['Authorization'] = 'Bearer $freshToken'
        ..extra[_retriedKey] = true;
      final response = await dio.fetch(retryOptions);
      return handler.resolve(response);
    } catch (_) {
      onUnauthenticated?.call();
      return handler.next(err);
    }
  }
}
