import { describe, it, expect } from 'vitest';
import { calculateLearnerWeeklyData, generateSingleWeeklyInsight } from './lib/weekly-insight-generator';

describe('Weekly Insight Generator Cron (Section 5.2 & 5.3)', () => {
  it('identifies confidently incorrect answers over 7 days', async () => {
    const mockAttempts = [
      { id: '1', isCorrect: true, confidence: 'high', questionId: 'q1', answeredAt: new Date() },
      { id: '2', isCorrect: false, confidence: 'high', questionId: 'q2', answeredAt: new Date() }, // Confidently incorrect!
      { id: '3', isCorrect: false, confidence: 'low', questionId: 'q3', answeredAt: new Date() },
    ];

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: async () => mockAttempts,
        }),
      }),
    };

    const data = await calculateLearnerWeeklyData(mockDb, 'user-123');
    expect(data).toBeDefined();
    expect(data?.totalAttempts).toBe(3);
    expect(data?.correctAttempts).toBe(1);
    expect(data?.accuracy).toBe(33);
    expect(data?.confidentlyIncorrectCount).toBe(1);
  });

  it('generates an insight that leads with confidently incorrect mistakes', async () => {
    const mockAttempts = [
      { id: '1', isCorrect: false, confidence: 'high', questionId: 'q2', answeredAt: new Date() },
    ];

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: async () => mockAttempts,
        }),
      }),
    };

    const insight = await generateSingleWeeklyInsight(mockDb, 'user-123', 'Aisha');
    expect(insight).toBeDefined();
    expect(insight?.confidentlyIncorrectCount).toBe(1);
    expect(insight?.insightParagraph).toContain('high confidence that turned out incorrect');
  });
});
