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
