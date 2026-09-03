/// `learn` — untimed, with the full multi-stage rationale shown
/// immediately after each answer.
/// `timed` — a Pearson VUE-style simulated countdown; rationales are held
/// back until submission, matching real exam conditions.
enum SessionMode {
  learn,
  timed;

  String get apiValue => switch (this) {
    SessionMode.learn => 'learn',
    SessionMode.timed => 'timed',
  };

  static SessionMode fromApiValue(String? value) =>
      value == 'timed' ? SessionMode.timed : SessionMode.learn;
}
