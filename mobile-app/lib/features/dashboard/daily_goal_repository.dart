import 'package:dio/dio.dart';

import 'daily_goal.dart';

/// `GET /api/v1/analytics/daily-goal`.
class DailyGoalRepository {
  DailyGoalRepository(this._dio);

  final Dio _dio;

  Future<DailyGoal> fetch() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/analytics/daily-goal',
    );
    return DailyGoal.fromJson(response.data!);
  }
}
