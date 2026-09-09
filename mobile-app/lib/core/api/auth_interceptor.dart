import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../features/auth/auth_repository.dart';

/// Attaches the current access token as a Bearer credential to every
/// outgoing request. On a 401 — rejected by the API's `requireAuth`
/// middleware — it force-refreshes the token via the stored refresh token
/// and retries once before giving up and notifying [onUnauthenticated].
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required this.dio,
    AuthRepository? authRepository,
    this.onUnauthenticated,
  }) : _authRepository = authRepository ?? AuthRepository();

  final Dio dio;
  final AuthRepository _authRepository;
  final VoidCallback? onUnauthenticated;

  static const _retriedKey = 'ace_auth_retried';

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _authRepository.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final isUnauthorized = err.response?.statusCode == 401;
    final alreadyRetried = err.requestOptions.extra[_retriedKey] == true;

    if (!isUnauthorized) {
      return handler.next(err);
    }

    if (alreadyRetried) {
      onUnauthenticated?.call();
      return handler.next(err);
    }

    try {
      final freshToken = await _authRepository.getAccessToken(forceRefresh: true);
      if (freshToken == null) {
        onUnauthenticated?.call();
        return handler.next(err);
      }
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
