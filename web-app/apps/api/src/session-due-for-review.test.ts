import { describe, it, expect } from 'vitest';
import { fetchFilteredQuestions, type SessionBuilderQuery } from './routes/sessions';
import { questions, questionAttempts } from './db/schema';

function mockDbFor(rowsByTable: Map<any, any[]>) {
  return {
    select: () => ({
      from: (table: any) => ({
        where: async () => rowsByTable.get(table) ?? [],
      }),
    }),
  } as any;
}

const publishedQuestions = [
  { id: 'q-1', subtopicId: 'sub-1' },
  { id: 'q-2', subtopicId: 'sub-1' },
  { id: 'q-3', subtopicId: 'sub-1' },
];

const baseFilters: SessionBuilderQuery = {
  mode: 'learn',
  questionCount: 10,
};

describe('fetchFilteredQuestions — due_for_review session builder filter (Milestone 6)', () => {
  it('returns only questions whose most recent attempt has lapsed', async () => {
    const now = Date.now();
    const attempts = [
      // q-1: lapsed — should be included.
      { questionId: 'q-1', answeredAt: new Date(now - 5 * 86400000), dueForReviewAt: new Date(now - 1000) },
      // q-2: still fresh — excluded.
      { questionId: 'q-2', answeredAt: new Date(now - 1 * 86400000), dueForReviewAt: new Date(now + 10 * 86400000) },
      // q-3: never attempted at all — excluded (nothing to review yet).
    ];
    const db = mockDbFor(
      new Map<any, any[]>([
        [questions, publishedQuestions],
        [questionAttempts, attempts],
      ])
    );

    const result = await fetchFilteredQuestions(db, 'user-1', {
      ...baseFilters,
      statusFilter: 'due_for_review',
    });

    expect(result).toEqual(['q-1']);
  });

  it('only counts the most recent attempt per question, not stale earlier ones', async () => {
    const now = Date.now();
    const attempts = [
      // Older attempt on q-1 lapsed, but it was superseded by a fresh retry.
      { questionId: 'q-1', answeredAt: new Date(now - 30 * 86400000), dueForReviewAt: new Date(now - 20 * 86400000) },
      { questionId: 'q-1', answeredAt: new Date(now - 1 * 86400000), dueForReviewAt: new Date(now + 20 * 86400000) },
    ];
    const db = mockDbFor(
      new Map<any, any[]>([
        [questions, publishedQuestions],
        [questionAttempts, attempts],
      ])
    );

    const result = await fetchFilteredQuestions(db, 'user-1', {
      ...baseFilters,
      statusFilter: 'due_for_review',
    });

    expect(result).toEqual([]);
  });

  it('returns every published question when no status filter is set', async () => {
    const db = mockDbFor(new Map<any, any[]>([[questions, publishedQuestions]]));

    const result = await fetchFilteredQuestions(db, 'user-1', baseFilters);

    expect(result).toEqual(['q-1', 'q-2', 'q-3']);
  });
});
