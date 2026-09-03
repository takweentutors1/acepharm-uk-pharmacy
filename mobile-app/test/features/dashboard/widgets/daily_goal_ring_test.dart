import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/dashboard/daily_goal.dart';
import 'package:mobile_app/features/dashboard/daily_goal_repository.dart';
import 'package:mobile_app/features/dashboard/widgets/daily_goal_ring.dart';

class _FakeDailyGoalRepository extends DailyGoalRepository {
  _FakeDailyGoalRepository(this._result) : super(Dio());

  final Future<DailyGoal> Function() _result;
  int callCount = 0;

  @override
  Future<DailyGoal> fetch() {
    callCount++;
    return _result();
  }
}

void main() {
  testWidgets('shows the real answeredToday/dailyTarget figures', (
    tester,
  ) async {
    final repo = _FakeDailyGoalRepository(
      () async => const DailyGoal(
        dailyTarget: 20,
        answeredToday: 14,
        isGoalCompleted: false,
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: DailyGoalRing(repository: repo)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('14/20', findRichText: true), findsOneWidget);
  });

  testWidgets('shows an error state with a working retry button', (
    tester,
  ) async {
    var shouldFail = true;
    final repo = _FakeDailyGoalRepository(() async {
      if (shouldFail) throw DioException(requestOptions: RequestOptions());
      return const DailyGoal(
        dailyTarget: 20,
        answeredToday: 5,
        isGoalCompleted: false,
      );
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: DailyGoalRing(repository: repo)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining("Couldn't load"), findsOneWidget);

    shouldFail = false;
    await tester.tap(find.text('Retry'));
    await tester.pumpAndSettle();

    expect(find.text('5/20', findRichText: true), findsOneWidget);
    expect(repo.callCount, 2);
  });
}
