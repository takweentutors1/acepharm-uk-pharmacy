/// Mirrors `CitationItem` from `web-app/apps/api/src/lib/ace-service.ts`.
/// [label] is server-resolved from the chunk's source (subtopic name,
/// question public ID, or — once the references table is indexed into
/// the RAG pipeline — the BNF/NICE guideline title); it's null only if
/// the underlying source row couldn't be resolved.
class AceCitation {
  const AceCitation({
    required this.id,
    required this.sourceType,
    required this.sourceId,
    this.label,
    this.url,
  });

  final String id;
  final String sourceType;
  final String sourceId;
  final String? label;
  final String? url;

  /// Best-effort human-readable text — falls back to the raw source type
  /// only when the server couldn't resolve a proper label.
  String get displayLabel => label ?? sourceType;

  factory AceCitation.fromJson(Map<String, dynamic> json) {
    return AceCitation(
      id: json['id'] as String,
      sourceType: json['sourceType'] as String,
      sourceId: json['sourceId'] as String,
      label: json['label'] as String?,
      url: json['url'] as String?,
    );
  }
}
