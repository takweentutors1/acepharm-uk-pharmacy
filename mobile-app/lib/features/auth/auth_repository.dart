import 'package:firebase_auth/firebase_auth.dart';

/// Thin wrapper around [FirebaseAuth] — the app's single source of
/// identity. The API never trusts this client directly: every request's
/// ID token is re-verified server-side against Google's JWKS endpoint
/// (see `web-app/apps/api/src/middleware/auth.ts`).
class AuthRepository {
  AuthRepository({FirebaseAuth? firebaseAuth})
    : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseAuth _firebaseAuth;

  User? get currentUser => _firebaseAuth.currentUser;

  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  Future<UserCredential> signInWithEmail({
    required String email,
    required String password,
  }) {
    return _firebaseAuth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  Future<UserCredential> signUpWithEmail({
    required String email,
    required String password,
  }) {
    return _firebaseAuth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  Future<void> sendPasswordResetEmail(String email) {
    return _firebaseAuth.sendPasswordResetEmail(email: email);
  }

  Future<void> signOut() => _firebaseAuth.signOut();

  /// The Bearer credential the API's JWKS middleware verifies. Pass
  /// [forceRefresh] to bypass the SDK's cached token, e.g. after a 401.
  Future<String?> getIdToken({bool forceRefresh = false}) {
    final user = currentUser;
    if (user == null) return Future.value(null);
    return user.getIdToken(forceRefresh);
  }
}
