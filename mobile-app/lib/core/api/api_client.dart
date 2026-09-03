import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import 'api_config.dart';
import 'auth_interceptor.dart';

/// The app's single [Dio] instance, pre-wired with the base URL and the
/// Firebase-ID-token [AuthInterceptor] every authenticated endpoint needs.
class ApiClient {
  ApiClient({FirebaseAuth? firebaseAuth, VoidCallback? onUnauthenticated})
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
        firebaseAuth: firebaseAuth,
        onUnauthenticated: onUnauthenticated,
      ),
    );
  }

  final Dio dio;
}
