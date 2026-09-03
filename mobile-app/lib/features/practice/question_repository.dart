import 'package:dio/dio.dart';

import 'question_note.dart';

/// `POST /api/v1/questions/:id/bookmark` and the personal-notes endpoints.
class QuestionRepository {
  QuestionRepository(this._dio);

  final Dio _dio;

  /// Toggles the bookmark and returns the new state.
  Future<bool> toggleBookmark(String questionId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/questions/$questionId/bookmark',
    );
    return response.data!['bookmarked'] as bool;
  }

  Future<List<QuestionNote>> fetchNotes(String questionId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/questions/$questionId/notes',
    );
    final list = response.data!['notes'] as List<dynamic>;
    return list
        .map((e) => QuestionNote.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveNote(
    String questionId, {
    String? title,
    required String content,
  }) {
    return _dio.post<Map<String, dynamic>>(
      '/questions/$questionId/notes',
      data: {
        if (title != null && title.isNotEmpty) 'title': title,
        'content': content,
      },
    );
  }
}
