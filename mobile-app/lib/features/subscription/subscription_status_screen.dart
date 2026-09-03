import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/widgets/widgets.dart';
import 'subscription_plan.dart';
import 'subscription_repository.dart';
import 'subscription_status.dart';

Future<bool> _defaultUrlOpener(Uri url) =>
    launchUrl(url, mode: LaunchMode.externalApplication);

/// Displays the active plan tier, renewal date, and a deep link out to
/// the Stripe-hosted web customer portal for billing management.
class SubscriptionStatusScreen extends StatefulWidget {
  const SubscriptionStatusScreen({
    super.key,
    required this.repository,
    this.urlOpener = _defaultUrlOpener,
  });

  final SubscriptionRepository repository;

  /// Injectable for tests — defaults to the real `launchUrl`.
  final Future<bool> Function(Uri url) urlOpener;

  @override
  State<SubscriptionStatusScreen> createState() =>
      _SubscriptionStatusScreenState();
}

class _SubscriptionStatusScreenState extends State<SubscriptionStatusScreen> {
  late Future<SubscriptionStatus> _future = widget.repository.fetchStatus();

  bool _isOpeningPortal = false;
  String? _portalError;

  void _retry() {
    setState(() {
      _future = widget.repository.fetchStatus();
    });
  }

  Future<void> _manageBilling() async {
    setState(() {
      _isOpeningPortal = true;
      _portalError = null;
    });
    try {
      final url = await widget.repository.createCustomerPortalSession();
      final opened = await widget.urlOpener(Uri.parse(url));
      if (!opened && mounted) {
        setState(() => _portalError = "Couldn't open the billing portal.");
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _portalError = "Couldn't open the billing portal.");
    } finally {
      if (mounted) setState(() => _isOpeningPortal = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Subscription')),
      body: FutureBuilder<SubscriptionStatus>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AceSpacing.xl),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      "Couldn't load your subscription.",
                      style: TextStyle(color: AceColors.dangerRose),
                    ),
                    const SizedBox(height: AceSpacing.sm),
                    TextButton(onPressed: _retry, child: const Text('Retry')),
                  ],
                ),
              ),
            );
          }

          final status = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(AceSpacing.lg),
            children: [
              _PlanCard(status: status),
              const SizedBox(height: AceSpacing.lg),
              if (status.isPaid) ...[
                AceButton(
                  label: 'Manage billing',
                  isLoading: _isOpeningPortal,
                  onPressed: _manageBilling,
                ),
                if (_portalError != null) ...[
                  const SizedBox(height: AceSpacing.sm),
                  Text(
                    _portalError!,
                    style: const TextStyle(
                      color: AceColors.dangerRose,
                      fontSize: 13,
                    ),
                  ),
                ],
              ] else
                const Text(
                  "You're on the free Explorer plan — upgrade to a paid "
                  'plan to manage billing here.',
                  style: TextStyle(color: AceColors.slate),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.status});

  final SubscriptionStatus status;

  static const _planMeta = {
    SubscriptionPlan.explorer: AceBadgeVariant.neutral,
    SubscriptionPlan.monthlyPro: AceBadgeVariant.info,
    SubscriptionPlan.yearlyPro: AceBadgeVariant.success,
  };

  String _formatDate(DateTime date) => '${date.day}/${date.month}/${date.year}';

  @override
  Widget build(BuildContext context) {
    final variant = _planMeta[status.plan]!;
    final periodEnd = status.currentPeriodEnd;

    return AceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AceBadge(label: status.plan.label, variant: variant),
              if (status.status != 'active') ...[
                const SizedBox(width: AceSpacing.sm),
                AceBadge(
                  label: status.status.replaceAll('_', ' '),
                  variant: AceBadgeVariant.danger,
                  icon: Icons.warning_amber_rounded,
                ),
              ],
            ],
          ),
          const SizedBox(height: AceSpacing.md),
          if (periodEnd == null)
            const Text(
              'No active billing period.',
              style: TextStyle(color: AceColors.slateLight),
            )
          else if (status.cancelAtPeriodEnd)
            Text(
              'Access until ${_formatDate(periodEnd)} — not renewing.',
              style: const TextStyle(
                color: AceColors.dangerRose,
                fontWeight: FontWeight.w600,
              ),
            )
          else
            Text(
              'Renews on ${_formatDate(periodEnd)}',
              style: const TextStyle(
                color: AceColors.ink,
                fontWeight: FontWeight.w600,
              ),
            ),
        ],
      ),
    );
  }
}
