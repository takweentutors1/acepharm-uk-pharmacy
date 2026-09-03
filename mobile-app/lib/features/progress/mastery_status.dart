/// The 19-topic mastery grid's 6 status labels, in progression order:
/// Not started → First pass → Needs attention → Developing → Secure →
/// Due for review. Mirrors the `statusLabel` union in
/// `web-app/apps/api/src/lib/progress-calculator.ts`.
///
/// Note: 'Due for review' is defined server-side but never actually
/// assigned yet — the spaced-repetition write path (`dueForReviewAt`)
/// that would populate it doesn't exist. Handled here regardless so the
/// UI is correct the moment that lands.
enum MasteryStatus {
  notStarted,
  firstPass,
  needsAttention,
  developing,
  secure,
  dueForReview;

  static MasteryStatus fromLabel(String? label) => switch (label) {
    'First pass' => MasteryStatus.firstPass,
    'Needs attention' => MasteryStatus.needsAttention,
    'Developing' => MasteryStatus.developing,
    'Secure' => MasteryStatus.secure,
    'Due for review' => MasteryStatus.dueForReview,
    _ => MasteryStatus.notStarted,
  };

  String get label => switch (this) {
    MasteryStatus.notStarted => 'Not started',
    MasteryStatus.firstPass => 'First pass',
    MasteryStatus.needsAttention => 'Needs attention',
    MasteryStatus.developing => 'Developing',
    MasteryStatus.secure => 'Secure',
    MasteryStatus.dueForReview => 'Due for review',
  };
}
