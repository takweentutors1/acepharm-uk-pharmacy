import 'package:dio/dio.dart';

/// Maps a raw error from the custom-auth API to copy that's safe to show
/// the user. The API returns `{ "error": "<code>" }` JSON bodies (see
/// `web-app/apps/api/src/routes/auth.ts`).
String describeAuthError(Object error) {
  if (error is StateError) {
    return 'Something went wrong. Please try again.';
  }

  if (error is! DioException) {
    return 'Something went wrong. Please try again.';
  }

  if (error.type == DioExceptionType.connectionError ||
      error.type == DioExceptionType.connectionTimeout) {
    return 'No internet connection. Check your network and try again.';
  }

  if (error.response?.statusCode == 429) {
    return 'Too many attempts. Try again in a few minutes.';
  }

  final data = error.response?.data;
  final code = data is Map ? data['error'] as String? : null;
  final migrationCode = data is Map ? data['code'] as String? : null;

  if (migrationCode == 'MIGRATION_RESET_REQUIRED') {
    return "We've upgraded our login system for extra security. Check your email for a link to set a new password.";
  }

  switch (code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'account_suspended':
      return 'This account has been disabled. Contact support.';
    case 'email_already_exists':
      return 'An account already exists for that email.';
    case 'weak_password':
      return 'Choose a stronger password (at least 8 characters).';
    case 'invalid_request':
      return 'Enter a valid email address.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
