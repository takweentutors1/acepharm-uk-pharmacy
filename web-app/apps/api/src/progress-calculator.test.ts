import { describe, it, expect } from 'vitest';
import { calculateDueForReviewAt, calculateProgressMetrics } from './lib/progress-calculator';
import { categories, subtopics, questions, questionFirstAttempts, questionAttempts } from './db/schema';

const DAY_MS = 24 * 60 * 60 * 1000;

function mockDbFor(rowsByTable: Map<any, any[]>) {
  return {
    select: () => ({
      from: (table: any) => ({
        where: async () => rowsByTable.get(table) ?? [],
        orderBy: async () => rowsByTable.get(table) ?? [],
      }),
    }),
  } as any;
}

describe('calculateDueForReviewAt (Milestone 6: Due for review scheduling)', () => {
  const answeredAt = new Date('2026-01-01T00:00:00.000Z');

  it('schedules an incorrect answer for review the next day', () => {
    const due = calculateDueForReviewAt(false, null, answeredAt);
    expect(due.getTime() - answeredAt.getTime()).toBe(1 * DAY_MS);
  });

  it('schedules a correct low-confidence answer 3 days out', () => {
    const due = calculateDueForReviewAt(true, 'low', answeredAt);
    expect(due.getTime() - answeredAt.getTime()).toBe(3 * DAY_MS);
  });

  it('schedules a correct medium-confidence answer 7 days out', () => {
    const due = calculateDueForReviewAt(true, 'medium', answeredAt);
    expect(due.getTime() - answeredAt.getTime()).toBe(7 * DAY_MS);
  });

  it('schedules a correct high-confidence answer 21 days out (longest interval)', () => {
    const due = calculateDueForReviewAt(true, 'high', answeredAt);
    expect(due.getTime() - answeredAt.getTime()).toBe(21 * DAY_MS);
  });

  it('treats a missing confidence rating as low confidence', () => {
    const due = calculateDueForReviewAt(true, null, answeredAt);
    expect(due.getTime() - answeredAt.getTime()).toBe(3 * DAY_MS);
  });
});

describe('calculateProgressMetrics — "Due for review" mastery status (Milestone 6)', () => {
  const cat = { id: 'cat-1', name: 'Cardiovascular Therapeutics', sortOrder: 1 };
  const sub = { id: 'sub-1', categoryId: 'cat-1', name: 'Hypertension', sortOrder: 1 };
  const q1 = { id: 'q-1', subtopicId: 'sub-1' };
  const q2 = { id: 'q-2', subtopicId: 'sub-1' };

  const firstAttempts = [
    { questionId: 'q-1', isCorrect: true },
    { questionId: 'q-2', isCorrect: true },
  ];

  function buildDb(attempts: any[]) {
    return mockDbFor(
      new Map<any, any[]>([
        [questionFirstAttempts, firstAttempts],
        [questionAttempts, attempts],
        [categories, [cat]],
        [subtopics, [sub]],
        [questions, [q1, q2]],
      ])
    );
  }

  it('stays Secure when full coverage, high accuracy, and the latest attempt is still fresh', async () => {
    const future = new Date(Date.now() + 10 * DAY_MS);
    const db = buildDb([
      { questionId: 'q-1', answeredAt: new Date(Date.now() - 5 * DAY_MS), dueForReviewAt: future },
      { questionId: 'q-2', answeredAt: new Date(), dueForReviewAt: future },
    ]);

    const metrics = await calculateProgressMetrics(db, 'user-1');
    const subtopicResult = metrics.coverageMap[0].subtopics[0];

    expect(subtopicResult.statusLabel).toBe('Secure');
    expect(metrics.coverageMap[0].statusLabel).toBe('Secure');
  });

  it('lapses into Due for review once the most recent attempt\'s freshness window has passed', async () => {
    const db = buildDb([
      // Older attempt — irrelevant, superseded by the one below.
      { questionId: 'q-1', answeredAt: new Date(Date.now() - 30 * DAY_MS), dueForReviewAt: new Date(Date.now() + 100 * DAY_MS) },
      // Most recent attempt on the subtopic — its window already passed.
      { questionId: 'q-2', answeredAt: new Date(Date.now() - 1 * DAY_MS), dueForReviewAt: new Date(Date.now() - 1000) },
    ]);

    const metrics = await calculateProgressMetrics(db, 'user-1');
    const subtopicResult = metrics.coverageMap[0].subtopics[0];

    expect(subtopicResult.statusLabel).toBe('Due for review');
    // The category status escalates too — it's only as fresh as its subtopics.
    expect(metrics.coverageMap[0].statusLabel).toBe('Due for review');
  });

  it('never marks a subtopic Due for review before it has reached Secure', async () => {
    const partialFirstAttempts = [{ questionId: 'q-1', isCorrect: true }];
    const db = mockDbFor(
      new Map<any, any[]>([
        [questionFirstAttempts, partialFirstAttempts],
        [
          questionAttempts,
          [{ questionId: 'q-1', answeredAt: new Date(Date.now() - 1 * DAY_MS), dueForReviewAt: new Date(Date.now() - 1000) }],
        ],
        [categories, [cat]],
        [subtopics, [sub]],
        [questions, [q1, q2]],
      ])
    );

    const metrics = await calculateProgressMetrics(db, 'user-1');
    const subtopicResult = metrics.coverageMap[0].subtopics[0];

    // Only 1/2 questions attempted — coverage isn't 100%, so it can't be
    // Secure yet, regardless of how stale that one attempt is.
    expect(subtopicResult.statusLabel).not.toBe('Due for review');
  });
});
