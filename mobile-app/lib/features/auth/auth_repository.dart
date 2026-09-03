import 'package:firebase_auth/firebase_auth.dart';

/// Thin wrapper around [FirebaseAuth] — the app's single source of
/// identity. The API never trusts this client directly: every request's
/// ID token is re-verified server-side against Google's JWKS endpoint
/// (see `web-app/apps/api/src/middleware/auth.ts`).
class AuthRepository {
  AuthRepository({FirebaseAuth? firebaseAuth})
    : _injectedFirebaseAuth = firebaseAuth;

  final FirebaseAuth? _injectedFirebaseAuth;

  /// Resolved lazily, not in the constructor — [FirebaseAuth.instance]
  /// requires `Firebase.initializeApp` to have run, which plain widget
  /// tests don't do. Subclasses that override every method touching this
  /// (see fakes in `test/features/account/`) never trigger the lookup.
  FirebaseAuth get _firebaseAuth => _injectedFirebaseAuth ?? FirebaseAuth.instance;

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

  /// Re-proves the user's identity with their password. Firebase requires
  /// a recent sign-in before allowing [deleteAccount] — this is that
  /// security check, surfaced explicitly rather than caught as a
  /// `requires-recent-login` error after the fact.
  Future<void> reauthenticateWithPassword(String password) async {
    final user = currentUser;
    final email = user?.email;
    if (user == null || email == null) {
      throw StateError('No signed-in email/password user to reauthenticate.');
    }
    final credential = EmailAuthProvider.credential(
      email: email,
      password: password,
    );
    await user.reauthenticateWithCredential(credential);
  }

  /// Permanently deletes the Firebase Auth identity. Call only after the
  /// backend's `DELETE /api/v1/user/account` has succeeded — this is what
  /// ends the local session, matching every other Firebase Auth user
  /// (`authStateChanges` emits `null` and the app falls back to the
  /// login screen automatically).
  Future<void> deleteAccount() async {
    final user = currentUser;
    if (user == null) return;
    await user.delete();
  }

  /// The Bearer credential the API's JWKS middleware verifies. Pass
  /// [forceRefresh] to bypass the SDK's cached token, e.g. after a 401.
  Future<String?> getIdToken({bool forceRefresh = false}) {
    final user = currentUser;
    if (user == null) return Future.value(null);
    return user.getIdToken(forceRefresh);
  }
}
