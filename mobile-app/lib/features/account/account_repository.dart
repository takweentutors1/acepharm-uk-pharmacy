import 'package:dio/dio.dart';

/// `DELETE /api/v1/user/account` — permanently deletes the signed-in
/// user's D1 record and (via FK cascade) everything tied to it.
class AccountRepository {
  AccountRepository(this._dio);

  final Dio _dio;

  Future<void> deleteAccount() => _dio.delete('/user/account');
}
