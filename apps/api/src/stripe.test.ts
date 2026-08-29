import { describe, it, expect } from 'vitest';
import { STRIPE_PLANS, handleStripeWebhook } from './routes/stripe';

describe('Stripe Checkout, Customer Portal & 5-Event Webhook (Milestone 6, Step 5)', () => {
  it('exposes defined monthly and yearly products conforming to £4.99 and £49.99 pricing', () => {
    expect(STRIPE_PLANS.MONTHLY.unitAmountPence).toBe(499);
    expect(STRIPE_PLANS.MONTHLY.currency).toBe('gbp');
    expect(STRIPE_PLANS.YEARLY.unitAmountPence).toBe(4999);
    expect(STRIPE_PLANS.YEARLY.currency).toBe('gbp');
  });

  it('handles checkout.session.completed webhook idempotently', async () => {
    let insertedSub: any = null;

    const mockDb: any = {
      insert: () => ({
        values: (val: any) => ({
          onConflictDoUpdate: async () => {
            insertedSub = val;
            return [];
          },
        }),
      }),
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: async () => [],
        }),
      }),
    };

    const webhookPayload = {
      id: 'evt_test_checkout_01',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test_user_01',
          subscription: 'sub_test_123',
          client_reference_id: 'user-001',
          metadata: {
            userId: 'user-001',
            plan: 'monthly_pro',
            priceId: 'price_acepharm_monthly_499',
          },
        },
      },
    };

    const res = await handleStripeWebhook(mockDb, webhookPayload);
    expect(res.received).toBe(true);
    expect(res.event).toBe('checkout.session.completed');
    expect(insertedSub).not.toBeNull();
    expect(insertedSub.userId).toBe('user-001');
    expect(insertedSub.plan).toBe('monthly_pro');
    expect(insertedSub.status).toBe('active');
  });

  it('handles customer.subscription.updated webhook idempotently', async () => {
    let updatedValues: any = null;

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [{ id: 'sub-row-1', stripeSubscriptionId: 'sub_test_123' }],
          }),
        }),
      }),
      update: () => ({
        set: (vals: any) => {
          updatedValues = vals;
          return {
            where: async () => [],
          };
        },
      }),
    };

    const webhookPayload = {
      id: 'evt_test_sub_update',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_user_01',
          status: 'active',
          cancel_at_period_end: true,
          current_period_start: 1700000000,
          current_period_end: 1702592000,
        },
      },
    };

    const res = await handleStripeWebhook(mockDb, webhookPayload);
    expect(res.received).toBe(true);
    expect(updatedValues).not.toBeNull();
    expect(updatedValues.cancelAtPeriodEnd).toBe(true);
  });

  it('handles customer.subscription.deleted webhook', async () => {
    let updatedValues: any = null;

    const mockDb: any = {
      update: () => ({
        set: (vals: any) => {
          updatedValues = vals;
          return {
            where: async () => [],
          };
        },
      }),
    };

    const webhookPayload = {
      id: 'evt_test_sub_deleted',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_123',
        },
      },
    };

    const res = await handleStripeWebhook(mockDb, webhookPayload);
    expect(res.received).toBe(true);
    expect(updatedValues).not.toBeNull();
    expect(updatedValues.status).toBe('canceled');
  });

  it('handles invoice.payment_failed webhook by marking past_due', async () => {
    let updatedValues: any = null;

    const mockDb: any = {
      update: () => ({
        set: (vals: any) => {
          updatedValues = vals;
          return {
            where: async () => [],
          };
        },
      }),
    };

    const webhookPayload = {
      id: 'evt_test_payment_failed',
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_test_user_01',
          subscription: 'sub_test_123',
        },
      },
    };

    const res = await handleStripeWebhook(mockDb, webhookPayload);
    expect(res.received).toBe(true);
    expect(updatedValues).not.toBeNull();
    expect(updatedValues.status).toBe('past_due');
  });
});
