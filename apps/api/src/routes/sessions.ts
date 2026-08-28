import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, inArray, and, sql, notInArray, desc } from 'drizzle-orm';
import { 
  questions, 
  questionContent, 
  questionOptions, 
  questionExplanations,
  questionFirstAttempts,
  questionAttempts,
  sessions,
  categories,
  subtopics
} from '../db/schema';
import { requireAuth, type AuthContext } from '../middleware/auth';

const sessionsRouter = new Hono<AuthContext>();

export interface SessionBuilderQuery {
  pathwayId?: string;
  categoryIds?: string[];
  subtopicIds?: string[];
  statusFilter?: 'all' | 'unattempted' | 'incorrect' | 'flagged' | 'due_for_review';
  mode: 'learn' | 'timed';
  questionCount: number;
  timeLimitSeconds?: number;
}

// ==========================================
// 1. Session Builder Query / Count Estimator
// ==========================================

sessionsRouter.post('/estimate', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<SessionBuilderQuery>();
  const db = drizzle(c.env.DB);

  const matchedQuestions = await fetchFilteredQuestions(db, user.id, body);

  return c.json({
    availableCount: matchedQuestions.length,
    requestedCount: body.questionCount || 20,
    categoriesCount: body.categoryIds?.length || 0,
    statusFilter: body.statusFilter || 'all',
  });
});

// ==========================================
// 2. Create & Launch Session (Atomic)
// ==========================================

sessionsRouter.post('/create', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<SessionBuilderQuery>();
  const db = drizzle(c.env.DB);
  const now = new Date();

  // 1. Resolve filtered question pool
  const matchedQuestionIds = await fetchFilteredQuestions(db, user.id, body);

  if (matchedQuestionIds.length === 0) {
    return c.json({
      error: 'No questions match the selected curriculum and status filters.',
    }, 422);
  }

  // 2. Shuffle and limit to target count
  const shuffled = [...matchedQuestionIds].sort(() => Math.random() - 0.5);
  const targetCount = Math.min(body.questionCount || 20, shuffled.length);
  const selectedQuestionIds = shuffled.slice(0, targetCount);

  // 3. Create Session Record in D1
  const sessionId = crypto.randomUUID();
  const timeLimit = body.mode === 'timed' ? body.timeLimitSeconds || targetCount * 90 : null; // default 90s per question in timed

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    mode: body.mode || 'learn',
    totalQuestions: targetCount,
    questionsAnswered: 0,
    correctAnswers: 0,
    timeLimitSeconds: timeLimit,
    timeTakenSeconds: 0,
    completed: false,
    configurationJson: JSON.stringify({
      categoryIds: body.categoryIds,
      subtopicIds: body.subtopicIds,
      statusFilter: body.statusFilter,
      selectedQuestionIds,
    }),
    createdAt: now,
    updatedAt: now,
  });

  // 4. Fetch full question objects for immediate client-side rendering
  const fullQuestions = await fetchHydratedQuestions(db, selectedQuestionIds);

  return c.json({
    sessionId,
    mode: body.mode || 'learn',
    totalQuestions: targetCount,
    timeLimitSeconds: timeLimit,
    questions: fullQuestions,
  }, 201);
});

// ==========================================
// 3. Answer Submission (Dual-Store Write in Single Transaction)
// ==========================================

export interface AnswerSubmissionPayload {
  sessionId?: string;
  questionId: string;
  questionVersion: number;
  selectedOptionId: string;
  confidence?: 'low' | 'medium' | 'high';
  timeTakenSeconds: number;
  mode: 'learn' | 'timed';
}

sessionsRouter.post('/answer', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<AnswerSubmissionPayload>();
  const db = drizzle(c.env.DB);
  const now = new Date();

  // 1. Verify Option & Correctness
  const [selectedOpt] = await db
    .select()
    .from(questionOptions)
    .where(eq(questionOptions.id, body.selectedOptionId))
    .limit(1);

  if (!selectedOpt) {
    return c.json({ error: 'Selected option not found' }, 404);
  }

  const isCorrect = Boolean(selectedOpt.isCorrect);

  // 2. Prepare Atomic Batch Statements for Dual-Store Write
  const statements: any[] = [];

  // Check if first attempt already exists
  const [firstAttempt] = await db
    .select()
    .from(questionFirstAttempts)
    .where(and(eq(questionFirstAttempts.userId, user.id), eq(questionFirstAttempts.questionId, body.questionId)))
    .limit(1);

  const isFirstEverAttempt = !firstAttempt;

  if (isFirstEverAttempt) {
    // Non-Negotiable Rule #1: Write to question_first_attempts ONLY IF ABSENT
    statements.push(
      db.insert(questionFirstAttempts).values({
        id: crypto.randomUUID(),
        userId: user.id,
        questionId: body.questionId,
        questionVersion: body.questionVersion || 1,
        selectedOptionId: body.selectedOptionId,
        isCorrect,
        confidence: body.confidence || null,
        timeTakenSeconds: body.timeTakenSeconds || 0,
        mode: body.mode || 'learn',
        answeredAt: now,
      })
    );
  }

  // Count previous attempts to assign attemptNumber
  const [previousAttemptsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionAttempts)
    .where(and(eq(questionAttempts.userId, user.id), eq(questionAttempts.questionId, body.questionId)));

  const attemptNumber = (previousAttemptsCount?.count || 0) + 1;

  // ALWAYS write to question_attempts (Working practice store)
  statements.push(
    db.insert(questionAttempts).values({
      id: crypto.randomUUID(),
      userId: user.id,
      questionId: body.questionId,
      sessionId: body.sessionId || null,
      attemptNumber,
      questionVersion: body.questionVersion || 1,
      selectedOptionId: body.selectedOptionId,
      isCorrect,
      confidence: body.confidence || null,
      timeTakenSeconds: body.timeTakenSeconds || 0,
      mode: body.mode || 'learn',
      answeredAt: now,
    })
  );

  // Update session counters if attached
  if (body.sessionId) {
    statements.push(
      db
        .update(sessions)
        .set({
          questionsAnswered: sql`${sessions.questionsAnswered} + 1`,
          correctAnswers: isCorrect ? sql`${sessions.correctAnswers} + 1` : sql`${sessions.correctAnswers}`,
          timeTakenSeconds: sql`${sessions.timeTakenSeconds} + ${body.timeTakenSeconds || 0}`,
          updatedAt: now,
        })
        .where(eq(sessions.id, body.sessionId))
    );
  }

  // Execute all writes as a single atomic D1 batch transaction
  if (statements.length > 0) {
    await db.batch(statements as any);
  }

  // 5. Fetch full rationales and explanations for immediate display
  const allOptions = await db
    .select()
    .from(questionOptions)
    .where(eq(questionOptions.questionId, body.questionId));

  const [explanation] = await db
    .select()
    .from(questionExplanations)
    .where(eq(questionExplanations.questionId, body.questionId))
    .limit(1);

  return c.json({
    isCorrect,
    isFirstEverAttempt,
    correctOptionId: allOptions.find((o) => o.isCorrect)?.id,
    options: allOptions,
    explanation,
  });
});

// ==========================================
// 4. Session Summary & Review Grid
// ==========================================

sessionsRouter.get('/:id/summary', requireAuth, async (c) => {
  const user = c.get('user');
  const sessionId = c.req.param('id');
  if (!sessionId) return c.json({ error: 'Session ID is required' }, 400);

  const db = drizzle(c.env.DB);

  // 1. Fetch Session Record
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, user.id)))
    .limit(1);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  // 2. Fetch Attempts in this Session
  const sessionAttempts = await db
    .select({
      attemptId: questionAttempts.id,
      questionId: questionAttempts.questionId,
      attemptNumber: questionAttempts.attemptNumber,
      isCorrect: questionAttempts.isCorrect,
      confidence: questionAttempts.confidence,
      timeTakenSeconds: questionAttempts.timeTakenSeconds,
      selectedOptionId: questionAttempts.selectedOptionId,
      answeredAt: questionAttempts.answeredAt,
    })
    .from(questionAttempts)
    .where(eq(questionAttempts.sessionId, sessionId));

  // 3. Hydrate Question Metadata & Subtopics for Jump-to-Weak-Topic
  const questionIds = sessionAttempts.map((a) => a.questionId);
  let questionsInfo: any[] = [];
  if (questionIds.length > 0) {
    questionsInfo = await db
      .select({
        id: questions.id,
        publicId: questions.publicId,
        difficulty: questions.difficulty,
        subtopicId: questions.primarySubtopicId,
      })
      .from(questions)
      .where(inArray(questions.id, questionIds));
  }

  const qMap = new Map(questionsInfo.map((q) => [q.id, q]));

  // 4. Calculate Subtopic Breakdown & Identify Weak Topics
  const topicStats: Record<string, { total: number; correct: number; subtopicId: string }> = {};
  const reviewGrid = sessionAttempts.map((att, idx) => {
    const qInfo = qMap.get(att.questionId);
    const subId = qInfo?.subtopicId || 'unknown';
    
    if (!topicStats[subId]) {
      topicStats[subId] = { total: 0, correct: 0, subtopicId: subId };
    }
    topicStats[subId].total += 1;
    if (att.isCorrect) topicStats[subId].correct += 1;

    return {
      index: idx + 1,
      attemptId: att.attemptId,
      questionId: att.questionId,
      publicId: qInfo?.publicId || 'Q',
      difficulty: qInfo?.difficulty || 'medium',
      isCorrect: att.isCorrect,
      confidence: att.confidence,
      timeTakenSeconds: att.timeTakenSeconds,
    };
  });

  const weakTopics = Object.values(topicStats)
    .filter((t) => (t.correct / t.total) < 0.7)
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total));

  const totalAnswered = sessionAttempts.length;
  const correctCount = sessionAttempts.filter((a) => a.isCorrect).length;
  const accuracyPercentage = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const averageTimePerQuestion = totalAnswered > 0 ? Math.round(session.timeTakenSeconds / totalAnswered) : 0;

  return c.json({
    sessionId: session.id,
    mode: session.mode,
    completed: session.completed,
    score: {
      totalQuestions: session.totalQuestions,
      questionsAnswered: totalAnswered,
      correctCount,
      accuracyPercentage,
    },
    timing: {
      totalTimeSeconds: session.timeTakenSeconds,
      averageTimePerQuestionSeconds: averageTimePerQuestion,
      timeLimitSeconds: session.timeLimitSeconds,
    },
    reviewGrid,
    weakTopics,
  });
});

// ==========================================
// 5. Category Reset (Dual-Store Rule #1 Safeguard)
// Clears question_attempts for category, question_first_attempts remains UNTOUCHED
// ==========================================

sessionsRouter.post('/reset-category', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ categoryId: string; confirmation: string }>();

  if (!body.categoryId) {
    return c.json({ error: 'Category ID is required' }, 400);
  }

  // Explicit confirmation keyword guard
  if (body.confirmation !== 'RESET_CATEGORY') {
    return c.json({
      error: 'Explicit confirmation required. Please confirm category reset.',
    }, 400);
  }

  const db = drizzle(c.env.DB);

  // 1. Resolve all subtopics and questions belonging to this category
  const catSubtopics = await db
    .select({ id: subtopics.id })
    .from(subtopics)
    .where(eq(subtopics.categoryId, body.categoryId));

  if (catSubtopics.length === 0) {
    return c.json({ error: 'Category or subtopics not found' }, 404);
  }

  const subIds = catSubtopics.map((s) => s.id);
  const catQuestions = await db
    .select({ id: questions.id })
    .from(questions)
    .where(inArray(questions.primarySubtopicId, subIds));

  const qIds = catQuestions.map((q) => q.id);

  if (qIds.length === 0) {
    return c.json({ message: 'No questions in category to reset.' });
  }

  // 2. Delete strictly from question_attempts (working practice store)
  // Non-Negotiable Rule #1: question_first_attempts is NEVER touched or deleted
  await db
    .delete(questionAttempts)
    .where(and(eq(questionAttempts.userId, user.id), inArray(questionAttempts.questionId, qIds)));

  return c.json({
    status: 'success',
    message: 'Category practice attempts cleared. First-attempt baseline metrics remain intact.',
    categoryId: body.categoryId,
    questionsResetCount: qIds.length,
  });
});

// ==========================================
// Helper: Filtered Question Resolver
// ==========================================

async function fetchFilteredQuestions(
  db: ReturnType<typeof drizzle>,
  userId: string,
  filters: SessionBuilderQuery
): Promise<string[]> {
  let baseQuery = db
    .select({ id: questions.id, subtopicId: questions.primarySubtopicId })
    .from(questions)
    .where(eq(questions.status, 'published'));

  const allPublished = await baseQuery;
  let candidatePool = allPublished;

  // Filter by Subtopics if provided
  if (filters.subtopicIds && filters.subtopicIds.length > 0) {
    candidatePool = candidatePool.filter((q) => filters.subtopicIds!.includes(q.subtopicId));
  } else if (filters.categoryIds && filters.categoryIds.length > 0) {
    // Resolve all subtopics in categories
    const relevantSubtopics = await db
      .select({ id: subtopics.id })
      .from(subtopics)
      .where(inArray(subtopics.categoryId, filters.categoryIds));
    const subIds = new Set(relevantSubtopics.map((s) => s.id));
    candidatePool = candidatePool.filter((q) => subIds.has(q.subtopicId));
  }

  const candidateIds = candidatePool.map((q) => q.id);
  if (candidateIds.length === 0) return [];

  // Filter by User Attempt Status (Dual-Store Queries)
  if (filters.statusFilter === 'unattempted') {
    const attempted = await db
      .select({ questionId: questionFirstAttempts.questionId })
      .from(questionFirstAttempts)
      .where(eq(questionFirstAttempts.userId, userId));
    const attemptedSet = new Set(attempted.map((a) => a.questionId));
    return candidateIds.filter((id) => !attemptedSet.has(id));
  }

  if (filters.statusFilter === 'incorrect') {
    const incorrectAttempts = await db
      .select({ questionId: questionAttempts.questionId })
      .from(questionAttempts)
      .where(and(eq(questionAttempts.userId, userId), eq(questionAttempts.isCorrect, false)));
    const incorrectSet = new Set(incorrectAttempts.map((a) => a.questionId));
    return candidateIds.filter((id) => incorrectSet.has(id));
  }

  return candidateIds;
}

async function fetchHydratedQuestions(db: ReturnType<typeof drizzle>, questionIds: string[]) {
  if (questionIds.length === 0) return [];

  const questionRows = await db
    .select()
    .from(questions)
    .where(inArray(questions.id, questionIds));

  const contentRows = await db
    .select()
    .from(questionContent)
    .where(inArray(questionContent.questionId, questionIds));

  const optionsRows = await db
    .select()
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, questionIds));

  const explanationRows = await db
    .select()
    .from(questionExplanations)
    .where(inArray(questionExplanations.questionId, questionIds));

  const contentMap = new Map(contentRows.map((c) => [c.questionId, c]));
  const explanationMap = new Map(explanationRows.map((e) => [e.questionId, e]));
  const optionsMap = new Map<string, typeof optionsRows>();

  for (const opt of optionsRows) {
    const list = optionsMap.get(opt.questionId) || [];
    list.push(opt);
    optionsMap.set(opt.questionId, list);
  }

  return questionRows.map((q) => ({
    id: q.id,
    publicId: q.publicId,
    version: q.version,
    difficulty: q.difficulty,
    questionType: q.questionType,
    sector: q.sector,
    content: contentMap.get(q.id) || null,
    options: (optionsMap.get(q.id) || []).sort((a, b) => a.sortOrder - b.sortOrder),
    explanation: explanationMap.get(q.id) || null,
  }));
}

export { sessionsRouter };
