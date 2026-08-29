import { describe, it, expect } from 'vitest';
import { generateSevenDayRevisionPlan } from './lib/revision-planner';
import { diagnoseCalculationWorking } from './lib/calculation-coach';

describe('Revision Planner & Calculation Coach (Section 5.2)', () => {
  it('generates a 7-day plan with mandatory rest day and spaced review day', async () => {
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
          innerJoin: () => ({
            where: async () => [],
          }),
          then: (fn: any) => fn([
            { id: 'sub-1', name: 'Hypertension', categoryId: 'cat-1' },
            { id: 'sub-2', name: 'Heart Failure', categoryId: 'cat-1' },
            { id: 'sub-3', name: 'Asthma', categoryId: 'cat-2' },
          ]),
        }),
      }),
      update: () => ({
        set: () => ({
          where: async () => {},
        }),
      }),
      insert: () => ({
        values: async () => {},
      }),
    };

    const plan = await generateSevenDayRevisionPlan(mockDb, 'user-123');
    expect(plan).toBeDefined();
    expect(plan.days.length).toBe(7);
    
    const restDays = plan.days.filter((d) => d.dayType === 'rest');
    const spacedReviewDays = plan.days.filter((d) => d.dayType === 'spaced_review');
    
    expect(restDays.length).toBeGreaterThanOrEqual(1);
    expect(spacedReviewDays.length).toBeGreaterThanOrEqual(1);
    expect(plan.summary.restDays).toBe(1);
    expect(plan.summary.spacedReviewDays).toBe(1);
  });

  it('Calculation Coach diagnoses correct numeric working', async () => {
    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                stem: 'Calculate the total daily dose of amoxicillin for a 15 kg child at 30 mg/kg/day.',
                numericAnswer: '450',
                numericTolerance: '0.01',
                numericUnit: 'mg',
                calculationWorking: 'Step 1: 15 kg * 30 mg/kg = 450 mg.',
              },
            ],
          }),
        }),
      }),
    };

    const diag = await diagnoseCalculationWorking(
      mockDb,
      'calc-q-1',
      '15 * 30 = 450 mg',
      450
    );

    expect(diag).toBeDefined();
    expect(diag.isCorrect).toBe(true);
    expect(diag.alternativeMethodsAccepted).toBe(true);
  });
});
