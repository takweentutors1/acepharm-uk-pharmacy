import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/analytics/analytics_service.dart';

void main() {
  test('constructing AnalyticsService never touches FirebaseAnalytics.instance '
      '(no Firebase.initializeApp in plain tests)', () {
    expect(() => AnalyticsService(), returnsNormally);
  });
}
