import 'package:flutter/material.dart';

import '../../core/user/user_profile.dart';
import '../../core/user/user_repository.dart';
import 'onboarding_flow_screen.dart';
import 'onboarding_repository.dart';

/// Sits between the auth gate and the dashboard: resolves the learner's
/// D1 profile once, and shows [OnboardingFlowScreen] first if they
/// haven't completed it yet. [builder] receives the resolved profile —
/// null only if the fetch itself failed, in which case it fails open to
/// [builder] rather than trapping the user (the dashboard degrades
/// gracefully without a profile; onboarding never overrides real content
/// on the strength of an error alone).
class OnboardingGate extends StatefulWidget {
  const OnboardingGate({
    super.key,
    required this.userRepository,
    required this.onboardingRepository,
    required this.builder,
  });

  final UserRepository userRepository;
  final OnboardingRepository onboardingRepository;
  final Widget Function(BuildContext context, UserProfile? profile) builder;

  @override
  State<OnboardingGate> createState() => _OnboardingGateState();
}

class _OnboardingGateState extends State<OnboardingGate> {
  late Future<UserProfile> _profileFuture = widget.userRepository.fetchMe();

  void _onOnboardingComplete() {
    setState(() {
      _profileFuture = widget.userRepository.fetchMe();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<UserProfile>(
      future: _profileFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final profile = snapshot.data;
        if (profile != null && !profile.hasCompletedOnboarding) {
          return OnboardingFlowScreen(
            onboardingRepository: widget.onboardingRepository,
            onComplete: _onOnboardingComplete,
          );
        }

        return widget.builder(context, profile);
      },
    );
  }
}
