import { SignJWT, jwtVerify, decodeProtectedHeader } from 'jose';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60;
export const PASSWORD_RESET_TTL_SECONDS = 60 * 60;

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: string;
  status: string;
}

/** Issues a short-lived HS256 access token for the custom auth system. */
export async function issueAccessToken(
  user: { id: string; email: string; role: string; status: string },
  secret: string
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ email: user.email, role: user.role, status: user.status })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .setJti(crypto.randomUUID())
    .sign(key);
}

/** Verifies an HS256 access token issued by {@link issueAccessToken}. Throws on invalid/expired tokens. */
export async function verifyAccessToken(token: string, secret: string): Promise<AccessTokenClaims> {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  return payload as unknown as AccessTokenClaims;
}

/** True if `token`'s header advertises the legacy Firebase RS256 algorithm, used to fork `requireAuth` during the migration window. */
export function isLegacyFirebaseToken(token: string): boolean {
  try {
    return decodeProtectedHeader(token).alg === 'RS256';
  } catch {
    return false;
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Generates a random 32-byte opaque token (refresh / verification / reset), base64url-encoded for use in URLs/headers. */
export function generateOpaqueToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** Hashes an opaque token for storage — only the hash is ever persisted, never the raw value. */
export async function hashOpaqueToken(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return toHex(new Uint8Array(digest));
}
