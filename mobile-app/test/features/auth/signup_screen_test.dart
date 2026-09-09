// ignore_for_file: invalid_use_of_protected_member
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/auth/auth_repository.dart';
import 'package:mobile_app/features/auth/signup_screen.dart';

class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository();

  String? lastEmail;
  String? lastPassword;
  Object? signUpError;
  int signUpCallCount = 0;

  @override
  Future<void> signUpWithEmail({
    required String email,
    required String password,
    String? firstName,
  }) async {
    signUpCallCount++;
    lastEmail = email;
    lastPassword = password;
    if (signUpError != null) throw signUpError!;
  }
}

void main() {
  testWidgets(
    'shows validation errors and never calls the repository with empty '
    'fields',
    (tester) async {
      final authRepository = _FakeAuthRepository();

      await tester.pumpWidget(
        MaterialApp(home: SignUpScreen(authRepository: authRepository)),
      );

      await tester.tap(find.text('Create account'));
      await tester.pump();

      expect(find.text('Enter a valid email address'), findsOneWidget);
      expect(find.text('Use at least 8 characters'), findsOneWidget);
      expect(authRepository.signUpCallCount, 0);
    },
  );

  testWidgets('rejects a confirm-password mismatch', (tester) async {
    final authRepository = _FakeAuthRepository();

    await tester.pumpWidget(
      MaterialApp(home: SignUpScreen(authRepository: authRepository)),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      'student@acepharm.co.uk',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'longenoughpw',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirm password'),
      'different',
    );
    await tester.tap(find.text('Create account'));
    await tester.pump();

    expect(find.text('Passwords do not match'), findsOneWidget);
    expect(authRepository.signUpCallCount, 0);
  });

  testWidgets('shows the strength meter as the password is typed', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository();

    await tester.pumpWidget(
      MaterialApp(home: SignUpScreen(authRepository: authRepository)),
    );

    expect(find.textContaining('Password strength:'), findsNothing);

    await tester.enterText(find.widgetWithText(TextFormField, 'Password'), 'a');
    await tester.pump();

    expect(find.text('Password strength: Weak'), findsOneWidget);
  });

  testWidgets('submits the trimmed email and password on Create account', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository()
      ..signUpError = Exception('short-circuit after capturing args');

    await tester.pumpWidget(
      MaterialApp(home: SignUpScreen(authRepository: authRepository)),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      '  new.student@acepharm.co.uk  ',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'longenoughpw',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirm password'),
      'longenoughpw',
    );
    await tester.tap(find.text('Create account'));
    await tester.pump();

    expect(authRepository.signUpCallCount, 1);
    expect(authRepository.lastEmail, 'new.student@acepharm.co.uk');
    expect(authRepository.lastPassword, 'longenoughpw');
  });

  testWidgets('shows a friendly message when sign-up fails', (tester) async {
    final requestOptions = RequestOptions(path: '/auth/signup');
    final authRepository = _FakeAuthRepository()
      ..signUpError = DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 409,
          data: {'error': 'email_already_exists'},
        ),
        type: DioExceptionType.badResponse,
      );

    await tester.pumpWidget(
      MaterialApp(home: SignUpScreen(authRepository: authRepository)),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      'student@acepharm.co.uk',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'longenoughpw',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirm password'),
      'longenoughpw',
    );
    await tester.tap(find.text('Create account'));
    await tester.pump();

    expect(
      find.text('An account already exists for that email.'),
      findsOneWidget,
    );
  });
}
