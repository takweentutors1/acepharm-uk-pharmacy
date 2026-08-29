import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import { aceThreads, aceMessages, users } from '../db/schema';
import { requireAuth, type AuthContext } from '../middleware/auth';
import { generateAceResponse, type AceContextType } from '../lib/ace-service';

export const aceRouter = new Hono<AuthContext>();

// 1. Send Message to Ace (with KV response caching for identical quick prompts)
aceRouter.post('/message', async (c) => {
  try {
    const body = await c.req.json<{
      threadId?: string;
      contextType: AceContextType;
      contextId?: string;
      prompt: string;
      intent?: 'simpler' | 'whynot' | 'similar' | 'test' | 'exam' | 'steps' | 'free_text';
      stream?: boolean;
      userId?: string;
    }>();

    if (!body.prompt || !body.contextType) {
      return c.json({ error: 'Validation: prompt and contextType are required' }, 400);
    }

    const db = drizzle(c.env.DB);
    const now = new Date();
    const authUser = c.get('user');

    // 1. Resolve or provision valid user
    let userId = authUser?.id || body.userId;
    if (!userId || userId === 'guest-learner') {
      const guestUid = 'guest-learner-uid';
      const [existingGuest] = await db.select().from(users).where(eq(users.firebaseUid, guestUid)).limit(1);
      if (existingGuest) {
        userId = existingGuest.id;
      } else {
        userId = crypto.randomUUID();
        await db.insert(users).values({
          id: userId,
          firebaseUid: guestUid,
          email: 'guest@acepharm.co.uk',
          firstName: 'Guest Learner',
          role: 'student',
          status: 'active',
          timezone: 'Europe/London',
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Fair-Use Rate Limiting (60 requests/hour per user)
    if (c.env.RATE_LIMIT) {
      try {
        const rateLimitKey = `rl_ace:${userId}:${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
        const currentCountStr = await c.env.RATE_LIMIT.get(rateLimitKey);
        const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

        if (currentCount >= 60) {
          return c.json({
            error: 'Fair-use rate limit exceeded. You have reached the maximum of 60 Ace inquiries per hour. Please wait before asking more questions.',
          }, 429);
        }

        await c.env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
          expirationTtl: 3600, // 1 hour window
        });
      } catch (err) {
        console.warn('Ace rate limit error:', err);
      }
    }

    // 2. Resolve or create thread
    let threadId = body.threadId;
    if (!threadId) {
      // Check if an existing thread exists for this context
      if (body.contextId) {
        const [existingThread] = await db
          .select()
          .from(aceThreads)
          .where(eq(aceThreads.contextId, body.contextId))
          .orderBy(desc(aceThreads.createdAt))
          .limit(1);

        if (existingThread) {
          threadId = existingThread.id;
        }
      }

      if (!threadId) {
        threadId = `thread-${crypto.randomUUID()}`;
        await db.insert(aceThreads).values({
          id: threadId,
          userId,
          contextType: body.contextType,
          contextId: body.contextId || null,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // 3. Check KV Cache for identical question + quick prompt (Cost Control - Section 5.3)
    const isQuickPrompt = body.intent && body.intent !== 'free_text';
    const cacheKey = isQuickPrompt && body.contextId ? `ace_cache:${body.contextId}:${body.intent}` : null;

    if (cacheKey && c.env.CACHE) {
      try {
        const cached = await c.env.CACHE.get(cacheKey, 'json');
        if (cached) {
          return c.json({
            ...(cached as any),
            threadId,
            cached: true,
          });
        }
      } catch (e) {
        console.warn('KV cache read error:', e);
      }
    }

    // 4. Call generateAceResponse
    const zenApiKey = c.env.ZEN_API_KEY || 'sk-JTN4YC3zXustDR2dof8G29wiLruc49JBWRZU4Jsfh4wB5pZ0Fu6v1Jat7YvyDXvI';

    const responseResult = await generateAceResponse({
      db,
      ai: c.env.AI,
      vectorize: c.env.VECTORIZE,
      zenApiKey,
      userId,
      threadId,
      contextType: body.contextType,
      contextId: body.contextId,
      userPrompt: body.prompt,
      intent: body.intent,
      stream: false, // Return JSON response structure for Ask Ace drawer
    });

    // 5. Save to KV Cache if quick-prompt
    if (cacheKey && c.env.CACHE && responseResult.content) {
      try {
        await c.env.CACHE.put(cacheKey, JSON.stringify(responseResult), {
          expirationTtl: 86400 * 7, // 7 days cache for standardized quick prompts
        });
      } catch (e) {
        console.warn('KV cache put error:', e);
      }
    }

    return c.json({
      ...responseResult,
      threadId,
      cached: false,
    });
  } catch (err: any) {
    console.error('Ace route handler uncaught error:', err);
    return c.json({
      error: 'Ace generation failed',
      details: err?.message || String(err),
      stack: err?.stack,
    }, 500);
  }
});

import { generateSevenDayRevisionPlan, getActiveRevisionPlan } from '../lib/revision-planner';
import { diagnoseCalculationWorking } from '../lib/calculation-coach';

// 3. Generate or Get 7-Day Revision Plan (Section 5.2)
aceRouter.get('/revision-plan', async (c) => {
  const authUser = c.get('user');
  const userId = authUser?.id || c.req.query('user_id') || 'guest-learner';
  const db = drizzle(c.env.DB);

  let plan = await getActiveRevisionPlan(db, userId);
  if (!plan) {
    plan = await generateSevenDayRevisionPlan(db, userId);
  }

  return c.json({ plan });
});

aceRouter.post('/revision-plan/generate', async (c) => {
  const authUser = c.get('user');
  const body = (await c.req.json<{ targetAssessmentDate?: string; userId?: string }>().catch(() => ({}))) as {
    targetAssessmentDate?: string;
    userId?: string;
  };
  const userId = authUser?.id || body.userId || 'guest-learner';
  const db = drizzle(c.env.DB);

  const plan = await generateSevenDayRevisionPlan(db, userId, body.targetAssessmentDate);
  return c.json({ plan }, 201);
});

// 4. Diagnose Calculation Working (Calculation Coach - Section 5.2)
aceRouter.post('/calculation-coach/diagnose', async (c) => {
  const body = await c.req.json<{
    questionId: string;
    studentWorking: string;
    studentNumericAnswer?: number;
  }>();

  if (!body.questionId || !body.studentWorking) {
    return c.json({ error: 'Validation: questionId and studentWorking are required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const zenApiKey = c.env.ZEN_API_KEY;

  const diagnosis = await diagnoseCalculationWorking(
    db,
    body.questionId,
    body.studentWorking,
    body.studentNumericAnswer,
    zenApiKey
  );

  return c.json({ diagnosis });
});

import { 
  getUserFlashcards, 
  generateFlashcardFromQuestion, 
  submitFlashcardReview,
  SM2Grade 
} from '../lib/sm2-engine';

// 5. Flashcards (SuperMemo-2 Spaced Repetition)
aceRouter.get('/flashcards', async (c) => {
  const authUser = c.get('user');
  const userId = authUser?.id || c.req.query('user_id') || 'guest-learner';
  const db = drizzle(c.env.DB);

  const result = await getUserFlashcards(db, userId);
  return c.json(result);
});

aceRouter.post('/flashcards/generate', async (c) => {
  const authUser = c.get('user');
  const body = await c.req.json<{ questionId: string; userId?: string }>();
  if (!body.questionId) return c.json({ error: 'Missing questionId' }, 400);

  const userId = authUser?.id || body.userId || 'guest-learner';
  const db = drizzle(c.env.DB);
  const zenApiKey = c.env.ZEN_API_KEY;

  const card = await generateFlashcardFromQuestion(db, userId, body.questionId, zenApiKey);
  return c.json({ card }, 201);
});

aceRouter.post('/flashcards/:id/review', async (c) => {
  const cardId = c.req.param('id');
  const body = await c.req.json<{ grade: SM2Grade }>();
  if (!body.grade) return c.json({ error: 'Missing grade (again | hard | good | easy)' }, 400);

  const db = drizzle(c.env.DB);
  const updatedCard = await submitFlashcardReview(db, cardId, body.grade);

  if (!updatedCard) return c.json({ error: 'Flashcard not found' }, 404);
  return c.json({ card: updatedCard });
});

import { 
  seedConsultationScenario, 
  generatePatientExchange, 
  evaluateConsultationTranscript, 
  type SimulationExchange, 
  type RubricCriterion 
} from '../lib/consultation-simulator';
import { simulatorScenarios, simulatorAttempts } from '../db/schema';

// 6. Consultation Simulator (Section 5.2 - 4 Exchanges, 6-Point Rubric)
aceRouter.get('/simulator/scenarios', async (c) => {
  const db = drizzle(c.env.DB);
  await seedConsultationScenario(db);

  const scenarios = await db
    .select()
    .from(simulatorScenarios)
    .where(eq(simulatorScenarios.active, true));

  return c.json({
    scenarios: scenarios.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      personaName: s.personaName,
      personaRole: s.personaRole,
      scenarioContext: s.scenarioContext,
      rubric: JSON.parse(s.rubricJson),
    })),
  });
});

aceRouter.post('/simulator/exchange', async (c) => {
  const body = await c.req.json<{
    scenarioId: string;
    transcript: SimulationExchange[];
  }>();

  if (!body.scenarioId || !body.transcript) {
    return c.json({ error: 'Missing scenarioId or transcript' }, 400);
  }

  const db = drizzle(c.env.DB);
  const [scenario] = await db
    .select()
    .from(simulatorScenarios)
    .where(eq(simulatorScenarios.id, body.scenarioId))
    .limit(1);

  if (!scenario) return c.json({ error: 'Scenario not found' }, 404);

  const zenApiKey = c.env.ZEN_API_KEY;
  const patientReply = await generatePatientExchange(
    scenario.scenarioContext,
    scenario.personaName,
    scenario.personaRole,
    body.transcript,
    zenApiKey
  );

  return c.json({ reply: patientReply });
});

aceRouter.post('/simulator/evaluate', async (c) => {
  const authUser = c.get('user');
  const body = await c.req.json<{
    scenarioId: string;
    transcript: SimulationExchange[];
    userId?: string;
  }>();

  if (!body.scenarioId || !body.transcript) {
    return c.json({ error: 'Missing scenarioId or transcript' }, 400);
  }

  const db = drizzle(c.env.DB);
  const [scenario] = await db
    .select()
    .from(simulatorScenarios)
    .where(eq(simulatorScenarios.id, body.scenarioId))
    .limit(1);

  if (!scenario) return c.json({ error: 'Scenario not found' }, 404);

  const rubric: RubricCriterion[] = JSON.parse(scenario.rubricJson);
  const zenApiKey = c.env.ZEN_API_KEY;

  const evaluation = await evaluateConsultationTranscript(rubric, body.transcript, zenApiKey);
  const userId = authUser?.id || body.userId || 'guest-learner';

  // Save attempt in D1
  const attemptId = `sim-att-${crypto.randomUUID()}`;
  try {
    await db.insert(simulatorAttempts).values({
      id: attemptId,
      userId,
      scenarioId: body.scenarioId,
      transcriptJson: JSON.stringify(body.transcript),
      score: evaluation.score,
      feedbackJson: JSON.stringify(evaluation),
      completedAt: new Date(),
    });
  } catch (err) {
    console.warn('Simulator attempt insert warning:', err);
  }

  return c.json({ evaluation, attemptId });
});
