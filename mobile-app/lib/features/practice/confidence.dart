/// Pre-submission confidence rating. Product invariant #2: this must be
/// captured before an answer can be submitted (unless disabled in
/// settings — no such setting exists yet, so it's always required).
enum Confidence {
  low,
  medium,
  high;

  String get apiValue => switch (this) {
    Confidence.low => 'low',
    Confidence.medium => 'medium',
    Confidence.high => 'high',
  };

  String get label => switch (this) {
    Confidence.low => 'Low',
    Confidence.medium => 'Medium',
    Confidence.high => 'High',
  };
}
