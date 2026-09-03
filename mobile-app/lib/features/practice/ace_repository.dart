import 'package:dio/dio.dart';

import 'ace_citation.dart';

class AceReplyResult {
  const AceReplyResult({
    required this.content,
    required this.threadId,
    required this.citations,
    this.refused = false,
  });

  final String content;
  final String threadId;
  final List<AceCitation> citations;

  /// True when the server determined it had no reviewed grounding for
  /// this query at all and refused deterministically, without ever
  /// calling the model (see `REFUSAL_MESSAGE` in `ace-service.ts`).
  final bool refused;

  factory AceReplyResult.fromJson(Map<String, dynamic> json) {
    return AceReplyResult(
      content: json['content'] as String,
      threadId: json['threadId'] as String,
      citations: (json['citations'] as List<dynamic>? ?? const [])
          .map((e) => AceCitation.fromJson(e as Map<String, dynamic>))
          .toList(),
      refused: json['refused'] as bool? ?? false,
    );
  }
}

/// `POST /api/v1/ace/message` — grounded clinical Q&A scoped to a
/// question's context, non-streaming (the API forces `stream: false` for
/// this endpoint specifically for the "Ask Ace drawer" use case). Pass
/// the previous call's [AceReplyResult.threadId] back in as [threadId] to
/// continue the same conversation.
class AceRepository {
  AceRepository(this._dio);

  final Dio _dio;

  Future<AceReplyResult> sendMessage({
    required String contextId,
    required String prompt,
    String? threadId,
    String? userId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/ace/message',
      data: {
        'contextType': 'question',
        'contextId': contextId,
        'prompt': prompt,
        if (threadId != null) 'threadId': threadId,
        if (userId != null) 'userId': userId,
      },
    );
    return AceReplyResult.fromJson(response.data!);
  }
}
