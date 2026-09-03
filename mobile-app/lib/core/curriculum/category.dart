/// Mirrors the `categories` row shape from
/// `web-app/apps/api/src/db/schema.ts` — one of the GPhC curriculum
/// domains returned by `GET /api/v1/curriculum/categories`.
class Category {
  const Category({
    required this.id,
    required this.pathwayId,
    required this.name,
    required this.code,
    this.description,
  });

  final String id;
  final String pathwayId;
  final String name;
  final String code;
  final String? description;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as String,
      pathwayId: json['pathwayId'] as String,
      name: json['name'] as String,
      code: json['code'] as String,
      description: json['description'] as String?,
    );
  }
}
