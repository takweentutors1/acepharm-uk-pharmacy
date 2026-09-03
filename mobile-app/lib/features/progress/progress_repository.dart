import 'package:dio/dio.dart';

import 'progress_metrics.dart';

/// `GET /api/v1/analytics/metrics` — the five separate progress pillars.
class ProgressRepository {
  ProgressRepository(this._dio);

  final Dio _dio;

  Future<ProgressMetrics> fetchMetrics() async {
    final response = await _dio.get<Map<String, dynamic>>('/analytics/metrics');
    return ProgressMetrics.fromJson(response.data!);
  }
}
