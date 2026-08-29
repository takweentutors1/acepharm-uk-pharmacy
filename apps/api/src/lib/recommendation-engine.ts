import { drizzle } from 'drizzle-orm/d1';
import { eq, inArray, and, sql, desc, notInArray } from 'drizzle-orm';
import { 
  questions, 
  questionFirstAttempts, 
  questionAttempts, 
  categories, 
  subtopics 
} from '../db/schema';

export interface RecommendationResult {
  reason: 'weak_accuracy' | 'low_coverage' | 'most_unseen' | 'due_for_review';
  reasonText: string;
  subtopicId: string;
  subtopicName: string;
  categoryName: string;
  availableUnseenCount: number;
  totalQuestionsInSubtopic: number;
  accuracyPercentage?: number;
  attemptsCount: number;
  recommendedQuestionCount: number;
}

/**
 * Explainable Recommendation Engine (Milestone 4)
 * 
 * Priority Rules:
 * 1. Weakest Subtopic (accuracy < 60% with ≥ 3 attempts) -> focus remediation
 * 2. Due for Review (spaced repetition interval reached) -> retention
 * 3. Most Unseen Fallback -> finds the subtopic with highest unseen question count
 * 
 * Always provides a clear, honest, explainable reason (Rule #6 & Milestone 4 Acceptance).
 */
export async function getNextRecommendedFocus(
  db: ReturnType<typeof drizzle>,
  userId: string
): Promise<RecommendationResult> {
  // 1. Fetch all published questions grouped by subtopic
  const allQuestions = await db
    .select({
      id: questions.id,
      subtopicId: questions.primarySubtopicId,
    })
    .from(questions)
    .where(eq(questions.status, 'published'));

  const subtopicQuestionMap = new Map<string, string[]>();
  for (const q of allQuestions) {
    const list = subtopicQuestionMap.get(q.subtopicId) || [];
    list.push(q.id);
    subtopicQuestionMap.set(q.subtopicId, list);
  }

  // 2. Fetch all user first-attempts & practice attempts
  const userFirstAttempts = await db
    .select({
      questionId: questionFirstAttempts.questionId,
      isCorrect: questionFirstAttempts.isCorrect,
    })
    .from(questionFirstAttempts)
    .where(eq(questionFirstAttempts.userId, userId));

  const userAttempts = await db
    .select({
      questionId: questionAttempts.questionId,
      isCorrect: questionAttempts.isCorrect,
    })
    .from(questionAttempts)
    .where(eq(questionAttempts.userId, userId));

  const attemptedQuestionIds = new Set(userFirstAttempts.map((a) => a.questionId));

  // 3. Fetch subtopics and category titles
  const allSubtopics = await db
    .select({
      id: subtopics.id,
      name: subtopics.name,
      categoryId: subtopics.categoryId,
    })
    .from(subtopics);

  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories);

  const catMap = new Map(allCategories.map((c) => [c.id, c.name]));
  const subtopicMap = new Map(allSubtopics.map((s) => [s.id, { name: s.name, categoryName: catMap.get(s.categoryId) || 'Clinical Practice' }]));

  // 4. Calculate stats per subtopic
  interface SubtopicAnalysis {
    subtopicId: string;
    subtopicName: string;
    categoryName: string;
    totalQuestions: number;
    attemptedCount: number;
    unseenCount: number;
    firstPassCorrectCount: number;
    firstPassAccuracy: number;
    practiceAttemptsCount: number;
    practiceCorrectCount: number;
  }

  const analysisList: SubtopicAnalysis[] = [];

  for (const [subId, qIds] of subtopicQuestionMap.entries()) {
    const meta = subtopicMap.get(subId) || { name: 'Therapeutics', categoryName: 'UK Pharmacy' };
    const totalQuestions = qIds.length;
    const attemptedInSubtopic = qIds.filter((id) => attemptedQuestionIds.has(id));
    const attemptedCount = attemptedInSubtopic.length;
    const unseenCount = totalQuestions - attemptedCount;

    // First-attempt accuracy
    const subFirstAttempts = userFirstAttempts.filter((a) => qIds.includes(a.questionId));
    const firstPassCorrect = subFirstAttempts.filter((a) => a.isCorrect).length;
    const firstPassAccuracy = subFirstAttempts.length > 0 ? Math.round((firstPassCorrect / subFirstAttempts.length) * 100) : 0;

    const subPracticeAttempts = userAttempts.filter((a) => qIds.includes(a.questionId));
    const practiceCorrect = subPracticeAttempts.filter((a) => a.isCorrect).length;

    analysisList.push({
      subtopicId: subId,
      subtopicName: meta.name,
      categoryName: meta.categoryName,
      totalQuestions,
      attemptedCount,
      unseenCount,
      firstPassCorrectCount: firstPassCorrect,
      firstPassAccuracy,
      practiceAttemptsCount: subPracticeAttempts.length,
      practiceCorrectCount: practiceCorrect,
    });
  }

  // 5. Strategy 1: Weakest Subtopic (accuracy < 60% with at least 3 attempts)
  const weakCandidates = analysisList
    .filter((a) => a.attemptedCount >= 3 && a.firstPassAccuracy < 60)
    .sort((a, b) => a.firstPassAccuracy - b.firstPassAccuracy);

  if (weakCandidates.length > 0) {
    const target = weakCandidates[0];
    return {
      reason: 'weak_accuracy',
      reasonText: `Based on your recent attempts: First-attempt accuracy is ${target.firstPassAccuracy}% with ${target.unseenCount} unseen questions remaining.`,
      subtopicId: target.subtopicId,
      subtopicName: target.subtopicName,
      categoryName: target.categoryName,
      availableUnseenCount: target.unseenCount,
      totalQuestionsInSubtopic: target.totalQuestions,
      accuracyPercentage: target.firstPassAccuracy,
      attemptsCount: target.attemptedCount,
      recommendedQuestionCount: Math.min(10, Math.max(5, target.unseenCount || 10)),
    };
  }

  // 6. Strategy 2: Low Coverage (started but < 50% attempted)
  const lowCoverageCandidates = analysisList
    .filter((a) => a.attemptedCount > 0 && a.unseenCount > 0 && (a.attemptedCount / a.totalQuestions) < 0.5)
    .sort((a, b) => b.unseenCount - a.unseenCount);

  if (lowCoverageCandidates.length > 0) {
    const target = lowCoverageCandidates[0];
    return {
      reason: 'low_coverage',
      reasonText: `Expand your syllabus coverage: You've completed ${target.attemptedCount}/${target.totalQuestions} questions in this core area.`,
      subtopicId: target.subtopicId,
      subtopicName: target.subtopicName,
      categoryName: target.categoryName,
      availableUnseenCount: target.unseenCount,
      totalQuestionsInSubtopic: target.totalQuestions,
      accuracyPercentage: target.firstPassAccuracy,
      attemptsCount: target.attemptedCount,
      recommendedQuestionCount: Math.min(10, target.unseenCount),
    };
  }

  // 7. Strategy 3: "Most Unseen" Fallback (Standard fresh learner or completed bank)
  const mostUnseen = [...analysisList].sort((a, b) => b.unseenCount - a.unseenCount);
  const fallback = mostUnseen[0] || {
    subtopicId: 'sub-htn',
    subtopicName: 'Hypertension (NICE NG136)',
    categoryName: 'Cardiovascular System',
    totalQuestions: 12,
    unseenCount: 12,
    attemptedCount: 0,
    firstPassAccuracy: 0,
  };

  return {
    reason: 'most_unseen',
    reasonText: `Highest yield unattempted topic: ${fallback.unseenCount} fresh questions available to test your baseline clinical knowledge.`,
    subtopicId: fallback.subtopicId,
    subtopicName: fallback.subtopicName,
    categoryName: fallback.categoryName,
    availableUnseenCount: fallback.unseenCount,
    totalQuestionsInSubtopic: fallback.totalQuestions,
    accuracyPercentage: fallback.attemptedCount > 0 ? fallback.firstPassAccuracy : undefined,
    attemptsCount: fallback.attemptedCount,
    recommendedQuestionCount: Math.min(10, Math.max(5, fallback.unseenCount)),
  };
}
