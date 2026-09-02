import { describe, it, expect } from 'vitest';
import { app } from './index';

describe('Security Headers & Rate Limiting Verification', () => {
  it('attaches comprehensive CSP, Strict-Transport-Security, and nosniff headers to all responses', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    // 1. Content-Security-Policy
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://js.stripe.com');
    expect(csp).toContain('https://*.firebaseapp.com');

    // 2. Strict Transport Security (HSTS)
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload');

    // 3. X-Content-Type-Options & Frame Options
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('enforces rate limiting on Ace AI and returns 429 when threshold exceeded', async () => {
    // Test that the mock KV rate limiter correctly rejects requests when counter reaches 60 req/hr
    const mockKv = {
      store: new Map<string, string>(),
      async get(k: string) { return this.store.get(k) || null; },
      async put(k: string, v: string) { this.store.set(k, v); },
    };

    // Simulate 60 previous requests in the current hour window
    const now = new Date();
    const rateLimitKey = `rl_ace:usr_test:${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
    mockKv.store.set(rateLimitKey, '60');

    const res = await app.request('/api/v1/ace/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'usr_test',
        prompt: 'Explain digoxin toxicity in renal impairment',
        contextType: 'general',
      }),
    }, {
      RATE_LIMIT: mockKv as any,
    });

    expect(res.status).toBe(429);
    const data = await res.json() as { error: string };
    expect(data.error).toContain('Fair-use rate limit exceeded');
  });
});
