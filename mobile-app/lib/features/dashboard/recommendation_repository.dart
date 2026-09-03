import 'package:dio/dio.dart';

import 'recommendation.dart';

/// Fetches `GET /api/v1/analytics/recommendation` — the server-computed,
/// always-explained "what to study next" suggestion. Requires the caller
/// to be signed in; the Bearer token is attached by [ApiClient]'s
/// [AuthInterceptor].
class RecommendationRepository {
  RecommendationRepository(this._dio);

  final Dio _dio;

  Future<Recommendation> fetch() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/analytics/recommendation',
    );
    final body = response.data!;
    return Recommendation.fromJson(
      body['recommendation'] as Map<String, dynamic>,
    );
  }
}
