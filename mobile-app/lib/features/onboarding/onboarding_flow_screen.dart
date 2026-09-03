import 'package:flutter/material.dart';

import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/widgets/widgets.dart';
import 'onboarding_repository.dart';
import 'training_stage.dart';
import 'widgets/daily_goal_step.dart';
import 'widgets/exam_date_step.dart';
import 'widgets/goal_step.dart';
import 'widgets/stage_step.dart';
import 'widgets/university_step.dart';

/// The 5-step onboarding wizard: training stage, primary revision
/// target, exam date, daily question goal, and university affiliation.
/// Submits everything in one call to `PUT /api/v1/user/onboarding` on
/// the final step.
class OnboardingFlowScreen extends StatefulWidget {
  const OnboardingFlowScreen({
    super.key,
    required this.onboardingRepository,
    required this.onComplete,
  });

  final OnboardingRepository onboardingRepository;
  final VoidCallback onComplete;

  @override
  State<OnboardingFlowScreen> createState() => _OnboardingFlowScreenState();
}

class _OnboardingFlowScreenState extends State<OnboardingFlowScreen> {
  static const _totalSteps = 5;

  final _pageController = PageController();
  final _customGoalController = TextEditingController();

  int _step = 0;
  TrainingStage? _stage;
  String? _primaryGoal;
  DateTime? _assessmentDate;
  int _dailyQuestionTarget = 20;
  String? _universityId;

  bool _isSubmitting = false;
  String? _submitError;

  @override
  void dispose() {
    _pageController.dispose();
    _customGoalController.dispose();
    super.dispose();
  }

  bool get _canContinue => switch (_step) {
    0 => _stage != null,
    1 =>
      _primaryGoal != null &&
          (_primaryGoal != 'Other' ||
              _customGoalController.text.trim().isNotEmpty),
    _ => true, // exam date, daily goal, and university are all optional
  };

  void _goToStep(int step) {
    setState(() => _step = step);
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  void _next() {
    if (!_canContinue) return;
    if (_step == _totalSteps - 1) {
      _submit();
      return;
    }
    _goToStep(_step + 1);
  }

  void _back() {
    if (_step == 0) return;
    _goToStep(_step - 1);
  }

  Future<void> _submit() async {
    setState(() {
      _isSubmitting = true;
      _submitError = null;
    });
    final goal = _primaryGoal == 'Other'
        ? _customGoalController.text.trim()
        : _primaryGoal!;
    try {
      await widget.onboardingRepository.submit(
        stage: _stage!,
        primaryGoal: goal,
        assessmentDate: _assessmentDate,
        dailyQuestionTarget: _dailyQuestionTarget,
        universityId: _universityId,
      );
      widget.onComplete();
    } catch (_) {
      if (!mounted) return;
      setState(() => _submitError = "Couldn't save your answers. Try again.");
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: _step == 0
            ? null
            : IconButton(icon: const Icon(Icons.arrow_back), onPressed: _back),
        title: Text('Step ${_step + 1} of $_totalSteps'),
      ),
      body: Column(
        children: [
          LinearProgressIndicator(value: (_step + 1) / _totalSteps),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                StageStep(
                  value: _stage,
                  onChanged: (s) => setState(() => _stage = s),
                ),
                GoalStep(
                  value: _primaryGoal,
                  customController: _customGoalController,
                  onChanged: (g) => setState(() => _primaryGoal = g),
                ),
                ExamDateStep(
                  value: _assessmentDate,
                  onChanged: (d) => setState(() => _assessmentDate = d),
                ),
                DailyGoalStep(
                  value: _dailyQuestionTarget,
                  onChanged: (v) => setState(() => _dailyQuestionTarget = v),
                ),
                UniversityStep(
                  repository: widget.onboardingRepository,
                  value: _universityId,
                  onChanged: (id) => setState(() => _universityId = id),
                ),
              ],
            ),
          ),
          if (_submitError != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AceSpacing.lg,
                0,
                AceSpacing.lg,
                AceSpacing.sm,
              ),
              child: Text(
                _submitError!,
                style: const TextStyle(
                  color: AceColors.dangerRose,
                  fontSize: 13,
                ),
              ),
            ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(AceSpacing.lg),
              child: AceButton(
                label: _step == _totalSteps - 1 ? 'Finish' : 'Continue',
                isLoading: _isSubmitting,
                onPressed: _canContinue ? _next : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
