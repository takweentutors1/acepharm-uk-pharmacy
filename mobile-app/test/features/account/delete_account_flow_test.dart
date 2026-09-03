import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/account/account_repository.dart';
import 'package:mobile_app/features/account/delete_account_flow.dart';
import 'package:mobile_app/features/auth/auth_repository.dart';

class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository();

  String? lastReauthPassword;
  bool deleteAccountCalled = false;
  Object? reauthError;
  Object? deleteError;

  @override
  Future<void> reauthenticateWithPassword(String password) async {
    lastReauthPassword = password;
    if (reauthError != null) throw reauthError!;
  }

  @override
  Future<void> deleteAccount() async {
    deleteAccountCalled = true;
    if (deleteError != null) throw deleteError!;
  }
}

class _FakeAccountRepository extends AccountRepository {
  _FakeAccountRepository() : super(Dio());

  bool deleteAccountCalled = false;
  Object? deleteError;

  @override
  Future<void> deleteAccount() async {
    deleteAccountCalled = true;
    if (deleteError != null) throw deleteError!;
  }
}

/// A `start` button whose `onPressed` fires [startAccountDeletion] with a
/// `context` that's actually a descendant of [MaterialApp] — required so
/// the modal sheets it shows can find `MaterialLocalizations`.
Widget _harness({
  required AuthRepository authRepository,
  required AccountRepository accountRepository,
}) {
  return MaterialApp(
    home: Scaffold(
      body: Builder(
        builder: (context) => ElevatedButton(
          onPressed: () => startAccountDeletion(
            context,
            authRepository: authRepository,
            accountRepository: accountRepository,
          ),
          child: const Text('start'),
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('Cancel on the warning step dismisses without side effects', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository();
    final accountRepository = _FakeAccountRepository();

    await tester.pumpWidget(
      _harness(
        authRepository: authRepository,
        accountRepository: accountRepository,
      ),
    );

    await tester.tap(find.text('start'));
    await tester.pumpAndSettle();

    expect(find.text('Delete your account?'), findsOneWidget);
    expect(find.textContaining('cannot be undone'), findsOneWidget);

    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    expect(find.text('Delete your account?'), findsNothing);
    expect(find.text('Confirm with your password'), findsNothing);
    expect(accountRepository.deleteAccountCalled, isFalse);
    expect(authRepository.deleteAccountCalled, isFalse);
  });

  testWidgets('Continue advances to the password confirmation step', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository();
    final accountRepository = _FakeAccountRepository();

    await tester.pumpWidget(
      _harness(
        authRepository: authRepository,
        accountRepository: accountRepository,
      ),
    );
    await tester.tap(find.text('start'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Confirm with your password'), findsOneWidget);
    expect(find.text('Delete my account'), findsOneWidget);
  });

  testWidgets('empty password shows a validation error without calling out', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository();
    final accountRepository = _FakeAccountRepository();

    await tester.pumpWidget(
      _harness(
        authRepository: authRepository,
        accountRepository: accountRepository,
      ),
    );
    await tester.tap(find.text('start'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Delete my account'));
    await tester.pumpAndSettle();

    expect(find.text('Enter your password to confirm.'), findsOneWidget);
    expect(authRepository.lastReauthPassword, isNull);
  });

  testWidgets(
    'a correct password reauthenticates, deletes on the backend, then '
    'deletes the Firebase account, in that order',
    (tester) async {
      final authRepository = _FakeAuthRepository();
      final accountRepository = _FakeAccountRepository();

      await tester.pumpWidget(
        _harness(
          authRepository: authRepository,
          accountRepository: accountRepository,
        ),
      );
      await tester.tap(find.text('start'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField), 'correct-horse');
      await tester.tap(find.text('Delete my account'));
      await tester.pumpAndSettle();

      expect(authRepository.lastReauthPassword, 'correct-horse');
      expect(accountRepository.deleteAccountCalled, isTrue);
      expect(authRepository.deleteAccountCalled, isTrue);
      // The sheet closes on success.
      expect(find.text('Confirm with your password'), findsNothing);
    },
  );

  testWidgets('a wrong password stops before any deletion happens', (
    tester,
  ) async {
    final authRepository = _FakeAuthRepository()
      ..reauthError = Exception('wrong-password');
    final accountRepository = _FakeAccountRepository();

    await tester.pumpWidget(
      _harness(
        authRepository: authRepository,
        accountRepository: accountRepository,
      ),
    );
    await tester.tap(find.text('start'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField), 'wrong');
    await tester.tap(find.text('Delete my account'));
    await tester.pumpAndSettle();

    expect(find.text('Confirm with your password'), findsOneWidget);
    expect(accountRepository.deleteAccountCalled, isFalse);
    expect(authRepository.deleteAccountCalled, isFalse);
  });

  testWidgets(
    'a backend deletion failure leaves the Firebase account untouched',
    (tester) async {
      final authRepository = _FakeAuthRepository();
      final accountRepository = _FakeAccountRepository()
        ..deleteError = DioException(requestOptions: RequestOptions());

      await tester.pumpWidget(
        _harness(
          authRepository: authRepository,
          accountRepository: accountRepository,
        ),
      );
      await tester.tap(find.text('start'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField), 'correct-horse');
      await tester.tap(find.text('Delete my account'));
      await tester.pumpAndSettle();

      expect(find.text('Confirm with your password'), findsOneWidget);
      expect(authRepository.deleteAccountCalled, isFalse);
    },
  );
}
