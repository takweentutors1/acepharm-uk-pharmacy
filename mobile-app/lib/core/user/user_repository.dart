import 'package:dio/dio.dart';

import 'user_profile.dart';

/// `GET /api/v1/auth/me` — the one endpoint that resolves the signed-in
/// Firebase user to their D1 profile (and provisions it on first login).
class UserRepository {
  UserRepository(this._dio);

  final Dio _dio;

  Future<UserProfile> fetchMe() async {
    final response = await _dio.get<Map<String, dynamic>>('/auth/me');
    return UserProfile.fromJson(response.data!);
  }
}
