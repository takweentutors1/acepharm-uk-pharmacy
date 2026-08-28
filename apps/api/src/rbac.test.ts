import { describe, it, expect, vi } from 'vitest';
import app from './index';

describe('RBAC & Auth Middleware on /admin', () => {
  it('returns 401 Unauthorized when no token is supplied to /admin/overview', async () => {
    const res = await app.request('/admin/overview', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  it('returns 401 Unauthorized when invalid token is supplied to /api/v1/admin/overview', async () => {
    const res = await app.request('/api/v1/admin/overview', {
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
