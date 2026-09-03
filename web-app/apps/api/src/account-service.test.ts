import { describe, it, expect, vi, afterEach } from 'vitest';
import { deleteUserAccount } from './lib/account-service';

describe('deleteUserAccount (In-App Account Deletion Flow)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cancels a live Stripe subscription before deleting the user row', async () => {
    let deletedUserId: string | null = null;
    const fetchCalls: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      fetchCalls.push({ url, init });
      return { ok: true } as Response;
    });

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ stripeSubscriptionId: 'sub_live_123' }],
          }),
        }),
      }),
      delete: () => ({
        where: async () => {
          deletedUserId = 'user-1';
          return [];
        },
      }),
    };

    await deleteUserAccount(mockDb, 'user-1', 'sk_test_secret');

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe('https://api.stripe.com/v1/subscriptions/sub_live_123');
    expect(fetchCalls[0].init.method).toBe('DELETE');
    expect(deletedUserId).toBe('user-1');
  });

  it('deletes the user row even when there is no Stripe subscription', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    let deleteWasCalled = false;

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      }),
      delete: () => ({
        where: async () => {
          deleteWasCalled = true;
          return [];
        },
      }),
    };

    await deleteUserAccount(mockDb, 'user-2', 'sk_test_secret');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(deleteWasCalled).toBe(true);
  });

  it('still deletes the user row if the Stripe cancellation call throws', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('network down');
    });
    let deleteWasCalled = false;

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ stripeSubscriptionId: 'sub_live_456' }],
          }),
        }),
      }),
      delete: () => ({
        where: async () => {
          deleteWasCalled = true;
          return [];
        },
      }),
    };

    await expect(deleteUserAccount(mockDb, 'user-3', 'sk_test_secret')).resolves.toBeUndefined();
    expect(deleteWasCalled).toBe(true);
  });
});
