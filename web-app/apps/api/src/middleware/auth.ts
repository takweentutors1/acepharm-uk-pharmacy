import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Context, Next } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users, type User } from '../db/schema';
import type { Bindings } from '../index';

const FIREBASE_PROJECT_ID = 'acepharm-uk';
const JWKS_URI = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);

// Cache JWKS client across Worker requests
const JWKS = createRemoteJWKSet(JWKS_URI, {
  cacheMaxAge: 3600000, // 1 hour
});

export interface FirebaseTokenPayload {
  uid: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  [key: string]: any;
}

export type AuthContext = {
  Bindings: Bindings;
  Variables: {
    user: typeof users.$inferSelect;
    firebaseUid: string;
    tokenPayload: FirebaseTokenPayload;
  };
};

/**
 * Verifies Firebase ID Token and resolves or provisions the user in Cloudflare D1.
 */
export async function requireAuth(c: Context<AuthContext>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
  }

  const idToken = authHeader.substring(7).trim();
  if (!idToken) {
    return c.json({ error: 'Unauthorized: Empty token' }, 401);
  }

  let payload: FirebaseTokenPayload;
  try {
    const { payload: verifiedPayload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });
    payload = verifiedPayload as unknown as FirebaseTokenPayload;
  } catch (err: any) {
    return c.json({ error: 'Unauthorized: Invalid or expired Firebase ID token' }, 401);
  }

  const firebaseUid = payload.sub || payload.uid;
  if (!firebaseUid) {
    return c.json({ error: 'Unauthorized: Invalid token payload' }, 401);
  }

  const db = drizzle(c.env.DB);

  // 1. Resolve user by firebaseUid
  let [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.firebaseUid, firebaseUid))
    .limit(1);

  if (!existingUser) {
    // First login — Provision new user in D1
    const email = (payload.email || `${firebaseUid}@acepharm.local`).toLowerCase().trim();
    const now = new Date();
    const newUserId = crypto.randomUUID();

    const [createdUser] = await db
      .insert(users)
      .values({
        id: newUserId,
        firebaseUid,
        email,
        emailVerifiedAt: payload.email_verified ? now : null,
        firstName: payload.name ? payload.name.split(' ')[0] : null,
        role: 'student',
        status: 'active',
        timezone: 'Europe/London',
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firebaseUid,
          lastLoginAt: now,
          updatedAt: now,
        },
      })
      .returning();

    existingUser = createdUser;
  } else {
    // Update lastLoginAt asynchronously without blocking
    c.executionCtx.waitUntil(
      db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .execute()
    );
  }

  if (existingUser.status === 'suspended' || existingUser.status === 'deleted') {
    return c.json({ error: 'Forbidden: Account is suspended or deactivated' }, 403);
  }

  c.set('user', existingUser);
  c.set('firebaseUid', firebaseUid);
  c.set('tokenPayload', payload);

  await next();
}
