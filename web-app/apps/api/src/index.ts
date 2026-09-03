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
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  RESEND_API_KEY?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  SUPPORT_INBOX_EMAIL?: string;
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
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://*.firebaseapp.com; connect-src 'self' https://*.workers.dev https://*.pages.dev https://api.acepharmexams.co.uk https://acepharmexams.co.uk https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://opencode.ai; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
  );
  await next();
});

app.use('*', cors({
  origin: [
    'https://acepharmexams.co.uk',
    'https://app.acepharmexams.co.uk',
    'https://acepharm.co.uk',
    'https://app.acepharm.co.uk',
    'https://acepharm-marketing.pages.dev',
    'https://acepharm-app.pages.dev',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  allowHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Apply Rate Limiting to sensitive Auth, User, and Contact endpoints
app.use('/api/v1/auth/*', rateLimiter({ limit: 60, windowSeconds: 60, keyPrefix: 'rl_auth' }));
app.use('/api/v1/user/*', rateLimiter({ limit: 60, windowSeconds: 60, keyPrefix: 'rl_user' }));
app.use('/api/v1/contact/*', rateLimiter({ limit: 5, windowSeconds: 60, keyPrefix: 'rl_contact' }));

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

import { userProfiles, universities } from './db/schema';
import { eq, asc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { deleteUserAccount } from './lib/account-service';

// Authenticated current user profile with preferences
app.get('/api/v1/auth/me', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);

  let [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  // A row only ever exists once the learner has completed the 5-step
  // onboarding flow (see PUT /api/v1/user/onboarding) — capture that
  // before substituting display defaults below.
  const hasCompletedOnboarding = Boolean(profile);

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
    onboarding: {
      completed: hasCompletedOnboarding,
      stage: profile.stage,
      primaryGoal: profile.primaryGoal,
      assessmentDate: profile.assessmentDate,
      universityId: profile.universityId,
    },
    preferences: {
      showConfidencePrompt: Boolean(profile.showConfidencePrompt),
      hideOptionsByDefault: Boolean(profile.hideOptionsByDefault),
      showDifficultyLabels: Boolean(profile.showDifficultyLabels),
      dailyQuestionTarget: profile.dailyQuestionTarget,
    },
  });
});

// Complete/update the 5-step onboarding flow (Milestone 2, Section 3.4):
// training stage, primary revision target, exam date, daily question
// goal, and university affiliation. Upserts the same `user_profiles` row
// `/user/preferences` writes to, so onboarding-set values pre-populate
// Settings, and vice versa.
app.put('/api/v1/user/onboarding', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<{
    stage?: 'year_2' | 'year_3' | 'year_4' | 'foundation_trainee' | 'oriel' | 'ip' | 'other';
    primaryGoal?: string;
    assessmentDate?: string;
    dailyQuestionTarget?: number;
    universityId?: string;
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
        stage: body.stage ?? existing.stage,
        primaryGoal: body.primaryGoal ?? existing.primaryGoal,
        assessmentDate: body.assessmentDate ?? existing.assessmentDate,
        dailyQuestionTarget: body.dailyQuestionTarget ?? existing.dailyQuestionTarget,
        universityId: body.universityId ?? existing.universityId,
        updatedAt: now,
      })
      .where(eq(userProfiles.id, existing.id));
  } else {
    await db.insert(userProfiles).values({
      id: crypto.randomUUID(),
      userId: user.id,
      stage: body.stage ?? 'other',
      primaryGoal: body.primaryGoal ?? null,
      assessmentDate: body.assessmentDate ?? null,
      dailyQuestionTarget: body.dailyQuestionTarget ?? 20,
      universityId: body.universityId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  return c.json({ status: 'onboarded' });
});

// List active universities/institutions for the onboarding affiliation
// step. Reference data — no write path exists yet for adding new ones.
app.get('/api/v1/universities', requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db
    .select({ id: universities.id, name: universities.name })
    .from(universities)
    .where(eq(universities.active, true))
    .orderBy(asc(universities.name));

  return c.json({ universities: rows });
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

// Permanently deletes the signed-in user's account and all associated
// data (GDPR right to erasure / Apple Guideline 5.1.1(v)). The client is
// responsible for re-authenticating before calling this — Firebase's own
// `user.delete()` (called after this succeeds) enforces recent sign-in.
app.delete('/api/v1/user/account', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);

  await deleteUserAccount(db, user.id, c.env.STRIPE_SECRET_KEY);

  return c.json({ status: 'deleted' });
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
import { contactRouter } from './routes/contact';
import { authEmailsRouter } from './routes/auth-emails';

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
app.route('/api/v1/contact', contactRouter);
app.route('/api/v1/auth', authEmailsRouter);

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

import { executeD1BackupToR2 } from './lib/backup-service';

// Admin Manual Backup Trigger & Test Endpoint
admin.post('/backup/trigger', requireRole(['super_admin', 'finance_admin']), async (c) => {
  const result = await executeD1BackupToR2(c.env.DB, c.env.ASSETS);
  return c.json({
    status: 'success',
    ...result,
  });
});

export { app };

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        const cron = event.cron;
        console.log(`[Scheduled Cron Triggered]: ${cron}`);

        // 1. Daily 03:00 UTC D1 Automated Backup to R2
        if (cron === '0 3 * * *' || cron.includes('3')) {
          try {
            const backupResult = await executeD1BackupToR2(env.DB, env.ASSETS);
            console.log(`[Daily D1 Backup Success]: Saved snapshot ${backupResult.backupKey} (${backupResult.sizeBytes} bytes)`);
          } catch (err) {
            console.error('[Daily D1 Backup Error]:', err);
          }
        }

        // 2. Weekly 04:00 UTC Monday Insight Generator
        if (cron === '0 4 * * 1' || cron.includes('4')) {
          try {
            const db = drizzle(env.DB);
            const zenApiKey = env.ZEN_API_KEY;
            const result = await runWeeklyInsightCron(db, env.CACHE, zenApiKey, env);
            console.log(`[Weekly Insight Cron Success]: processed ${result.processed}, cached ${result.cached}, emails sent ${result.emailsSent}`);
          } catch (err) {
            console.error('[Weekly Insight Cron Error]:', err);
          }
        }
      })()
    );
  },
};
