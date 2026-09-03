import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/curriculum/category.dart';
import '../../core/curriculum/curriculum_repository.dart';
import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/widgets/widgets.dart';
import 'practice_session.dart';
import 'session_builder_query.dart';
import 'session_mode.dart';
import 'session_repository.dart';

/// Mode selection (Learn vs Timed Exam) and curriculum category filter for
/// starting a new practice session, across all GPhC domains returned by
/// [CurriculumRepository]. Live-estimates the matching question count as
/// the selection changes and only enables "Start session" once at least
/// one domain is selected and questions are actually available.
class SessionBuilderScreen extends StatefulWidget {
  const SessionBuilderScreen({
    super.key,
    required this.curriculumRepository,
    required this.sessionRepository,
    this.onSessionCreated,
  });

  final CurriculumRepository curriculumRepository;
  final SessionRepository sessionRepository;
  final ValueChanged<PracticeSession>? onSessionCreated;

  @override
  State<SessionBuilderScreen> createState() => _SessionBuilderScreenState();
}

class _SessionBuilderScreenState extends State<SessionBuilderScreen> {
  late final Future<List<Category>> _categoriesFuture = widget
      .curriculumRepository
      .fetchCategories();

  SessionMode _mode = SessionMode.learn;
  bool _hasInitializedSelection = false;
  Set<String> _allCategoryIds = {};
  Set<String> _selectedCategoryIds = {};

  Timer? _debounce;
  int? _availableCount;
  bool _isEstimating = false;
  bool _isCreating = false;
  String? _createError;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _initSelectionOnce(List<Category> categories) {
    // Guards on a flag, not `_allCategoryIds.isNotEmpty` — an empty
    // curriculum (0 categories) is a valid state that must still only
    // initialise once, or this reruns and reschedules every build.
    if (_hasInitializedSelection) return;
    _hasInitializedSelection = true;
    _allCategoryIds = categories.map((c) => c.id).toSet();
    _selectedCategoryIds = Set.of(_allCategoryIds);
    // Called from within FutureBuilder's builder (i.e. during build).
    // _scheduleEstimate can setState synchronously (empty-selection
    // branch), which build() forbids — defer to just after this frame.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _scheduleEstimate();
    });
  }

  bool get _isAllSelected =>
      _allCategoryIds.isNotEmpty &&
      _selectedCategoryIds.length == _allCategoryIds.length;

  void _toggleCategory(String id) {
    setState(() {
      if (_selectedCategoryIds.contains(id)) {
        _selectedCategoryIds.remove(id);
      } else {
        _selectedCategoryIds.add(id);
      }
    });
    _scheduleEstimate();
  }

  void _toggleSelectAll() {
    setState(() {
      _selectedCategoryIds = _isAllSelected ? {} : Set.of(_allCategoryIds);
    });
    _scheduleEstimate();
  }

  void _setMode(SessionMode mode) {
    if (_mode == mode) return;
    setState(() => _mode = mode);
    _scheduleEstimate();
  }

  SessionBuilderQuery _buildQuery() {
    final filteredIds = _isAllSelected
        ? const <String>[]
        : _selectedCategoryIds.toList();
    return SessionBuilderQuery(mode: _mode, categoryIds: filteredIds);
  }

  void _scheduleEstimate() {
    _debounce?.cancel();
    if (_selectedCategoryIds.isEmpty) {
      // null (not 0) so the footer shows "Select at least one domain to
      // continue." instead of "0 questions available".
      setState(() => _availableCount = null);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 400), _runEstimate);
  }

  Future<void> _runEstimate() async {
    setState(() => _isEstimating = true);
    try {
      final count = await widget.sessionRepository.estimateAvailableCount(
        _buildQuery(),
      );
      if (!mounted) return;
      setState(() => _availableCount = count);
    } catch (_) {
      if (!mounted) return;
      setState(() => _availableCount = null);
    } finally {
      if (mounted) setState(() => _isEstimating = false);
    }
  }

  Future<void> _startSession() async {
    setState(() {
      _isCreating = true;
      _createError = null;
    });
    try {
      final session = await widget.sessionRepository.create(_buildQuery());
      if (!mounted) return;
      widget.onSessionCreated?.call(session);
    } catch (_) {
      if (!mounted) return;
      setState(() => _createError = "Couldn't start the session. Try again.");
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Build a session')),
      body: FutureBuilder<List<Category>>(
        future: _categoriesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(AceSpacing.xl),
                child: Text(
                  "Couldn't load the curriculum. Try again shortly.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AceColors.dangerRose),
                ),
              ),
            );
          }

          final categories = snapshot.data!;
          _initSelectionOnce(categories);

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(AceSpacing.lg),
                  children: [
                    Text('Mode', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: AceSpacing.sm),
                    _ModeCard(
                      title: 'Learn Mode',
                      description:
                          'Untimed. See the full multi-stage rationale '
                          'immediately after each answer.',
                      icon: Icons.school_outlined,
                      selected: _mode == SessionMode.learn,
                      onTap: () => _setMode(SessionMode.learn),
                    ),
                    const SizedBox(height: AceSpacing.sm),
                    _ModeCard(
                      title: 'Timed Exam Mode',
                      description:
                          'A Pearson VUE-style simulated countdown. '
                          'Rationales are held back until you submit.',
                      icon: Icons.timer_outlined,
                      selected: _mode == SessionMode.timed,
                      onTap: () => _setMode(SessionMode.timed),
                    ),
                    const SizedBox(height: AceSpacing.xl),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Curriculum (${_selectedCategoryIds.length}/'
                            '${categories.length} domains)',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                        ),
                        TextButton(
                          onPressed: _toggleSelectAll,
                          child: Text(
                            _isAllSelected ? 'Clear all' : 'Select all',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AceSpacing.sm),
                    ...categories.map(
                      (category) => Padding(
                        padding: const EdgeInsets.only(bottom: AceSpacing.sm),
                        child: _CategoryTile(
                          category: category,
                          selected: _selectedCategoryIds.contains(category.id),
                          onTap: () => _toggleCategory(category.id),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              _BuilderFooter(
                availableCount: _availableCount,
                isEstimating: _isEstimating,
                isCreating: _isCreating,
                errorText: _createError,
                canStart:
                    _selectedCategoryIds.isNotEmpty &&
                    (_availableCount ?? 0) > 0,
                onStart: _startSession,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AceCard(
      selected: selected,
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: selected ? AceColors.aceIndigo : AceColors.slate),
          const SizedBox(width: AceSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AceColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: const TextStyle(fontSize: 13, color: AceColors.slate),
                ),
              ],
            ),
          ),
          Icon(
            selected ? Icons.check_circle : Icons.circle_outlined,
            size: 20,
            color: selected ? AceColors.aceIndigo : AceColors.border,
          ),
        ],
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.category,
    required this.selected,
    required this.onTap,
  });

  final Category category;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AceCard(
      selected: selected,
      onTap: onTap,
      padding: const EdgeInsets.symmetric(
        horizontal: AceSpacing.lg,
        vertical: AceSpacing.md,
      ),
      child: Row(
        children: [
          Icon(
            selected ? Icons.check_circle : Icons.circle_outlined,
            size: 18,
            color: selected ? AceColors.aceIndigo : AceColors.border,
          ),
          const SizedBox(width: AceSpacing.sm),
          Expanded(
            child: Text(
              category.name,
              style: const TextStyle(color: AceColors.ink),
            ),
          ),
        ],
      ),
    );
  }
}

class _BuilderFooter extends StatelessWidget {
  const _BuilderFooter({
    required this.availableCount,
    required this.isEstimating,
    required this.isCreating,
    required this.errorText,
    required this.canStart,
    required this.onStart,
  });

  final int? availableCount;
  final bool isEstimating;
  final bool isCreating;
  final String? errorText;
  final bool canStart;
  final VoidCallback onStart;

  String get _statusText {
    if (isEstimating) return 'Checking available questions…';
    if (availableCount == null) {
      return 'Select at least one domain to continue.';
    }
    final count = availableCount!;
    return '$count question${count == 1 ? '' : 's'} available';
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(AceSpacing.lg),
        decoration: const BoxDecoration(
          color: AceColors.surface,
          border: Border(top: BorderSide(color: AceColors.border)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (errorText != null) ...[
              Text(
                errorText!,
                style: const TextStyle(
                  color: AceColors.dangerRose,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: AceSpacing.sm),
            ],
            Text(
              _statusText,
              style: const TextStyle(color: AceColors.slate, fontSize: 13),
            ),
            const SizedBox(height: AceSpacing.sm),
            AceButton(
              label: 'Start session',
              isLoading: isCreating,
              onPressed: canStart ? onStart : null,
            ),
          ],
        ),
      ),
    );
  }
}
