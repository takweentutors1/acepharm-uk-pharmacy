import 'subscription_plan.dart';

/// `GET /api/v1/stripe/subscription`.
class SubscriptionStatus {
  const SubscriptionStatus({
    required this.plan,
    required this.status,
    required this.isPaid,
    this.currentPeriodEnd,
    this.cancelAtPeriodEnd = false,
  });

  final SubscriptionPlan plan;
  final String status;
  final bool isPaid;
  final DateTime? currentPeriodEnd;
  final bool cancelAtPeriodEnd;

  factory SubscriptionStatus.fromJson(Map<String, dynamic> json) {
    return SubscriptionStatus(
      plan: SubscriptionPlan.fromApiValue(json['plan'] as String?),
      status: json['status'] as String? ?? 'active',
      isPaid: json['isPaid'] as bool? ?? false,
      currentPeriodEnd: switch (json['currentPeriodEnd']) {
        String value => DateTime.tryParse(value),
        _ => null,
      },
      cancelAtPeriodEnd: json['cancelAtPeriodEnd'] as bool? ?? false,
    );
  }
}
