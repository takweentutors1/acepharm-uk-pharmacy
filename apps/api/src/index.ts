import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth, type AuthContext } from './middleware/auth';
import { requireAdmin, requireRole, type UserRole } from './middleware/rbac';

export type Bindings = {
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: Ai;
  RATE_LIMIT: KVNamespace;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
  FIREBASE_ADMIN_KEY?: string;
  ZEN_API_KEY?: string;
};

import { rateLimiter } from './middleware/rate-limit';

const app = new Hono<AuthContext>();

// Global Security & CSP Headers
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://*.firebaseapp.com; connect-src 'self' https://*.workers.dev https://*.pages.dev https://api.acepharm.co.uk https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://opencode.ai; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
  );
  await next();
});

app.use('*', cors({
  origin: ['https://acepharm.co.uk', 'https://app.acepharm.co.uk', 'http://localhost:3000', 'http://localhost:3001'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Apply Rate Limiting to sensitive Auth & User endpoints (60 req/min)
app.use('/api/v1/auth/*', rateLimiter({ limit: 60, windowSeconds: 60, keyPrefix: 'rl_auth' }));
app.use('/api/v1/user/*', rateLimiter({ limit: 60, windowSeconds: 60, keyPrefix: 'rl_user' }));

// Public health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'acepharm-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Public meta endpoint
app.get('/api/v1/meta/curriculum-summary', (c) => {
  return c.json({
    pathways: ['MPharm'],
    categories_count: 19,
    status: 'active',
  });
});

import { userProfiles } from './db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

// Authenticated current user profile with preferences
app.get('/api/v1/auth/me', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);

  let [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    // Default fallback
    profile = {
      id: crypto.randomUUID(),
      userId: user.id,
      stage: 'foundation_trainee',
      primaryGoal: 'Pass GPhC Registration Exam',
      assessmentDate: null,
      dailyQuestionTarget: 20,
      universityId: null,
      showConfidencePrompt: true,
      hideOptionsByDefault: false,
      showDifficultyLabels: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return c.json({
    user: {
      id: user.id,
      firebase_uid: user.firebaseUid,
      email: user.email,
      first_name: user.firstName,
      role: user.role,
      status: user.status,
      timezone: user.timezone,
      email_verified_at: user.emailVerifiedAt,
      created_at: user.createdAt,
    },
    preferences: {
      showConfidencePrompt: Boolean(profile.showConfidencePrompt),
      hideOptionsByDefault: Boolean(profile.hideOptionsByDefault),
      showDifficultyLabels: Boolean(profile.showDifficultyLabels),
      dailyQuestionTarget: profile.dailyQuestionTarget,
    },
  });
});

// Update user preferences (hideOptionsByDefault, showConfidencePrompt)
app.put('/api/v1/user/preferences', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    showConfidencePrompt?: boolean;
    hideOptionsByDefault?: boolean;
    showDifficultyLabels?: boolean;
  }>();

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
        showConfidencePrompt: body.showConfidencePrompt !== undefined ? body.showConfidencePrompt : existing.showConfidencePrompt,
        hideOptionsByDefault: body.hideOptionsByDefault !== undefined ? body.hideOptionsByDefault : existing.hideOptionsByDefault,
        showDifficultyLabels: body.showDifficultyLabels !== undefined ? body.showDifficultyLabels : existing.showDifficultyLabels,
        updatedAt: now,
      })
      .where(eq(userProfiles.id, existing.id));
  } else {
    await db.insert(userProfiles).values({
      id: crypto.randomUUID(),
      userId: user.id,
      stage: 'foundation_trainee',
      showConfidencePrompt: body.showConfidencePrompt ?? true,
      hideOptionsByDefault: body.hideOptionsByDefault ?? false,
      showDifficultyLabels: body.showDifficultyLabels ?? true,
      dailyQuestionTarget: 20,
      createdAt: now,
      updatedAt: now,
    });
  }

  return c.json({
    status: 'updated',
    preferences: {
      showConfidencePrompt: body.showConfidencePrompt,
      hideOptionsByDefault: body.hideOptionsByDefault,
      showDifficultyLabels: body.showDifficultyLabels,
    },
  });
});

// ==========================================
// Admin & Clinical Review Routes (RBAC Protected)
// ==========================================

const admin = new Hono<AuthContext>();

// Apply Auth + RBAC middleware to all /admin/* routes
admin.use('*', requireAuth, requireAdmin);

admin.get('/overview', (c) => {
  const user = c.get('user');
  return c.json({
    status: 'ok',
    message: 'Welcome to AcePharm Clinical Admin Portal',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

admin.get('/content/review-queue', requireRole(['clinical_reviewer', 'educational_reviewer', 'content_lead', 'super_admin']), (c) => {
  return c.json({
    queue: [],
    pending_clinical: 0,
    pending_editorial: 0,
  });
});

import { runMilestone2SeedPipeline } from './seed-pipeline';

admin.post('/seed/milestone2', requireRole(['content_lead', 'super_admin']), async (c) => {
  const result = await runMilestone2SeedPipeline(c.env.DB);
  return c.json({
    status: 'completed',
    ...result,
  });
});

import { curriculumRouter } from './routes/curriculum';
import { questionsRouter } from './routes/questions';
import { sessionsRouter } from './routes/sessions';
import { analyticsRouter } from './routes/analytics';
import { aceRouter } from './routes/ace';

import { blogRoutes } from './routes/blog';
import { stripeRoutes } from './routes/stripe';

admin.route('/curriculum', curriculumRouter);
admin.route('/questions', questionsRouter);

app.route('/admin', admin);
app.route('/api/v1/admin', admin);
app.route('/api/v1/curriculum', curriculumRouter);
app.route('/api/v1/questions', questionsRouter);
app.route('/api/v1/sessions', sessionsRouter);
app.route('/api/v1/analytics', analyticsRouter);
app.route('/api/v1/ace', aceRouter);
app.route('/api/v1/blog', blogRoutes);
app.route('/api/v1/stripe', stripeRoutes);

import { runWeeklyInsightCron, generateSingleWeeklyInsight } from './lib/weekly-insight-generator';

// GET Cached Weekly Insight (Never generated on page load - Section 5.2 & 5.3)
app.get('/api/v1/ace/weekly-insight', async (c) => {
  const authUser = c.get('user');
  const userId = authUser?.id || c.req.query('user_id') || 'guest-learner';

  // 1. Try reading from KV Cache (0 perceived latency)
  if (c.env.CACHE) {
    try {
      const cached = await c.env.CACHE.get(`ace_weekly_insight:${userId}`, 'json');
      if (cached) {
        return c.json({
          ...cached,
          source: 'kv_cache',
        });
      }
    } catch (err) {
      console.warn('Weekly insight KV cache error:', err);
    }
  }

  // 2. Return standard placeholder if cron has not run yet (avoid live heavy generation on page load)
  return c.json({
    userId,
    insightParagraph: 'Complete your first practice sessions this week to receive your scheduled weekly clinical coaching insight from Ace.',
    confidentlyIncorrectCount: 0,
    source: 'default_empty',
  });
});

export { app };

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const db = drizzle(env.DB);
        const zenApiKey = env.ZEN_API_KEY;
        const result = await runWeeklyInsightCron(db, env.CACHE, zenApiKey);
        console.log(`Weekly insight cron completed: processed ${result.processed}, cached ${result.cached}`);
      })()
    );
  },
};
