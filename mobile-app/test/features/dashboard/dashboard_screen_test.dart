import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/curriculum/category.dart';
import 'package:mobile_app/core/curriculum/curriculum_repository.dart';
import 'package:mobile_app/core/user/user_profile.dart';
import 'package:mobile_app/features/dashboard/dashboard_screen.dart';
import 'package:mobile_app/features/dashboard/daily_goal.dart';
import 'package:mobile_app/features/dashboard/daily_goal_repository.dart';
import 'package:mobile_app/features/dashboard/recommendation.dart';
import 'package:mobile_app/features/dashboard/recommendation_repository.dart';
import 'package:mobile_app/features/dashboard/weekly_insight.dart';
import 'package:mobile_app/features/dashboard/weekly_insight_repository.dart';
import 'package:mobile_app/features/practice/ace_repository.dart';
import 'package:mobile_app/features/practice/question_repository.dart';
import 'package:mobile_app/features/practice/session_repository.dart';
import 'package:mobile_app/features/progress/progress_repository.dart';
import 'package:mobile_app/features/subscription/subscription_repository.dart';

class _FakeDailyGoalRepository extends DailyGoalRepository {
  _FakeDailyGoalRepository() : super(Dio());

  @override
  Future<DailyGoal> fetch() async {
    return const DailyGoal(
      dailyTarget: 20,
      answeredToday: 14,
      isGoalCompleted: false,
    );
  }
}

class _FakeWeeklyInsightRepository extends WeeklyInsightRepository {
  _FakeWeeklyInsightRepository() : super(Dio());

  String? lastUserId;

  @override
  Future<WeeklyInsight> fetch({String? userId}) async {
    lastUserId = userId;
    return const WeeklyInsight(
      insightParagraph: 'Great work this week.',
      confidentlyIncorrectCount: 0,
      source: 'kv_cache',
    );
  }
}

class _FakeRecommendationRepository extends RecommendationRepository {
  _FakeRecommendationRepository() : super(Dio());

  @override
  Future<Recommendation> fetch() async {
    return const Recommendation(
      reason: RecommendationReason.mostUnseen,
      reasonText: 'Fresh topic to try.',
      subtopicId: 'sub-1',
      subtopicName: 'Antimicrobials',
      categoryName: 'Infection',
      availableUnseenCount: 5,
      totalQuestionsInSubtopic: 20,
      attemptsCount: 0,
      recommendedQuestionCount: 10,
    );
  }
}

class _FakeCurriculumRepository extends CurriculumRepository {
  _FakeCurriculumRepository() : super(Dio());

  @override
  Future<List<Category>> fetchCategories({String? pathwayId}) async => const [];
}

Widget _dashboard({
  UserProfile? profile,
  required WeeklyInsightRepository weeklyInsight,
  DailyGoalRepository? dailyGoal,
}) {
  final dio = Dio();
  return MaterialApp(
    home: DashboardScreen(
      profile: profile,
      dailyGoalRepository: dailyGoal ?? _FakeDailyGoalRepository(),
      weeklyInsightRepository: weeklyInsight,
      recommendationRepository: _FakeRecommendationRepository(),
      curriculumRepository: _FakeCurriculumRepository(),
      sessionRepository: SessionRepository(dio),
      questionRepository: QuestionRepository(dio),
      aceRepository: AceRepository(dio),
      progressRepository: ProgressRepository(dio),
      subscriptionRepository: SubscriptionRepository(dio),
    ),
  );
}

void main() {
  testWidgets('threads the resolved D1 user id to WeeklyInsightCard', (
    tester,
  ) async {
    final weeklyInsight = _FakeWeeklyInsightRepository();

    await tester.pumpWidget(
      _dashboard(
        profile: const UserProfile(id: 'd1-user-42', email: 'a@b.com'),
        weeklyInsight: weeklyInsight,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('AcePharm'), findsOneWidget);
    expect(weeklyInsight.lastUserId, 'd1-user-42');
  });

  testWidgets('renders fine with a null profile (non-personalised)', (
    tester,
  ) async {
    final weeklyInsight = _FakeWeeklyInsightRepository();

    await tester.pumpWidget(_dashboard(weeklyInsight: weeklyInsight));
    await tester.pumpAndSettle();

    expect(find.text('AcePharm'), findsOneWidget);
    expect(weeklyInsight.lastUserId, isNull);
  });

  testWidgets('shows the real daily-goal figures on the revision ring', (
    tester,
  ) async {
    await tester.pumpWidget(
      _dashboard(weeklyInsight: _FakeWeeklyInsightRepository()),
    );
    await tester.pumpAndSettle();

    expect(find.text('14/20', findRichText: true), findsOneWidget);
  });

  testWidgets(
    'shows the exam countdown ticker when an assessment date is set',
    (tester) async {
      final futureDate = DateTime.now().add(const Duration(days: 10));

      await tester.pumpWidget(
        _dashboard(
          profile: UserProfile(
            id: 'u1',
            email: 'a@b.com',
            assessmentDate: DateTime(
              futureDate.year,
              futureDate.month,
              futureDate.day,
            ),
          ),
          weeklyInsight: _FakeWeeklyInsightRepository(),
        ),
      );
      await tester.pumpAndSettle();

      expect(
        find.textContaining('days to your exam', findRichText: true),
        findsOneWidget,
      );
    },
  );

  testWidgets(
    'hides the exam countdown ticker when no assessment date is set',
    (tester) async {
      await tester.pumpWidget(
        _dashboard(
          profile: const UserProfile(id: 'u1', email: 'a@b.com'),
          weeklyInsight: _FakeWeeklyInsightRepository(),
        ),
      );
      await tester.pumpAndSettle();

      expect(
        find.textContaining('days to your exam', findRichText: true),
        findsNothing,
      );
    },
  );

  testWidgets('Build a session opens the session builder', (tester) async {
    await tester.pumpWidget(
      _dashboard(weeklyInsight: _FakeWeeklyInsightRepository()),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Build a session'));
    await tester.pumpAndSettle();

    // SessionBuilderScreen's own AppBar title is also "Build a session",
    // so assert on body content unique to it instead.
    expect(find.text('Mode'), findsOneWidget);
    expect(find.text('Learn Mode'), findsOneWidget);
    expect(find.text('Timed Exam Mode'), findsOneWidget);
  });

  testWidgets('the subscription icon opens the subscription screen', (
    tester,
  ) async {
    await tester.pumpWidget(
      _dashboard(weeklyInsight: _FakeWeeklyInsightRepository()),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Subscription'));
    await tester.pumpAndSettle();

    expect(find.text('Subscription'), findsOneWidget);
  });
}
