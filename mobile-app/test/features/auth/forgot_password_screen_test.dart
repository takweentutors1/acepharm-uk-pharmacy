// ignore_for_file: invalid_use_of_protected_member
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/auth/auth_repository.dart';
import 'package:mobile_app/features/auth/forgot_password_screen.dart';

class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository();

  String? lastEmail;
  Object? resetError;
  int resetCallCount = 0;

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    resetCallCount++;
    lastEmail = email;
    if (resetError != null) throw resetError!;
  }
}

void main() {
  testWidgets('shows a validation error and never calls the repository for '
      'an invalid email', (tester) async {
    final authRepository = _FakeAuthRepository();

    await tester.pumpWidget(
      MaterialApp(home: ForgotPasswordScreen(authRepository: authRepository)),
    );

    await tester.tap(find.text('Send reset link'));
    await tester.pump();

    expect(find.text('Enter a valid email address'), findsOneWidget);
    expect(authRepository.resetCallCount, 0);
  });

  testWidgets('shows the confirmation view after a successful send', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository();

    await tester.pumpWidget(
      MaterialApp(home: ForgotPasswordScreen(authRepository: authRepository)),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      '  student@acepharm.co.uk  ',
    );
    await tester.tap(find.text('Send reset link'));
    await tester.pump();

    expect(authRepository.resetCallCount, 1);
    expect(authRepository.lastEmail, 'student@acepharm.co.uk');
    expect(find.text('Reset link sent'), findsOneWidget);
    expect(find.textContaining('Check student@acepharm.co.uk'), findsOneWidget);
    // The form is gone — no way to resubmit once sent.
    expect(find.text('Send reset link'), findsNothing);
  });

  testWidgets('Back to login pops the screen from the confirmation view', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: ElevatedButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      ForgotPasswordScreen(authRepository: authRepository),
                ),
              ),
              child: const Text('open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      'student@acepharm.co.uk',
    );
    await tester.tap(find.text('Send reset link'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Back to login'));
    await tester.pumpAndSettle();

    expect(find.byType(ForgotPasswordScreen), findsNothing);
    expect(find.text('open'), findsOneWidget);
  });

  testWidgets('shows a friendly message and stays on the form when the '
      'reset email fails to send', (tester) async {
    final authRepository = _FakeAuthRepository()
      ..resetError = DioException(
        requestOptions: RequestOptions(path: '/auth/request-password-reset'),
        type: DioExceptionType.connectionError,
      );

    await tester.pumpWidget(
      MaterialApp(home: ForgotPasswordScreen(authRepository: authRepository)),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      'nobody@acepharm.co.uk',
    );
    await tester.tap(find.text('Send reset link'));
    await tester.pump();

    expect(
      find.text('No internet connection. Check your network and try again.'),
      findsOneWidget,
    );
    expect(find.text('Send reset link'), findsOneWidget);
  });
}
