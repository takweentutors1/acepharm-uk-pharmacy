import 'package:dio/dio.dart';

import 'weekly_insight.dart';

/// Fetches `GET /api/v1/ace/weekly-insight` — a read-only lookup against
/// the cached value the backend cron already computed. Never triggers
/// generation on the client (Section 5.2 & 5.3: no heavy generation on
/// page load).
class WeeklyInsightRepository {
  WeeklyInsightRepository(this._dio);

  final Dio _dio;

  Future<WeeklyInsight> fetch({String? userId}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/ace/weekly-insight',
      queryParameters: userId == null ? null : {'user_id': userId},
    );
    return WeeklyInsight.fromJson(response.data!);
  }
}
