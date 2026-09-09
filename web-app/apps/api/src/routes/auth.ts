import { Hono } from 'hono';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq, isNull } from 'drizzle-orm';
import { users, authRefreshTokens, authEmailVerificationTokens, authPasswordResetTokens, type User } from '../db/schema';
import { requireAuth, type AuthContext } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limit';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  issueAccessToken,
  generateOpaqueToken,
  hashOpaqueToken,
  REFRESH_TOKEN_TTL_SECONDS,
  EMAIL_VERIFICATION_TTL_SECONDS,
  PASSWORD_RESET_TTL_SECONDS,
} from '../lib/tokens';
import {
  sendTransactionalEmail,
  generateVerificationEmail,
  generatePasswordResetEmail,
  generatePasswordChangedConfirmationEmail,
  type EmailEnvironment,
} from '../lib/email-service';

export const authRouter = new Hono<AuthContext>();

const APP_URL = 'https://app.acepharmexams.co.uk';

authRouter.use('/login', rateLimiter({ limit: 10, windowSeconds: 60, keyPrefix: 'rl_login' }));
authRouter.use('/signup', rateLimiter({ limit: 5, windowSeconds: 60, keyPrefix: 'rl_signup' }));
authRouter.use('/request-password-reset', rateLimiter({ limit: 5, windowSeconds: 300, keyPrefix: 'rl_pwreset' }));
authRouter.use('/resend-verification', rateLimiter({ limit: 3, windowSeconds: 300, keyPrefix: 'rl_resend' }));
authRouter.use('/refresh', rateLimiter({ limit: 30, windowSeconds: 60, keyPrefix: 'rl_refresh' }));

// ==========================================
// Schemas
// ==========================================

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  firstName: z.string().trim().max(100).optional(),
  marketingOptIn: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const logoutSchema = z.object({ refreshToken: z.string().min(1) });
const requestPasswordResetSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ token: z.string().min(1), newPassword: z.string().min(1) });
const verifyEmailSchema = z.object({ token: z.string().min(1) });
const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(1) });

const MIN_PASSWORD_LENGTH = 8;

// ==========================================
// Helpers
// ==========================================

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
  };
}

function requestMeta(c: { req: { header(name: string): string | undefined } }) {
  return {
    userAgent: c.req.header('user-agent') || null,
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
  };
}

type Db = ReturnType<typeof drizzle>;

async function issueTokenPair(
  db: Db,
  secret: string,
  user: User,
  meta: { userAgent: string | null; ip: string | null },
  familyId: string = crypto.randomUUID()
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await issueAccessToken(user, secret);
  const rawRefreshToken = generateOpaqueToken();
  const tokenHash = await hashOpaqueToken(rawRefreshToken);

  await db.insert(authRefreshTokens).values({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    familyId,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  });

  return { accessToken, refreshToken: rawRefreshToken };
}

async function revokeAllRefreshTokensForUser(db: Db, userId: string): Promise<void> {
  await db
    .update(authRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(authRefreshTokens.userId, userId), isNull(authRefreshTokens.revokedAt)));
}

async function sendVerificationEmail(env: EmailEnvironment, db: Db, user: User): Promise<void> {
  const rawToken = generateOpaqueToken();
  const tokenHash = await hashOpaqueToken(rawToken);

  await db.insert(authEmailVerificationTokens).values({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000),
  });

  const template = generateVerificationEmail({
    name: user.firstName || undefined,
    verificationLink: `${APP_URL}/auth/verify?token=${encodeURIComponent(rawToken)}`,
  });

  await sendTransactionalEmail(env, {
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

async function sendPasswordResetEmailFor(
  env: EmailEnvironment,
  db: Db,
  user: User,
  requestIp: string | null,
  isMigration: boolean
): Promise<void> {
  const rawToken = generateOpaqueToken();
  const tokenHash = await hashOpaqueToken(rawToken);

  await db.insert(authPasswordResetTokens).values({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000),
    requestIp: requestIp || undefined,
    isMigration,
  });

  const template = generatePasswordResetEmail({
    name: user.firstName || undefined,
    resetLink: `${APP_URL}/auth/reset?token=${encodeURIComponent(rawToken)}`,
    requestIp: requestIp || undefined,
  });

  await sendTransactionalEmail(env, {
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/** Extra email-scoped throttle for /login, on top of the per-IP `rateLimiter` middleware — catches credential stuffing across rotating IPs. */
async function checkEmailLoginRateLimit(env: { RATE_LIMIT?: KVNamespace }, email: string): Promise<boolean> {
  const kv = env.RATE_LIMIT;
  if (!kv) return true;

  const windowSeconds = 600;
  const limit = 10;
  const emailHash = await hashOpaqueToken(email);
  const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl_login_email:${emailHash}:${currentWindow}`;

  try {
    const currentCountStr = await kv.get(key);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
    if (currentCount >= limit) return false;
    await kv.put(key, (currentCount + 1).toString(), { expirationTtl: windowSeconds * 2 });
    return true;
  } catch {
    return true; // fail-open
  }
}

// ==========================================
// Routes
// ==========================================

authRouter.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = signupSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'invalid_request', details: validation.error.format() }, 400);
  }
  if (!c.env.AUTH_JWT_SECRET) {
    return c.json({ error: 'server_misconfigured' }, 500);
  }

  const { password, firstName, marketingOptIn } = validation.data;
  const email = normalizeEmail(validation.data.email);
  if (password.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: 'weak_password' }, 400);
  }

  const db = drizzle(c.env.DB);

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing && existing.status !== 'deleted') {
    return c.json({ error: 'email_already_exists' }, 409);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const userId = crypto.randomUUID();

  const [newUser] = await db
    .insert(users)
    .values({
      id: userId,
      email,
      passwordHash,
      firstName: firstName || null,
      role: 'student',
      status: 'active',
      marketingOptIn: marketingOptIn ?? false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    })
    .returning();

  c.executionCtx.waitUntil(sendVerificationEmail(c.env as EmailEnvironment, db, newUser));

  const { accessToken, refreshToken } = await issueTokenPair(db, c.env.AUTH_JWT_SECRET, newUser, requestMeta(c));

  return c.json({ accessToken, refreshToken, user: publicUser(newUser) }, 201);
});

authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'invalid_request', details: validation.error.format() }, 400);
  }
  if (!c.env.AUTH_JWT_SECRET) {
    return c.json({ error: 'server_misconfigured' }, 500);
  }

  const email = normalizeEmail(validation.data.email);
  const { password } = validation.data;
  const meta = requestMeta(c);

  const emailAllowed = await checkEmailLoginRateLimit(c.env, email);
  if (!emailAllowed) {
    return c.json({ error: 'too_many_attempts' }, 429);
  }

  const db = drizzle(c.env.DB);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  if (user.status === 'suspended' || user.status === 'deleted') {
    return c.json({ error: 'account_suspended' }, 403);
  }

  if (!user.passwordHash) {
    // Pre-cutover Firebase-only account — lazily migrate via a forced password reset.
    c.executionCtx.waitUntil(sendPasswordResetEmailFor(c.env as EmailEnvironment, db, user, meta.ip, true));
    return c.json({ error: 'password_reset_required', code: 'MIGRATION_RESET_REQUIRED' }, 409);
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  c.executionCtx.waitUntil(db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id)).execute());

  const { accessToken, refreshToken } = await issueTokenPair(db, c.env.AUTH_JWT_SECRET, user, meta);

  return c.json({ accessToken, refreshToken, user: publicUser(user) });
});

authRouter.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = refreshSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'invalid_request' }, 400);
  }
  if (!c.env.AUTH_JWT_SECRET) {
    return c.json({ error: 'server_misconfigured' }, 500);
  }

  const db = drizzle(c.env.DB);
  const tokenHash = await hashOpaqueToken(validation.data.refreshToken);

  const [tokenRow] = await db.select().from(authRefreshTokens).where(eq(authRefreshTokens.tokenHash, tokenHash)).limit(1);

  if (!tokenRow || tokenRow.expiresAt.getTime() < Date.now()) {
    return c.json({ error: 'invalid_token' }, 401);
  }

  if (tokenRow.revokedAt) {
    // Reuse of an already-rotated/revoked refresh token — treat as theft and burn the whole family.
    await db
      .update(authRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(authRefreshTokens.familyId, tokenRow.familyId), isNull(authRefreshTokens.revokedAt)));
    return c.json({ error: 'token_reuse_detected' }, 401);
  }

  const [user] = await db.select().from(users).where(eq(users.id, tokenRow.userId)).limit(1);
  if (!user || user.status === 'suspended' || user.status === 'deleted') {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const meta = requestMeta(c);
  const { accessToken, refreshToken } = await issueTokenPair(db, c.env.AUTH_JWT_SECRET, user, meta, tokenRow.familyId);
  const newTokenHash = await hashOpaqueToken(refreshToken);

  await db
    .update(authRefreshTokens)
    .set({ revokedAt: new Date(), replacedByTokenHash: newTokenHash })
    .where(eq(authRefreshTokens.id, tokenRow.id));

  return c.json({ accessToken, refreshToken });
});

authRouter.post('/logout', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = logoutSchema.safeParse(body);
  if (!validation.success) {
    return c.body(null, 204);
  }

  const db = drizzle(c.env.DB);
  const tokenHash = await hashOpaqueToken(validation.data.refreshToken);
  await db
    .update(authRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(authRefreshTokens.tokenHash, tokenHash), isNull(authRefreshTokens.revokedAt)));

  return c.body(null, 204);
});

authRouter.post('/logout-all', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);
  await revokeAllRefreshTokensForUser(db, user.id);
  return c.body(null, 204);
});

authRouter.post('/request-password-reset', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = requestPasswordResetSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  const email = normalizeEmail(validation.data.email);
  const db = drizzle(c.env.DB);
  const meta = requestMeta(c);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user && user.status !== 'deleted') {
    c.executionCtx.waitUntil(sendPasswordResetEmailFor(c.env as EmailEnvironment, db, user, meta.ip, false));
  }

  // Always 200 — do not reveal whether the email exists.
  return c.json({ success: true });
});

authRouter.post('/reset-password', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = resetPasswordSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  const { token, newPassword } = validation.data;
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: 'weak_password' }, 400);
  }

  const db = drizzle(c.env.DB);
  const tokenHash = await hashOpaqueToken(token);

  const [tokenRow] = await db
    .select()
    .from(authPasswordResetTokens)
    .where(eq(authPasswordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!tokenRow || tokenRow.consumedAt || tokenRow.expiresAt.getTime() < Date.now()) {
    return c.json({ error: 'invalid_or_expired_token' }, 400);
  }

  const [user] = await db.select().from(users).where(eq(users.id, tokenRow.userId)).limit(1);
  if (!user) {
    return c.json({ error: 'invalid_or_expired_token' }, 400);
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  await db.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, user.id));
  await db.update(authPasswordResetTokens).set({ consumedAt: now }).where(eq(authPasswordResetTokens.id, tokenRow.id));
  await revokeAllRefreshTokensForUser(db, user.id);

  c.executionCtx.waitUntil(
    (async () => {
      const template = generatePasswordChangedConfirmationEmail({ name: user.firstName || undefined });
      await sendTransactionalEmail(c.env as EmailEnvironment, {
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    })()
  );

  return c.json({ success: true });
});

authRouter.post('/verify-email', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = verifyEmailSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  const db = drizzle(c.env.DB);
  const tokenHash = await hashOpaqueToken(validation.data.token);

  const [tokenRow] = await db
    .select()
    .from(authEmailVerificationTokens)
    .where(eq(authEmailVerificationTokens.tokenHash, tokenHash))
    .limit(1);

  if (!tokenRow || tokenRow.consumedAt || tokenRow.expiresAt.getTime() < Date.now()) {
    return c.json({ error: 'invalid_or_expired_token' }, 400);
  }

  const now = new Date();
  await db.update(users).set({ emailVerifiedAt: now, updatedAt: now }).where(eq(users.id, tokenRow.userId));
  await db.update(authEmailVerificationTokens).set({ consumedAt: now }).where(eq(authEmailVerificationTokens.id, tokenRow.id));

  return c.json({ success: true });
});

authRouter.post('/resend-verification', requireAuth, async (c) => {
  const user = c.get('user');
  if (user.emailVerifiedAt) {
    return c.json({ success: true, alreadyVerified: true });
  }

  const db = drizzle(c.env.DB);
  await sendVerificationEmail(c.env as EmailEnvironment, db, user);

  return c.json({ success: true });
});

authRouter.post('/change-password', requireAuth, async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const validation = changePasswordSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ error: 'invalid_request' }, 400);
  }

  const { currentPassword, newPassword } = validation.data;
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: 'weak_password' }, 400);
  }
  if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  const db = drizzle(c.env.DB);
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
  await revokeAllRefreshTokensForUser(db, user.id);

  c.executionCtx.waitUntil(
    (async () => {
      const template = generatePasswordChangedConfirmationEmail({ name: user.firstName || undefined });
      await sendTransactionalEmail(c.env as EmailEnvironment, {
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    })()
  );

  return c.json({ success: true });
});
