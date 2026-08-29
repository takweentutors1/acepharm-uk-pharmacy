import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { requireAuth, type AuthContext } from '../middleware/auth';
import { calculateMeaningfulStreak } from '../lib/streak-calculator';

const analyticsRouter = new Hono<AuthContext>();

// ==========================================
// 1. Streak & Daily Goal Metrics
// ==========================================

analyticsRouter.get('/streak', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);
  const userTimezone = user.timezone || 'Europe/London';

  const streakData = await calculateMeaningfulStreak(db, user.id, userTimezone);

  return c.json({
    status: 'ok',
    timezone: userTimezone,
    ...streakData,
  });
});

// ==========================================
// 2. Timezone-Aware Daily Goal (Reset at local midnight, default 20/day)
// ==========================================

import { userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';

analyticsRouter.get('/daily-goal', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);
  const userTimezone = user.timezone || 'Europe/London';

  // 1. Fetch user profile target (defaults to 20/day)
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  const dailyTarget = profile?.dailyQuestionTarget || 20;

  // 2. Calculate local midnight reset timestamp
  const now = new Date();
  const todayLocalStr = now.toLocaleDateString('en-CA', { timeZone: userTimezone }); // YYYY-MM-DD
  
  // Calculate seconds remaining until next local midnight
  const tomorrowLocal = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);
  tomorrowLocal.setHours(0, 0, 0, 0);

  const streakData = await calculateMeaningfulStreak(db, user.id, userTimezone);

  const answeredToday = streakData.todayQuestionsCount;
  const progressPercent = Math.min(100, Math.round((answeredToday / dailyTarget) * 100));
  const isGoalCompleted = answeredToday >= dailyTarget;

  return c.json({
    status: 'ok',
    timezone: userTimezone,
    localDate: todayLocalStr,
    dailyTarget,
    answeredToday,
    remainingToday: Math.max(0, dailyTarget - answeredToday),
    progressPercent,
    isGoalCompleted,
    isMeaningfulSessionReached: streakData.isMeaningfulToday,
    nextResetAt: tomorrowLocal.toISOString(),
  });
});

// Update daily goal target
analyticsRouter.put('/daily-goal', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{ dailyTarget: number }>();

  if (!body.dailyTarget || body.dailyTarget < 5 || body.dailyTarget > 100) {
    return c.json({ error: 'Daily target must be between 5 and 100 questions.' }, 400);
  }

  const db = drizzle(c.env.DB);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (existing) {
    await db
      .update(userProfiles)
      .set({
        dailyQuestionTarget: body.dailyTarget,
        updatedAt: now,
      })
      .where(eq(userProfiles.id, existing.id));
  } else {
    await db.insert(userProfiles).values({
      id: crypto.randomUUID(),
      userId: user.id,
      stage: 'foundation_trainee',
      dailyQuestionTarget: body.dailyTarget,
      showConfidencePrompt: true,
      hideOptionsByDefault: false,
      showDifficultyLabels: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  return c.json({
    status: 'updated',
    dailyTarget: body.dailyTarget,
  });
});

// ==========================================
// 3. Explainable Next Recommendation (Milestone 4)
// ==========================================

import { getNextRecommendedFocus } from '../lib/recommendation-engine';

analyticsRouter.get('/recommendation', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);

  const recommendation = await getNextRecommendedFocus(db, user.id);

  return c.json({
    status: 'ok',
    recommendation,
  });
});

// ==========================================
// 4. Distinct Progress Metrics & Coverage Map (Section 7.2 & Milestone 4)
// ==========================================

import { calculateProgressMetrics } from '../lib/progress-calculator';

analyticsRouter.get('/metrics', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);

  const metrics = await calculateProgressMetrics(db, user.id);

  return c.json({
    status: 'ok',
    ...metrics,
  });
});

// ==========================================
// 5. Weak-Area Session Generator (Milestone 4)
// ==========================================

import { generateWeakAreaSession, type WeakAreaSessionConfig } from '../lib/weak-area-generator';

analyticsRouter.post('/weak-area-session', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<WeakAreaSessionConfig>().catch(() => ({} as WeakAreaSessionConfig));
  const db = drizzle(c.env.DB);

  const sessionResult = await generateWeakAreaSession(db, user.id, body);

  return c.json({
    status: 'created',
    ...sessionResult,
  });
});

export { analyticsRouter };
