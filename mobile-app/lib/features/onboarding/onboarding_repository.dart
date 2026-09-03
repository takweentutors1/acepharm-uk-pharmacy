import 'package:dio/dio.dart';

import '../../core/user/university.dart';
import 'training_stage.dart';

/// `GET /api/v1/universities` and `PUT /api/v1/user/onboarding`.
class OnboardingRepository {
  OnboardingRepository(this._dio);

  final Dio _dio;

  Future<List<University>> fetchUniversities() async {
    final response = await _dio.get<Map<String, dynamic>>('/universities');
    final list = response.data!['universities'] as List<dynamic>;
    return list
        .map((e) => University.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> submit({
    required TrainingStage stage,
    required String primaryGoal,
    DateTime? assessmentDate,
    required int dailyQuestionTarget,
    String? universityId,
  }) {
    return _dio.put<Map<String, dynamic>>(
      '/user/onboarding',
      data: {
        'stage': stage.apiValue,
        'primaryGoal': primaryGoal,
        if (assessmentDate != null)
          'assessmentDate': assessmentDate.toIso8601String().split('T').first,
        'dailyQuestionTarget': dailyQuestionTarget,
        if (universityId != null) 'universityId': universityId,
      },
    );
  }
}
