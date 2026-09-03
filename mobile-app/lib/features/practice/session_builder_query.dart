import 'session_mode.dart';

/// Mirrors `SessionBuilderQuery` from
/// `web-app/apps/api/src/routes/sessions.ts`. An empty [categoryIds]
/// means "no category filter" server-side, so it's simply omitted from
/// the request rather than sent as `[]`.
class SessionBuilderQuery {
  const SessionBuilderQuery({
    required this.mode,
    required this.categoryIds,
    this.questionCount = 20,
  });

  final SessionMode mode;
  final List<String> categoryIds;
  final int questionCount;

  Map<String, dynamic> toJson() {
    return {
      'mode': mode.apiValue,
      if (categoryIds.isNotEmpty) 'categoryIds': categoryIds,
      'questionCount': questionCount,
    };
  }
}
