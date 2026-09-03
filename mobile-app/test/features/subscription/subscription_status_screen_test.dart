import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/subscription/subscription_plan.dart';
import 'package:mobile_app/features/subscription/subscription_repository.dart';
import 'package:mobile_app/features/subscription/subscription_status.dart';
import 'package:mobile_app/features/subscription/subscription_status_screen.dart';

class _FakeSubscriptionRepository extends SubscriptionRepository {
  _FakeSubscriptionRepository(this._result) : super(Dio());

  final Future<SubscriptionStatus> Function() _result;
  int fetchCallCount = 0;
  int portalCallCount = 0;
  String portalUrl = 'https://billing.stripe.com/session/test_123';

  @override
  Future<SubscriptionStatus> fetchStatus() {
    fetchCallCount++;
    return _result();
  }

  @override
  Future<String> createCustomerPortalSession() async {
    portalCallCount++;
    return portalUrl;
  }
}

void main() {
  testWidgets('shows the plan tier and renewal date for a paid subscriber', (
    tester,
  ) async {
    final repo = _FakeSubscriptionRepository(
      () async => SubscriptionStatus(
        plan: SubscriptionPlan.monthlyPro,
        status: 'active',
        isPaid: true,
        currentPeriodEnd: DateTime(2026, 10, 15),
      ),
    );

    await tester.pumpWidget(
      MaterialApp(home: SubscriptionStatusScreen(repository: repo)),
    );
    await tester.pumpAndSettle();

    expect(find.text('AcePharm Monthly'), findsOneWidget);
    expect(find.text('Renews on 15/10/2026'), findsOneWidget);
    expect(find.text('Manage billing'), findsOneWidget);
  });

  testWidgets(
    'shows a free-plan message and hides Manage billing for explorer users',
    (tester) async {
      final repo = _FakeSubscriptionRepository(
        () async => const SubscriptionStatus(
          plan: SubscriptionPlan.explorer,
          status: 'active',
          isPaid: false,
        ),
      );

      await tester.pumpWidget(
        MaterialApp(home: SubscriptionStatusScreen(repository: repo)),
      );
      await tester.pumpAndSettle();

      expect(find.text('Explorer (Free)'), findsOneWidget);
      expect(find.text('No active billing period.'), findsOneWidget);
      expect(find.text('Manage billing'), findsNothing);
      expect(
        find.textContaining('upgrade to a paid plan', findRichText: true),
        findsOneWidget,
      );
    },
  );

  testWidgets('flags a plan that is not renewing', (tester) async {
    final repo = _FakeSubscriptionRepository(
      () async => SubscriptionStatus(
        plan: SubscriptionPlan.yearlyPro,
        status: 'active',
        isPaid: true,
        currentPeriodEnd: DateTime(2027, 1, 1),
        cancelAtPeriodEnd: true,
      ),
    );

    await tester.pumpWidget(
      MaterialApp(home: SubscriptionStatusScreen(repository: repo)),
    );
    await tester.pumpAndSettle();

    expect(
      find.textContaining('not renewing', findRichText: true),
      findsOneWidget,
    );
  });

  testWidgets('surfaces a non-active status badge (e.g. past_due)', (
    tester,
  ) async {
    final repo = _FakeSubscriptionRepository(
      () async => SubscriptionStatus(
        plan: SubscriptionPlan.monthlyPro,
        status: 'past_due',
        isPaid: true,
        currentPeriodEnd: DateTime(2026, 10, 15),
      ),
    );

    await tester.pumpWidget(
      MaterialApp(home: SubscriptionStatusScreen(repository: repo)),
    );
    await tester.pumpAndSettle();

    expect(find.text('past due'), findsOneWidget);
  });

  testWidgets('Manage billing opens the returned Stripe portal URL', (
    tester,
  ) async {
    final repo = _FakeSubscriptionRepository(
      () async => SubscriptionStatus(
        plan: SubscriptionPlan.monthlyPro,
        status: 'active',
        isPaid: true,
        currentPeriodEnd: DateTime(2026, 10, 15),
      ),
    );
    Uri? openedUrl;

    await tester.pumpWidget(
      MaterialApp(
        home: SubscriptionStatusScreen(
          repository: repo,
          urlOpener: (url) async {
            openedUrl = url;
            return true;
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Manage billing'));
    await tester.pumpAndSettle();

    expect(repo.portalCallCount, 1);
    expect(openedUrl, Uri.parse(repo.portalUrl));
  });

  testWidgets('shows an inline error when the portal fails to open', (
    tester,
  ) async {
    final repo = _FakeSubscriptionRepository(
      () async => SubscriptionStatus(
        plan: SubscriptionPlan.monthlyPro,
        status: 'active',
        isPaid: true,
        currentPeriodEnd: DateTime(2026, 10, 15),
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: SubscriptionStatusScreen(
          repository: repo,
          urlOpener: (_) async => false,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Manage billing'));
    await tester.pumpAndSettle();

    expect(find.text("Couldn't open the billing portal."), findsOneWidget);
  });

  testWidgets('shows an error state with a working retry button', (
    tester,
  ) async {
    var shouldFail = true;
    final repo = _FakeSubscriptionRepository(() async {
      if (shouldFail) throw DioException(requestOptions: RequestOptions());
      return const SubscriptionStatus(
        plan: SubscriptionPlan.explorer,
        status: 'active',
        isPaid: false,
      );
    });

    await tester.pumpWidget(
      MaterialApp(home: SubscriptionStatusScreen(repository: repo)),
    );
    await tester.pumpAndSettle();

    expect(find.text("Couldn't load your subscription."), findsOneWidget);

    shouldFail = false;
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    expect(find.text('Explorer (Free)'), findsOneWidget);
    expect(repo.fetchCallCount, 2);
  });
}
