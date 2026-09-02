import { describe, it, expect } from 'vitest';
import { evaluateConsultationTranscript, RubricCriterion } from './lib/consultation-simulator';

describe('Consultation Simulator & 6-Point Rubric (Section 5.2)', () => {
  const mockRubric: RubricCriterion[] = [
    { id: 'crit-1', criterion: 'Patient Identification', maxPoints: 1, description: 'ID check' },
    { id: 'crit-2', criterion: 'Preventer vs Reliever', maxPoints: 1, description: 'Brown vs blue' },
    { id: 'crit-3', criterion: 'Inhaler Technique', maxPoints: 1, description: 'MDI steps' },
    { id: 'crit-4', criterion: 'Spacer Device', maxPoints: 1, description: 'AeroChamber' },
    { id: 'crit-5', criterion: 'Rinsing Mouth', maxPoints: 1, description: 'Prevent thrush' },
    { id: 'crit-6', criterion: 'Red Flags', maxPoints: 1, description: 'GP escalation' },
  ];

  it('evaluates a comprehensive inhaler consultation against the 6-point rubric', async () => {
    const transcript = [
      { speaker: 'pharmacist' as const, text: 'Hello David, I have your new beclometasone brown preventer and blue salbutamol reliever inhalers.' },
      { speaker: 'patient' as const, text: 'Thanks, why do I need two?' },
      { speaker: 'pharmacist' as const, text: 'The brown preventer is daily to stop inflammation, while blue is only when you have acute asthma symptoms. Use a spacer chamber for better lung delivery.' },
      { speaker: 'patient' as const, text: 'How do I take it?' },
      { speaker: 'pharmacist' as const, text: 'Shake the inhaler, take a slow deep breath, hold for 10 seconds. Always rinse your mouth with water afterwards to avoid thrush.' },
      { speaker: 'patient' as const, text: 'What if it gets worse?' },
      { speaker: 'pharmacist' as const, text: 'If you need the blue inhaler more than 3 times a week, contact your GP urgently.' },
    ];

    const evaluation = await evaluateConsultationTranscript(mockRubric, transcript);
    expect(evaluation).toBeDefined();
    expect(evaluation.score).toBeGreaterThanOrEqual(4);
    expect(evaluation.passed).toBe(true);
    expect(evaluation.criteriaResults.length).toBe(6);
  });
});
