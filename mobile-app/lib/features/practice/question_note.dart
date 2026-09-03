/// A personal clinical note, scoped to a question (and optionally a
/// subtopic). Mirrors the `notes` table row shape.
class QuestionNote {
  const QuestionNote({
    required this.id,
    this.title,
    required this.content,
    required this.updatedAt,
  });

  final String id;
  final String? title;
  final String content;
  final DateTime updatedAt;

  factory QuestionNote.fromJson(Map<String, dynamic> json) {
    return QuestionNote(
      id: json['id'] as String,
      title: json['title'] as String?,
      content: json['content'] as String,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
