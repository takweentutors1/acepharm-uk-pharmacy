import 'package:flutter/material.dart';

import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/widgets/widgets.dart';
import '../auth/auth_error.dart';
import '../auth/auth_repository.dart';
import 'account_repository.dart';

/// Two-step confirmation: an information sheet detailing the permanent
/// data loss, then a re-authentication sheet that performs the deletion.
/// Ends by popping back to [context]'s caller — `_AuthGate`'s
/// `authStateChanges` stream then routes to the login screen on its own
/// once Firebase's `delete()` clears the session, so no explicit
/// navigation back to onboarding/login is needed here.
Future<void> startAccountDeletion(
  BuildContext context, {
  required AuthRepository authRepository,
  required AccountRepository accountRepository,
}) async {
  final proceeded = await AceModalSheet.show<bool>(
    context: context,
    title: 'Delete your account?',
    builder: (sheetContext) => _WarningStep(
      onCancel: () => Navigator.of(sheetContext).pop(false),
      onContinue: () => Navigator.of(sheetContext).pop(true),
    ),
  );

  if (proceeded != true || !context.mounted) return;

  await AceModalSheet.show<void>(
    context: context,
    title: 'Confirm with your password',
    builder: (sheetContext) => _ConfirmStep(
      authRepository: authRepository,
      accountRepository: accountRepository,
    ),
  );
}

class _WarningStep extends StatelessWidget {
  const _WarningStep({required this.onCancel, required this.onContinue});

  final VoidCallback onCancel;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'This permanently deletes your account and cannot be undone. '
          "You'll lose:",
          style: TextStyle(color: AceColors.slate),
        ),
        const SizedBox(height: AceSpacing.md),
        const _LossBullet('All practice history and question attempts'),
        const _LossBullet('Bookmarks and personal notes'),
        const _LossBullet('Your progress, streaks, and Ace chat history'),
        const _LossBullet('Your subscription, which will be cancelled'),
        const SizedBox(height: AceSpacing.lg),
        AceButton(
          label: 'Continue',
          variant: AceButtonVariant.destructive,
          onPressed: onContinue,
        ),
        const SizedBox(height: AceSpacing.sm),
        AceButton(
          label: 'Cancel',
          variant: AceButtonVariant.ghost,
          onPressed: onCancel,
        ),
      ],
    );
  }
}

class _LossBullet extends StatelessWidget {
  const _LossBullet(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AceSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.remove_circle_outline,
            size: 16,
            color: AceColors.dangerRose,
          ),
          const SizedBox(width: AceSpacing.sm),
          Expanded(
            child: Text(text, style: const TextStyle(color: AceColors.ink)),
          ),
        ],
      ),
    );
  }
}

class _ConfirmStep extends StatefulWidget {
  const _ConfirmStep({
    required this.authRepository,
    required this.accountRepository,
  });

  final AuthRepository authRepository;
  final AccountRepository accountRepository;

  @override
  State<_ConfirmStep> createState() => _ConfirmStepState();
}

class _ConfirmStepState extends State<_ConfirmStep> {
  final _passwordController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorText;

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final password = _passwordController.text;
    if (password.isEmpty) {
      setState(() => _errorText = 'Enter your password to confirm.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorText = null;
    });

    try {
      await widget.authRepository.reauthenticateWithPassword(password);
      await widget.accountRepository.deleteAccount();
      await widget.authRepository.deleteAccount();
      if (mounted) Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;
      setState(() => _errorText = describeAuthError(error));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'For your security, re-enter your password to permanently '
          'delete your account.',
          style: TextStyle(color: AceColors.slate),
        ),
        const SizedBox(height: AceSpacing.md),
        AceInput(
          label: 'Password',
          controller: _passwordController,
          obscureText: true,
          textInputAction: TextInputAction.done,
          errorText: _errorText,
          autofocus: true,
        ),
        const SizedBox(height: AceSpacing.lg),
        AceButton(
          label: 'Delete my account',
          variant: AceButtonVariant.destructive,
          isLoading: _isSubmitting,
          onPressed: _submit,
        ),
      ],
    );
  }
}
