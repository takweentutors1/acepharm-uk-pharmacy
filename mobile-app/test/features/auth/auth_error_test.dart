import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/auth/auth_error.dart';

final _requestOptions = RequestOptions(path: '/auth/login');

DioException _apiError(int statusCode, Map<String, dynamic>? data) {
  return DioException(
    requestOptions: _requestOptions,
    response: Response(
      requestOptions: _requestOptions,
      statusCode: statusCode,
      data: data,
    ),
    type: DioExceptionType.badResponse,
  );
}

void main() {
  group('describeAuthError', () {
    test('falls back to a generic message for a non-Dio error', () {
      expect(
        describeAuthError(Exception('boom')),
        'Something went wrong. Please try again.',
      );
    });

    test('falls back to a generic message for a StateError', () {
      expect(
        describeAuthError(StateError('no signed-in user')),
        'Something went wrong. Please try again.',
      );
    });

    test('maps invalid_credentials', () {
      expect(
        describeAuthError(_apiError(401, {'error': 'invalid_credentials'})),
        'Incorrect email or password.',
      );
    });

    test('maps account_suspended', () {
      expect(
        describeAuthError(_apiError(403, {'error': 'account_suspended'})),
        'This account has been disabled. Contact support.',
      );
    });

    test('maps email_already_exists', () {
      expect(
        describeAuthError(_apiError(409, {'error': 'email_already_exists'})),
        'An account already exists for that email.',
      );
    });

    test('maps weak_password', () {
      expect(
        describeAuthError(_apiError(400, {'error': 'weak_password'})),
        'Choose a stronger password (at least 8 characters).',
      );
    });

    test('maps invalid_request', () {
      expect(
        describeAuthError(_apiError(400, {'error': 'invalid_request'})),
        'Enter a valid email address.',
      );
    });

    test('maps the MIGRATION_RESET_REQUIRED code regardless of error string', () {
      expect(
        describeAuthError(
          _apiError(409, {
            'error': 'password_reset_required',
            'code': 'MIGRATION_RESET_REQUIRED',
          }),
        ),
        "We've upgraded our login system for extra security. Check your email for a link to set a new password.",
      );
    });

    test('maps HTTP 429 to a rate-limit message regardless of body', () {
      expect(
        describeAuthError(_apiError(429, null)),
        'Too many attempts. Try again in a few minutes.',
      );
    });

    test('maps a connection error to a network message', () {
      final error = DioException(
        requestOptions: _requestOptions,
        type: DioExceptionType.connectionError,
      );
      expect(
        describeAuthError(error),
        'No internet connection. Check your network and try again.',
      );
    });

    test('falls back to the generic message for an unrecognised code', () {
      expect(
        describeAuthError(_apiError(400, {'error': 'some_unmapped_code'})),
        'Something went wrong. Please try again.',
      );
    });
  });
}
