import 'dart:math' as math;

enum PasswordStrength { weak, fair, strong }

/// Real-time password strength estimate. Uses Shannon entropy
/// (`length * log2(poolSize)`) over the character classes actually present
/// in the password, rather than a fixed rule list — so `correcthorsebattery`
/// scores higher than `P@55!` despite lacking symbols.
abstract final class PasswordEntropy {
  static double bitsFor(String password) {
    if (password.isEmpty) return 0;

    var poolSize = 0;
    if (password.contains(RegExp(r'[a-z]'))) poolSize += 26;
    if (password.contains(RegExp(r'[A-Z]'))) poolSize += 26;
    if (password.contains(RegExp(r'[0-9]'))) poolSize += 10;
    if (password.contains(RegExp(r'[^a-zA-Z0-9]'))) poolSize += 32;
    if (poolSize == 0) return 0;

    return password.length * (math.log(poolSize) / math.ln2);
  }

  static PasswordStrength strengthFor(String password) {
    if (password.length < 8) return PasswordStrength.weak;
    final bits = bitsFor(password);
    if (bits < 35) return PasswordStrength.weak;
    if (bits < 60) return PasswordStrength.fair;
    return PasswordStrength.strong;
  }
}
