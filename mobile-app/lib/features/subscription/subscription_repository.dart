import 'package:dio/dio.dart';

import 'subscription_status.dart';

/// `GET /api/v1/stripe/subscription` and
/// `POST /api/v1/stripe/customer-portal`.
class SubscriptionRepository {
  SubscriptionRepository(this._dio);

  final Dio _dio;

  Future<SubscriptionStatus> fetchStatus() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/stripe/subscription',
    );
    return SubscriptionStatus.fromJson(response.data!);
  }

  /// Creates a live Stripe Billing Portal session and returns its URL —
  /// the deep link out to the web customer portal.
  Future<String> createCustomerPortalSession() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/stripe/customer-portal',
    );
    return response.data!['url'] as String;
  }
}
