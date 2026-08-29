import { describe, it, expect } from 'vitest';
import { app } from './index';

describe('Role-Based Access Control (RBAC) Middleware', () => {
  it('rejects unauthenticated requests to protected admin routes', async () => {
    const res = await app.request('/admin/overview');
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('Unauthorized');
  });

  it('rejects unauthorized roles from clinical review queue', async () => {
    const res = await app.request('/admin/content/review-queue', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid_mock_token',
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});
