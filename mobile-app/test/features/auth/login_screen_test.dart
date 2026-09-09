// ignore_for_file: invalid_use_of_protected_member
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/auth/auth_repository.dart';
import 'package:mobile_app/features/auth/forgot_password_screen.dart';
import 'package:mobile_app/features/auth/login_screen.dart';
import 'package:mobile_app/features/auth/signup_screen.dart';

class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository();

  String? lastEmail;
  String? lastPassword;
  Object? signInError;
  int signInCallCount = 0;

  @override
  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    signInCallCount++;
    lastEmail = email;
    lastPassword = password;
    if (signInError != null) throw signInError!;
  }
}

void main() {
  testWidgets('shows validation errors and never calls the repository '
      'with empty fields', (tester) async {
    final authRepository = _FakeAuthRepository();

    await tester.pumpWidget(
      MaterialApp(home: LoginScreen(authRepository: authRepository)),
    );

    await tester.tap(find.text('Log in'));
    await tester.pump();

    expect(find.text('Enter a valid email address'), findsOneWidget);
    expect(find.text('Enter your password'), findsOneWidget);
    expect(authRepository.signInCallCount, 0);
  });

  testWidgets('submits the trimmed email and password on Log in', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository()
      ..signInError = Exception('short-circuit after capturing args');

    await tester.pumpWidget(
      MaterialApp(home: LoginScreen(authRepository: authRepository)),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      '  student@acepharm.co.uk  ',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'hunter2',
    );
    await tester.tap(find.text('Log in'));
    await tester.pump();

    expect(authRepository.signInCallCount, 1);
    expect(authRepository.lastEmail, 'student@acepharm.co.uk');
    expect(authRepository.lastPassword, 'hunter2');
  });

  testWidgets('shows a friendly message when sign-in fails', (tester) async {
    final requestOptions = RequestOptions(path: '/auth/login');
    final authRepository = _FakeAuthRepository()
      ..signInError = DioException(
        requestOptions: requestOptions,
        response: Response(
          requestOptions: requestOptions,
          statusCode: 401,
          data: {'error': 'invalid_credentials'},
        ),
        type: DioExceptionType.badResponse,
      );

    await tester.pumpWidget(
      MaterialApp(home: LoginScreen(authRepository: authRepository)),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      'student@acepharm.co.uk',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'wrong',
    );
    await tester.tap(find.text('Log in'));
    await tester.pump();

    expect(find.text('Incorrect email or password.'), findsOneWidget);
  });

  testWidgets('Forgot password? opens ForgotPasswordScreen', (tester) async {
    final authRepository = _FakeAuthRepository();

    await tester.pumpWidget(
      MaterialApp(home: LoginScreen(authRepository: authRepository)),
    );

    await tester.tap(find.text('Forgot password?'));
    await tester.pumpAndSettle();

    expect(find.byType(ForgotPasswordScreen), findsOneWidget);
  });

  testWidgets('Sign up opens SignUpScreen', (tester) async {
    final authRepository = _FakeAuthRepository();

    await tester.pumpWidget(
      MaterialApp(home: LoginScreen(authRepository: authRepository)),
    );

    await tester.tap(find.text('Sign up'));
    await tester.pumpAndSettle();

    expect(find.byType(SignUpScreen), findsOneWidget);
  });
}
