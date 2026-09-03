import 'package:flutter/material.dart';

import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/widgets/widgets.dart';
import 'auth_error.dart';
import 'auth_repository.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, this.authRepository});

  final AuthRepository? authRepository;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  late final AuthRepository _authRepository =
      widget.authRepository ?? AuthRepository();
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();

  bool _isSubmitting = false;
  bool _emailSent = false;
  String? _errorText;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _errorText = null;
    });
    try {
      await _authRepository.sendPasswordResetEmail(
        _emailController.text.trim(),
      );
      if (mounted) setState(() => _emailSent = true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _errorText = describeAuthError(error));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AceSpacing.xl),
          child: _emailSent ? _buildConfirmation() : _buildForm(),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            "Enter the email on your account and we'll send you a link to "
            'reset your password.',
            style: TextStyle(color: AceColors.slate),
          ),
          const SizedBox(height: AceSpacing.xxl),
          AceInput(
            label: 'Email',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            prefixIcon: Icons.mail_outline,
            validator: (value) => (value == null || !value.contains('@'))
                ? 'Enter a valid email address'
                : null,
          ),
          if (_errorText != null) ...[
            const SizedBox(height: AceSpacing.xs),
            Text(
              _errorText!,
              style: const TextStyle(color: AceColors.dangerRose, fontSize: 13),
            ),
          ],
          const SizedBox(height: AceSpacing.lg),
          AceButton(
            label: 'Send reset link',
            isLoading: _isSubmitting,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmation() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const AceBadge(
          label: 'Reset link sent',
          variant: AceBadgeVariant.success,
        ),
        const SizedBox(height: AceSpacing.md),
        Text(
          'Check ${_emailController.text.trim()} for a link to reset your '
          'password.',
          style: const TextStyle(color: AceColors.slate),
        ),
        const SizedBox(height: AceSpacing.lg),
        AceButton(
          label: 'Back to login',
          variant: AceButtonVariant.secondary,
          onPressed: () => Navigator.of(context).pop(),
        ),
      ],
    );
  }
}
