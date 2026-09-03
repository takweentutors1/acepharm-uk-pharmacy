import 'package:flutter/material.dart';

import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../auth/auth_repository.dart';
import 'account_repository.dart';
import 'delete_account_flow.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({
    super.key,
    required this.authRepository,
    required this.accountRepository,
  });

  final AuthRepository authRepository;
  final AccountRepository accountRepository;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: AceSpacing.md),
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(
              AceSpacing.lg,
              AceSpacing.md,
              AceSpacing.lg,
              AceSpacing.sm,
            ),
            child: Text(
              'ACCOUNT',
              style: TextStyle(
                color: AceColors.slateLight,
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
              ),
            ),
          ),
          ListTile(
            leading: const Icon(
              Icons.delete_outline,
              color: AceColors.dangerRose,
            ),
            title: const Text(
              'Delete account',
              style: TextStyle(color: AceColors.dangerRose),
            ),
            subtitle: const Text('Permanently erase your account and data'),
            onTap: () => startAccountDeletion(
              context,
              authRepository: authRepository,
              accountRepository: accountRepository,
            ),
          ),
        ],
      ),
    );
  }
}
