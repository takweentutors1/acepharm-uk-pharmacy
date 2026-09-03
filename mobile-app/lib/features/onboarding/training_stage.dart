/// Mirrors the `stage` enum on `user_profiles` in
/// `web-app/apps/api/src/db/schema.ts`.
enum TrainingStage {
  year2,
  year3,
  year4,
  foundation,
  oriel,
  ip;

  String get apiValue => switch (this) {
    TrainingStage.year2 => 'year_2',
    TrainingStage.year3 => 'year_3',
    TrainingStage.year4 => 'year_4',
    TrainingStage.foundation => 'foundation_trainee',
    TrainingStage.oriel => 'oriel',
    TrainingStage.ip => 'ip',
  };

  String get label => switch (this) {
    TrainingStage.year2 => 'MPharm Year 2',
    TrainingStage.year3 => 'MPharm Year 3',
    TrainingStage.year4 => 'MPharm Year 4',
    TrainingStage.foundation => 'Foundation Trainee',
    TrainingStage.oriel => 'Oriel',
    TrainingStage.ip => 'Independent Prescribing (IP)',
  };

  String get description => switch (this) {
    TrainingStage.year2 => 'Second year of the MPharm degree',
    TrainingStage.year3 => 'Third year of the MPharm degree',
    TrainingStage.year4 => 'Final year of the MPharm degree',
    TrainingStage.foundation => 'Pre-registration foundation trainee',
    TrainingStage.oriel => 'Applying to or matched through Oriel',
    TrainingStage.ip => 'Independent prescribing qualification',
  };
}
