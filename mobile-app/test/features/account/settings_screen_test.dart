import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/account/account_repository.dart';
import 'package:mobile_app/features/account/settings_screen.dart';
import 'package:mobile_app/features/auth/auth_repository.dart';

void main() {
  testWidgets('tapping Delete account opens the deletion warning sheet', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SettingsScreen(
          authRepository: AuthRepository(),
          accountRepository: AccountRepository(Dio()),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('ACCOUNT'), findsOneWidget);
    expect(find.text('Delete account'), findsOneWidget);

    await tester.tap(find.text('Delete account'));
    await tester.pumpAndSettle();

    expect(find.text('Delete your account?'), findsOneWidget);
  });
}
