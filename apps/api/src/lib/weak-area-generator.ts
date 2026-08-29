import { drizzle } from 'drizzle-orm/d1';
import { eq, inArray, and, desc } from 'drizzle-orm';
import { 
  questions, 
  questionFirstAttempts, 
  questionAttempts, 
  categories, 
  subtopics,
  sessions 
} from '../db/schema';

export interface WeakAreaSessionConfig {
  questionCount?: number; // default 10, max 30
  mode?: 'learn' | 'exam'; // default 'learn'
  preferredCategoryId?: string;
}

export interface WeakAreaSessionResult {
  sessionId: string;
  totalQuestions: number;
  mode: 'learn' | 'exam';
  focusTopics: {
    subtopicId: string;
    subtopicName: string;
    categoryName: string;
    reason: string;
    questionsIncluded: number;
  }[];
  questionIds: string[];
}

/**
 * Weak-Area Session Generator (Section 8 - Milestone 4)
 * 
 * Remediation Heuristic:
 * 1. Identifies questions where the student's latest attempt was INCORRECT.
 * 2. Identifies subtopics with lowest first-pass accuracy (< 70%).
 * 3. Identifies questions answered correctly but with stated 'LOW' confidence (luck / guessing).
 * 4. Combines and prioritizes these items into a high-impact remediation session.
 * 5. Falls back to unseen questions in weak categories if not enough incorrect questions exist.
 */
export async function generateWeakAreaSession(
  db: ReturnType<typeof drizzle>,
  userId: string,
  config: WeakAreaSessionConfig = {}
): Promise<WeakAreaSessionResult> {
  const targetCount = Math.min(30, Math.max(5, config.questionCount || 10));
  const sessionMode = config.mode || 'learn';

  // 1. Fetch user's latest attempts per question
  const allAttempts = await db
    .select({
      id: questionAttempts.id,
      questionId: questionAttempts.questionId,
      isCorrect: questionAttempts.isCorrect,
      confidence: questionAttempts.confidence,
      answeredAt: questionAttempts.answeredAt,
    })
    .from(questionAttempts)
    .where(eq(questionAttempts.userId, userId))
    .orderBy(desc(questionAttempts.answeredAt));

  // Get most recent attempt status per question
  const latestAttemptMap = new Map<string, typeof allAttempts[0]>();
  for (const att of allAttempts) {
    if (!latestAttemptMap.has(att.questionId)) {
      latestAttemptMap.set(att.questionId, att);
    }
  }

  // 2. Fetch all published questions with subtopics and categories
  const allPublishedQuestions = await db
    .select({
      id: questions.id,
      subtopicId: questions.primarySubtopicId,
    })
    .from(questions)
    .where(eq(questions.status, 'published'));

  const allSubtopics = await db.select().from(subtopics);
  const allCategories = await db.select().from(categories);

  const catMap = new Map(allCategories.map((c) => [c.id, c.name]));
  const subtopicMap = new Map(allSubtopics.map((s) => [s.id, { name: s.name, categoryId: s.categoryId, categoryName: catMap.get(s.categoryId) || 'Therapeutics' }]));

  // 3. Priority Pool A: Questions currently incorrect on latest attempt
  const incorrectQuestionIds: string[] = [];
  // Priority Pool B: Questions answered correctly but with 'low' confidence (guess remediation)
  const lowConfidenceQuestionIds: string[] = [];

  for (const [qId, att] of latestAttemptMap.entries()) {
    if (!att.isCorrect) {
      incorrectQuestionIds.push(qId);
    } else if (att.confidence === 'low') {
      lowConfidenceQuestionIds.push(qId);
    }
  }

  // 4. Assemble candidate question IDs
  let selectedQuestionIds: string[] = [];

  // Filter by category if requested
  const filteredPublished = config.preferredCategoryId
    ? allPublishedQuestions.filter((q) => subtopicMap.get(q.subtopicId)?.categoryId === config.preferredCategoryId)
    : allPublishedQuestions;

  const validQuestionIdSet = new Set(filteredPublished.map((q) => q.id));

  // Add currently incorrect questions
  for (const qId of incorrectQuestionIds) {
    if (validQuestionIdSet.has(qId) && !selectedQuestionIds.includes(qId)) {
      selectedQuestionIds.push(qId);
      if (selectedQuestionIds.length >= targetCount) break;
    }
  }

  // Add low-confidence correct questions if space remaining
  if (selectedQuestionIds.length < targetCount) {
    for (const qId of lowConfidenceQuestionIds) {
      if (validQuestionIdSet.has(qId) && !selectedQuestionIds.includes(qId)) {
        selectedQuestionIds.push(qId);
        if (selectedQuestionIds.length >= targetCount) break;
      }
    }
  }

  // Fallback: If still under targetCount, fill with unattempted questions in weakest subtopics
  if (selectedQuestionIds.length < targetCount) {
    const unattemptedQuestions = filteredPublished.filter((q) => !latestAttemptMap.has(q.id));
    for (const q of unattemptedQuestions) {
      if (!selectedQuestionIds.includes(q.id)) {
        selectedQuestionIds.push(q.id);
        if (selectedQuestionIds.length >= targetCount) break;
      }
    }
  }

  // Final safety fallback: take any published questions
  if (selectedQuestionIds.length < targetCount) {
    for (const q of filteredPublished) {
      if (!selectedQuestionIds.includes(q.id)) {
        selectedQuestionIds.push(q.id);
        if (selectedQuestionIds.length >= targetCount) break;
      }
    }
  }

  // Shuffle selected questions
  selectedQuestionIds = selectedQuestionIds.sort(() => 0.5 - Math.random());

  // 5. Create new session in D1
  const sessionId = crypto.randomUUID();
  const now = new Date();

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    mode: sessionMode === 'exam' ? 'timed' : 'learn',
    totalQuestions: selectedQuestionIds.length,
    questionsAnswered: 0,
    correctAnswers: 0,
    timeTakenSeconds: 0,
    completed: false,
    configurationJson: JSON.stringify({
      questionIds: selectedQuestionIds,
      filterMode: 'weak_area',
    }),
    createdAt: now,
    updatedAt: now,
  });

  // 6. Aggregate focus topics summary
  const subtopicCounts = new Map<string, number>();
  for (const qId of selectedQuestionIds) {
    const qObj = allPublishedQuestions.find((q) => q.id === qId);
    if (qObj) {
      subtopicCounts.set(qObj.subtopicId, (subtopicCounts.get(qObj.subtopicId) || 0) + 1);
    }
  }

  const focusTopics = Array.from(subtopicCounts.entries()).map(([subId, count]) => {
    const subMeta = subtopicMap.get(subId) || { name: 'Therapeutics', categoryName: 'UK Pharmacy' };
    return {
      subtopicId: subId,
      subtopicName: subMeta.name,
      categoryName: subMeta.categoryName,
      reason: 'Remediation focus on incorrect attempts and low-confidence answers',
      questionsIncluded: count,
    };
  });

  return {
    sessionId,
    totalQuestions: selectedQuestionIds.length,
    mode: sessionMode,
    focusTopics,
    questionIds: selectedQuestionIds,
  };
}
