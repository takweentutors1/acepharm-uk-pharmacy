import 'package:dio/dio.dart';

import 'answer_result.dart';
import 'confidence.dart';
import 'practice_session.dart';
import 'session_builder_query.dart';
import 'session_mode.dart';

/// `POST /api/v1/sessions/estimate`, `POST /api/v1/sessions/create`, and
/// `POST /api/v1/sessions/answer`.
class SessionRepository {
  SessionRepository(this._dio);

  final Dio _dio;

  Future<int> estimateAvailableCount(SessionBuilderQuery query) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/sessions/estimate',
      data: query.toJson(),
    );
    return (response.data!['availableCount'] as num).toInt();
  }

  Future<PracticeSession> create(SessionBuilderQuery query) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/sessions/create',
      data: query.toJson(),
    );
    return PracticeSession.fromJson(response.data!);
  }

  Future<AnswerResult> submitAnswer({
    String? sessionId,
    required String questionId,
    required int questionVersion,
    required String selectedOptionId,
    Confidence? confidence,
    required int timeTakenSeconds,
    required SessionMode mode,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/sessions/answer',
      data: {
        if (sessionId != null) 'sessionId': sessionId,
        'questionId': questionId,
        'questionVersion': questionVersion,
        'selectedOptionId': selectedOptionId,
        if (confidence != null) 'confidence': confidence.apiValue,
        'timeTakenSeconds': timeTakenSeconds,
        'mode': mode.apiValue,
      },
    );
    return AnswerResult.fromJson(response.data!);
  }
}
