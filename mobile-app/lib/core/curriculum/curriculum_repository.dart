import 'package:dio/dio.dart';

import 'category.dart';

/// Fetches `GET /api/v1/curriculum/categories` — the flat list of GPhC
/// curriculum domains, optionally scoped to a pathway.
class CurriculumRepository {
  CurriculumRepository(this._dio);

  final Dio _dio;

  Future<List<Category>> fetchCategories({String? pathwayId}) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/curriculum/categories',
      queryParameters: pathwayId == null ? null : {'pathwayId': pathwayId},
    );
    final list = response.data!['categories'] as List<dynamic>;
    return list
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
