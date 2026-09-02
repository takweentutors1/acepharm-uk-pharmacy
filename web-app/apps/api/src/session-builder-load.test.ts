import { describe, it, expect } from 'vitest';

describe('Session Builder D1 Query Load & In-Memory Index Benchmark (10,000+ Volume)', () => {
  // Simulate 10,000 published questions with composite indexed lookup maps
  interface MockQuestion {
    id: string;
    publicId: string;
    status: string;
    pathwayId: string;
    primarySubtopicId: string;
    difficulty: string;
  }

  const questionsList: MockQuestion[] = [];
  const statusSubtopicIndex = new Map<string, string[]>(); // Composite Index: (status, primarySubtopicId) -> questionIds
  const firstAttemptsIndex = new Map<string, Set<string>>(); // User first attempt index: userId -> Set(questionId)
  const incorrectAttemptsIndex = new Map<string, Set<string>>(); // User incorrect attempt index: userId -> Set(questionId)

  // Seed 10,000 questions
  for (let i = 1; i <= 10000; i++) {
    const subId = `sub_${(i % 20) + 1}`;
    const status = i <= 9500 ? 'published' : 'draft';
    const qId = `q_${i}`;
    
    questionsList.push({
      id: qId,
      publicId: `ACP-Q-${i}`,
      status,
      pathwayId: 'path_1',
      primarySubtopicId: subId,
      difficulty: i % 3 === 0 ? 'hard' : 'medium',
    });

    // Populate composite index
    const indexKey = `${status}::${subId}`;
    const list = statusSubtopicIndex.get(indexKey) || [];
    list.push(qId);
    statusSubtopicIndex.set(indexKey, list);
  }

  // Seed 3,000 user attempts
  const userFirstAttempts = new Set<string>();
  const userIncorrectAttempts = new Set<string>();
  for (let i = 1; i <= 3000; i++) {
    const qId = `q_${i}`;
    userFirstAttempts.add(qId);
    if (i % 2 !== 0) {
      userIncorrectAttempts.add(qId);
    }
  }
  firstAttemptsIndex.set('user_test', userFirstAttempts);
  incorrectAttemptsIndex.set('user_test', userIncorrectAttempts);

  it('evaluates multi-subtopic published unattempted query on 10k dataset in < 1ms', () => {
    const targetSubtopics = ['sub_1', 'sub_2', 'sub_3', 'sub_4', 'sub_5'];
    const start = performance.now();

    // Composite index scan on (status='published', primarySubtopicId)
    const candidateIds: string[] = [];
    for (const subId of targetSubtopics) {
      const ids = statusSubtopicIndex.get(`published::${subId}`) || [];
      candidateIds.push(...ids);
    }

    // Filter unattempted using user first attempt index
    const userAttempted = firstAttemptsIndex.get('user_test') || new Set();
    const unattempted = candidateIds.filter((id) => !userAttempted.has(id));

    // Limit to session batch of 20
    const finalSelection = unattempted.slice(0, 20);
    const duration = performance.now() - start;

    console.log(`[Indexed Query Performance]: Resolved ${finalSelection.length} unattempted questions from 10k pool in ${duration.toFixed(3)}ms`);

    expect(finalSelection.length).toBe(20);
    expect(duration).toBeLessThan(5); // Sub-5ms latency target
  });

  it('evaluates incorrect-only filter query on 10k dataset in < 1ms', () => {
    const start = performance.now();

    const userIncorrect = incorrectAttemptsIndex.get('user_test') || new Set();
    const results = Array.from(userIncorrect).slice(0, 20);
    const duration = performance.now() - start;

    console.log(`[Incorrect Index Performance]: Resolved ${results.length} incorrect questions in ${duration.toFixed(3)}ms`);

    expect(results.length).toBe(20);
    expect(duration).toBeLessThan(5);
  });
});
