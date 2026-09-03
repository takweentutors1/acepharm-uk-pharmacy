import 'package:firebase_auth/firebase_auth.dart';

/// Maps a raw [FirebaseAuthException] to copy that's safe to show the user.
String describeAuthError(Object error) {
  if (error is! FirebaseAuthException) {
    return 'Something went wrong. Please try again.';
  }

  switch (error.code) {
    case 'invalid-email':
      return 'Enter a valid email address.';
    case 'user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'user-not-found':
    case 'invalid-credential':
    case 'wrong-password':
      return 'Incorrect email or password.';
    case 'email-already-in-use':
      return 'An account already exists for that email.';
    case 'weak-password':
      return 'Choose a stronger password.';
    case 'too-many-requests':
      return 'Too many attempts. Try again in a few minutes.';
    case 'network-request-failed':
      return 'No internet connection. Check your network and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
