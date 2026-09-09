import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Context, Next } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import type { Bindings } from '../index';
import { verifyAccessToken, isLegacyFirebaseToken } from '../lib/tokens';

const FIREBASE_PROJECT_ID = 'acepharm-uk';
const JWKS_URI = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);

// Cache JWKS client across Worker requests. Only reached during the migration window (see isLegacyFirebaseToken below).
const JWKS = createRemoteJWKSet(JWKS_URI, {
  cacheMaxAge: 3600000, // 1 hour
});

export type AuthContext = {
  Bindings: Bindings;
  Variables: {
    user: typeof users.$inferSelect;
  };
};

/**
 * Verifies a legacy Firebase RS256 ID token and resolves the D1 user by firebaseUid.
 * Transition-only: lets sessions issued before the custom-auth cutover keep working
 * until they naturally expire. Remove once web + mobile have both fully cut over.
 */
async function verifyFirebaseToken(c: Context<AuthContext>, idToken: string) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
    algorithms: ['RS256'],
  });

  const firebaseUid = (payload.sub as string | undefined) || (payload.uid as string | undefined);
  if (!firebaseUid) return null;

  const db = drizzle(c.env.DB);
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.firebaseUid, firebaseUid))
    .limit(1);

  return existingUser ?? null;
}

/**
 * Verifies the custom auth system's HS256 access token and resolves the D1 user by id.
 */
async function verifyCustomToken(c: Context<AuthContext>, token: string) {
  if (!c.env.AUTH_JWT_SECRET) {
    throw new Error('AUTH_JWT_SECRET is not configured');
  }
  const claims = await verifyAccessToken(token, c.env.AUTH_JWT_SECRET);

  const db = drizzle(c.env.DB);
  const [existingUser] = await db.select().from(users).where(eq(users.id, claims.sub)).limit(1);
  return existingUser ?? null;
}

export async function requireAuth(c: Context<AuthContext>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return c.json({ error: 'Unauthorized: Empty token' }, 401);
  }

  let user: typeof users.$inferSelect | null;
  try {
    user = isLegacyFirebaseToken(token)
      ? await verifyFirebaseToken(c, token)
      : await verifyCustomToken(c, token);
  } catch {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401);
  }

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (user.status === 'suspended' || user.status === 'deleted') {
    return c.json({ error: 'Forbidden: Account is suspended or deactivated' }, 403);
  }

  const db = drizzle(c.env.DB);
  c.executionCtx.waitUntil(
    db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id)).execute()
  );

  c.set('user', user);
  await next();
}
