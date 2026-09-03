import 'package:flutter/material.dart';

import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/widgets/widgets.dart';
import 'auth_error.dart';
import 'auth_repository.dart';
import 'widgets/password_strength_meter.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key, this.authRepository});

  final AuthRepository? authRepository;

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  late final AuthRepository _authRepository =
      widget.authRepository ?? AuthRepository();
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _isSubmitting = false;
  String? _errorText;
  String _password = '';

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isSubmitting = true;
      _errorText = null;
    });
    try {
      await _authRepository.signUpWithEmail(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
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
      appBar: AppBar(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AceSpacing.xl),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Create your account',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: AceSpacing.xs),
                const Text(
                  'Start with a free diagnostic session.',
                  style: TextStyle(color: AceColors.slate),
                ),
                const SizedBox(height: AceSpacing.xxl),
                AceInput(
                  label: 'Email',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  prefixIcon: Icons.mail_outline,
                  validator: (value) => (value == null || !value.contains('@'))
                      ? 'Enter a valid email address'
                      : null,
                ),
                const SizedBox(height: AceSpacing.md),
                AceInput(
                  label: 'Password',
                  controller: _passwordController,
                  obscureText: true,
                  textInputAction: TextInputAction.next,
                  onChanged: (value) => setState(() => _password = value),
                  validator: (value) {
                    if (value == null || value.length < 8) {
                      return 'Use at least 8 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: AceSpacing.sm),
                PasswordStrengthMeter(password: _password),
                const SizedBox(height: AceSpacing.md),
                AceInput(
                  label: 'Confirm password',
                  controller: _confirmController,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  validator: (value) => value != _passwordController.text
                      ? 'Passwords do not match'
                      : null,
                ),
                if (_errorText != null) ...[
                  const SizedBox(height: AceSpacing.xs),
                  Text(
                    _errorText!,
                    style: const TextStyle(
                      color: AceColors.dangerRose,
                      fontSize: 13,
                    ),
                  ),
                ],
                const SizedBox(height: AceSpacing.lg),
                AceButton(
                  label: 'Create account',
                  isLoading: _isSubmitting,
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
