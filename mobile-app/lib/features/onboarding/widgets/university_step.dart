import 'package:flutter/material.dart';

import '../../../core/theme/ace_colors.dart';
import '../../../core/theme/ace_spacing.dart';
import '../../../core/user/university.dart';
import '../../../core/widgets/widgets.dart';
import '../onboarding_repository.dart';

/// Step 5: university / institution affiliation. Always optional — the
/// `universities` reference table has no seed data or admin write path
/// yet, so this degrades to a clean "skip" state when the list is empty.
class UniversityStep extends StatefulWidget {
  const UniversityStep({
    super.key,
    required this.repository,
    required this.value,
    required this.onChanged,
  });

  final OnboardingRepository repository;
  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  State<UniversityStep> createState() => _UniversityStepState();
}

class _UniversityStepState extends State<UniversityStep> {
  late final Future<List<University>> _future = widget.repository
      .fetchUniversities();
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AceSpacing.lg),
      children: [
        Text(
          'Which university or institution?',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: AceSpacing.xs),
        const Text(
          "Optional — skip if you'd rather not say.",
          style: TextStyle(color: AceColors.slate),
        ),
        const SizedBox(height: AceSpacing.lg),
        FutureBuilder<List<University>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: AceSpacing.lg),
                child: Center(child: CircularProgressIndicator()),
              );
            }

            final universities = snapshot.data ?? const [];
            if (snapshot.hasError || universities.isEmpty) {
              return const Text(
                'No institutions listed yet — you can skip this step.',
                style: TextStyle(color: AceColors.slateLight),
              );
            }

            final filtered = _query.isEmpty
                ? universities
                : universities
                      .where((u) => u.name.toLowerCase().contains(_query))
                      .toList();

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AceInput(
                  label: 'Search',
                  controller: _searchController,
                  onChanged: (v) =>
                      setState(() => _query = v.trim().toLowerCase()),
                ),
                const SizedBox(height: AceSpacing.sm),
                for (final university in filtered)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AceSpacing.sm),
                    child: AceCard(
                      selected: widget.value == university.id,
                      onTap: () => widget.onChanged(university.id),
                      child: Text(
                        university.name,
                        style: const TextStyle(color: AceColors.ink),
                      ),
                    ),
                  ),
                if (filtered.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: AceSpacing.md),
                    child: Text(
                      'No matches.',
                      style: TextStyle(color: AceColors.slateLight),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}
