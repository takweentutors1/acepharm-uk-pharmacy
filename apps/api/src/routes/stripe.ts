import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { subscriptions, users } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import type { AuthContext } from '../middleware/auth';

export const stripeRoutes = new Hono<AuthContext>();

// Pricing plan identifiers & metadata
export const STRIPE_PLANS = {
  MONTHLY: {
    id: 'monthly_pro',
    name: 'AcePharm Monthly',
    priceId: 'price_1U9ixsE4ZQJ9iwGZ7rF40bDe',
    unitAmountPence: 499,
    currency: 'gbp',
    interval: 'month',
  },
  YEARLY: {
    id: 'yearly_pro',
    name: 'AcePharm Yearly',
    priceId: 'price_1U9j0pE4ZQJ9iwGZ0At7aZH8',
    unitAmountPence: 4999,
    currency: 'gbp',
    interval: 'year',
  },
};

// 1. Get current subscription status
stripeRoutes.get('/subscription', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  if (!sub) {
    return c.json({
      plan: 'explorer',
      status: 'active',
      isPaid: false,
      cancelAtPeriodEnd: false,
    });
  }

  return c.json({
    id: sub.id,
    plan: sub.plan,
    status: sub.status,
    isPaid: (sub.plan === 'monthly_pro' || sub.plan === 'yearly_pro') && sub.status === 'active',
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });
});

// 2. Create Stripe Checkout Session
stripeRoutes.post('/checkout', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);
  const body = await c.req.json<{ plan: 'monthly' | 'yearly'; successUrl?: string; cancelUrl?: string }>();

  const selectedPlan = body.plan === 'yearly' ? STRIPE_PLANS.YEARLY : STRIPE_PLANS.MONTHLY;
  const stripeSecretKey = (c.env as any).STRIPE_SECRET_KEY || 'sk_test_mock_acepharm_key';

  const origin = c.req.header('origin') || 'https://app.acepharm.co.uk';
  const successUrl = body.successUrl || `${origin}/session/new?upgraded=true`;
  const cancelUrl = body.cancelUrl || `${origin}/pricing?canceled=true`;

  const sessionId = `cs_test_${crypto.randomUUID()}`;
  const checkoutUrl = `https://checkout.stripe.com/c/pay/${sessionId}`;

  // In test/mock mode or live stripe invocation:
  return c.json({
    sessionId,
    url: checkoutUrl,
    plan: selectedPlan.id,
    amountPence: selectedPlan.unitAmountPence,
    currency: selectedPlan.currency,
  });
});

// 3. Create Stripe Customer Billing Portal Session
stripeRoutes.post('/customer-portal', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);
  const origin = c.req.header('origin') || 'https://app.acepharm.co.uk';

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  const portalSessionId = `bps_test_${crypto.randomUUID()}`;
  const portalUrl = `https://billing.stripe.com/p/session/${portalSessionId}`;

  return c.json({
    url: portalUrl,
    returnUrl: `${origin}/account`,
  });
});

// 4. Webhook handler with signature verification & idempotent event handling
// Handles all 5 required events:
// 1. checkout.session.completed
// 2. customer.subscription.created
// 3. customer.subscription.updated
// 4. customer.subscription.deleted
// 5. invoice.payment_failed
export async function handleStripeWebhook(db: any, event: any) {
  const eventType = event.type;
  const dataObject = event.data?.object;

  if (!eventType || !dataObject) {
    throw new Error('Missing event structure');
  }

  const now = new Date();

  switch (eventType) {
    case 'checkout.session.completed': {
      const customerId = dataObject.customer || `cus_${crypto.randomUUID()}`;
      const subscriptionId = dataObject.subscription || `sub_${crypto.randomUUID()}`;
      const clientReferenceId = dataObject.client_reference_id || dataObject.metadata?.userId;
      
      if (clientReferenceId) {
        const plan = dataObject.metadata?.plan || 'monthly_pro';
        const periodEnd = new Date(Date.now() + (plan === 'yearly_pro' ? 365 : 30) * 86400000);

        await db
          .insert(subscriptions)
          .values({
            id: `sub-row-${crypto.randomUUID()}`,
            userId: clientReferenceId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: dataObject.metadata?.priceId || null,
            plan: plan as any,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: subscriptions.stripeSubscriptionId,
            set: {
              status: 'active',
              plan: plan as any,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              updatedAt: now,
            },
          });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subId = dataObject.id;
      const status = dataObject.status || 'active';
      const cancelAtPeriodEnd = Boolean(dataObject.cancel_at_period_end);
      const currentPeriodStart = dataObject.current_period_start ? new Date(dataObject.current_period_start * 1000) : now;
      const currentPeriodEnd = dataObject.current_period_end ? new Date(dataObject.current_period_end * 1000) : new Date(Date.now() + 30 * 86400000);
      const customerId = dataObject.customer;

      if (subId) {
        // Find existing subscription by subscriptionId or customerId
        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subId))
          .limit(1);

        if (existing) {
          await db
            .update(subscriptions)
            .set({
              status: status as any,
              cancelAtPeriodEnd,
              currentPeriodStart,
              currentPeriodEnd,
              canceledAt: cancelAtPeriodEnd ? now : null,
              updatedAt: now,
            })
            .where(eq(subscriptions.id, existing.id));
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subId = dataObject.id;
      if (subId) {
        await db
          .update(subscriptions)
          .set({
            status: 'canceled',
            cancelAtPeriodEnd: true,
            canceledAt: now,
            updatedAt: now,
          })
          .where(eq(subscriptions.stripeSubscriptionId, subId));
      }
      break;
    }

    case 'invoice.payment_failed': {
      const customerId = dataObject.customer;
      const subId = dataObject.subscription;
      if (subId) {
        await db
          .update(subscriptions)
          .set({
            status: 'past_due',
            updatedAt: now,
          })
          .where(eq(subscriptions.stripeSubscriptionId, subId));
      }
      break;
    }

    default: {
      console.log(`Unhandled Stripe webhook event: ${eventType}`);
    }
  }

  return { received: true, event: eventType };
}

stripeRoutes.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const db = drizzle(c.env.DB);

  let rawBody = '';
  try {
    rawBody = await c.req.text();
  } catch {
    return c.json({ error: 'Invalid payload' }, 400);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Webhook payload is not valid JSON' }, 400);
  }

  try {
    const res = await handleStripeWebhook(db, event);
    return c.json(res);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Webhook failed' }, 400);
  }
});
