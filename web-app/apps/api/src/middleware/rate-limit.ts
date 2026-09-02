import type { MiddlewareHandler } from 'hono';
import type { AuthContext } from './auth';

export interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyPrefix?: string;
}

/**
 * App-layer KV-backed sliding/fixed window rate limiter.
 * Protects auth endpoints, Ask Ace AI tutor, calculation solvers, and public APIs.
 */
export function rateLimiter(options: RateLimitOptions): MiddlewareHandler<AuthContext> {
  const { limit, windowSeconds, keyPrefix = 'rl' } = options;

  return async (c, next) => {
    const kv = c.env.RATE_LIMIT;
    if (!kv) {
      // If KV not bound in test/dev, continue safely
      return next();
    }

    const user = c.get('user');
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
    const identifier = user ? `usr_${user.id}` : `ip_${ip}`;

    const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);
    const key = `${keyPrefix}:${identifier}:${currentWindow}`;

    try {
      const currentCountStr = await kv.get(key);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

      if (currentCount >= limit) {
        c.header('Retry-After', windowSeconds.toString());
        c.header('X-RateLimit-Limit', limit.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', ((currentWindow + 1) * windowSeconds).toString());

        return c.json({
          error: 'Too many requests. Rate limit exceeded. Please try again later.',
          limit,
          windowSeconds,
        }, 429);
      }

      // Increment count and set expiration
      await kv.put(key, (currentCount + 1).toString(), {
        expirationTtl: windowSeconds * 2,
      });

      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', Math.max(0, limit - (currentCount + 1)).toString());

      return next();
    } catch (err) {
      console.error('Rate limiting error:', err);
      // Fail-open for graceful degradation
      return next();
    }
  };
}
