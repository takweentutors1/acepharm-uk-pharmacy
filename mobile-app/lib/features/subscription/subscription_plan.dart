/// Mirrors `subscriptions.plan` in `web-app/apps/api/src/db/schema.ts`.
enum SubscriptionPlan {
  explorer,
  monthlyPro,
  yearlyPro;

  static SubscriptionPlan fromApiValue(String? value) => switch (value) {
    'monthly_pro' => SubscriptionPlan.monthlyPro,
    'yearly_pro' => SubscriptionPlan.yearlyPro,
    _ => SubscriptionPlan.explorer,
  };

  String get label => switch (this) {
    SubscriptionPlan.explorer => 'Explorer (Free)',
    SubscriptionPlan.monthlyPro => 'AcePharm Monthly',
    SubscriptionPlan.yearlyPro => 'AcePharm Yearly',
  };
}
