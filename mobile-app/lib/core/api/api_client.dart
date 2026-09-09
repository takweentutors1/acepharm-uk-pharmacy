import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../features/auth/auth_repository.dart';
import 'api_config.dart';
import 'auth_interceptor.dart';

/// The app's single [Dio] instance, pre-wired with the base URL and the
/// access-token [AuthInterceptor] every authenticated endpoint needs.
class ApiClient {
  ApiClient({AuthRepository? authRepository, VoidCallback? onUnauthenticated})
    : dio = Dio(
        BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: ApiConfig.connectTimeout,
          receiveTimeout: ApiConfig.receiveTimeout,
          headers: const {'Content-Type': 'application/json'},
        ),
      ) {
    dio.interceptors.add(
      AuthInterceptor(
        dio: dio,
        authRepository: authRepository,
        onUnauthenticated: onUnauthenticated,
      ),
    );
  }

  final Dio dio;
}
