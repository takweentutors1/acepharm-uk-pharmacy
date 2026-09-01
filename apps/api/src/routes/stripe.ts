import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { subscriptions, users } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import type { AuthContext } from '../middleware/auth';
import { 
  sendTransactionalEmail, 
  generateReceiptEmail, 
  generateCancellationEmail 
} from '../lib/email-service';

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

/**
 * Verifies Stripe webhook HMAC-SHA256 signature using Web Crypto API.
 */
export async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300
): Promise<boolean> {
  try {
    const parts = signatureHeader.split(',');
    let timestamp = '';
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      return false;
    }

    // Verify timestamp within tolerance
    const headerTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    if (isNaN(headerTime) || Math.abs(currentTime - headerTime) > toleranceSeconds) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signatures.some((sig) => sig.toLowerCase() === expectedSignature.toLowerCase());
  } catch (err) {
    console.error('Error verifying Stripe signature:', err);
    return false;
  }
}

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
  const body = await c.req.json<{ 
    plan: 'monthly' | 'yearly'; 
    successUrl?: string; 
    cancelUrl?: string;
    allowPromotionCodes?: boolean;
    promotionCode?: string;
    couponId?: string;
  }>();

  const selectedPlan = body.plan === 'yearly' ? STRIPE_PLANS.YEARLY : STRIPE_PLANS.MONTHLY;
  const stripeSecretKey = c.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not configured in environment');
    return c.json({ error: 'Stripe configuration missing. Please contact support.' }, 500);
  }

  const origin = c.req.header('origin') || 'https://app.acepharmexams.co.uk';
  const successUrl = body.successUrl || `${origin}/session/new?upgraded=true`;
  const cancelUrl = body.cancelUrl || `${origin}/pricing?canceled=true`;

  // Look up or link existing Stripe customer ID
  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('payment_method_types[0]', 'card');
  params.append('line_items[0][price]', selectedPlan.priceId);
  params.append('line_items[0][quantity]', '1');
  params.append('client_reference_id', user.id);
  params.append('metadata[userId]', user.id);
  params.append('metadata[plan]', selectedPlan.id);
  params.append('metadata[priceId]', selectedPlan.priceId);
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);
  params.append('customer_email', user.email);

  // Enable customer promotion / discount codes in Stripe Checkout
  // Note: In Stripe API, allow_promotion_codes cannot be used simultaneously with discounts[]
  if (body.promotionCode) {
    params.append('discounts[0][promotion_code]', body.promotionCode);
  } else if (body.couponId) {
    params.append('discounts[0][coupon]', body.couponId);
  } else {
    // Default to allowing user-entered promotion code field on the Stripe-hosted checkout page
    const allowCodes = body.allowPromotionCodes !== undefined ? body.allowPromotionCodes : true;
    if (allowCodes) {
      params.append('allow_promotion_codes', 'true');
    }
  }

  if (existingSub?.stripeCustomerId) {
    params.append('customer', existingSub.stripeCustomerId);
  }

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errorText = await stripeRes.text();
      console.error('Stripe Checkout creation failed:', errorText);
      return c.json({ error: 'Failed to create Stripe Checkout session', details: errorText }, 502);
    }

    const sessionData = await stripeRes.json<{ id: string; url: string }>();

    return c.json({
      sessionId: sessionData.id,
      url: sessionData.url,
      plan: selectedPlan.id,
      amountPence: selectedPlan.unitAmountPence,
      currency: selectedPlan.currency,
    });
  } catch (err: any) {
    console.error('Stripe API network error:', err);
    return c.json({ error: 'Payment gateway unavailable. Please try again.' }, 502);
  }
});

// 3. Create Stripe Customer Billing Portal Session
stripeRoutes.post('/customer-portal', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);
  const origin = c.req.header('origin') || 'https://app.acepharmexams.co.uk';
  const stripeSecretKey = c.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return c.json({ error: 'Stripe configuration missing.' }, 500);
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    return c.json({ error: 'No active Stripe billing customer record found.' }, 404);
  }

  const params = new URLSearchParams();
  params.append('customer', sub.stripeCustomerId);
  params.append('return_url', `${origin}/account`);

  try {
    const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!portalRes.ok) {
      const errText = await portalRes.text();
      console.error('Stripe Customer Portal error:', errText);
      return c.json({ error: 'Failed to create Customer Portal session' }, 502);
    }

    const portalData = await portalRes.json<{ url: string }>();
    return c.json({
      url: portalData.url,
      returnUrl: `${origin}/account`,
    });
  } catch (err: any) {
    return c.json({ error: 'Unable to open billing portal.' }, 502);
  }
});

// 4. In-App Cancellation Endpoint (Non-negotiable: learner keeps access until paid period ends)
stripeRoutes.post('/cancel', requireAuth, async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB);
  const body = await c.req.json<{ reason: string; feedback?: string }>();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  const now = new Date();
  const periodEnd = sub?.currentPeriodEnd || new Date(Date.now() + 14 * 86400000);

  if (sub) {
    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        canceledAt: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, sub.id));
  }

  // Trigger Cancellation Confirmation Email via Hostinger SMTP
  const userEmail = user.email || 'student@acepharm.co.uk';
  const learnerDisplayName = user.firstName || 'Learner';
  const cancelEmail = generateCancellationEmail({
    learnerName: learnerDisplayName,
    accessUntilFormatted: periodEnd.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  });

  await sendTransactionalEmail(c.env, {
    to: userEmail,
    subject: cancelEmail.subject,
    html: cancelEmail.html,
  });

  return c.json({
    success: true,
    message: 'Subscription set to cancel at period end',
    accessUntil: periodEnd.toISOString(),
    cancelAtPeriodEnd: true,
    reason: body.reason,
  });
});

// 5. Webhook handler with signature verification & idempotent event handling
// Handles all 5 required events:
// 1. checkout.session.completed
// 2. customer.subscription.created
// 3. customer.subscription.updated
// 4. customer.subscription.deleted
// 5. invoice.payment_failed
export async function handleStripeWebhook(db: any, event: any, env?: any) {
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

        // Dispatch Stripe Pro Receipt Email if customer email is present and env is provided
        const customerEmail = dataObject.customer_details?.email || dataObject.customer_email;
        if (customerEmail && env) {
          try {
            const planName = plan === 'yearly_pro' ? 'AcePharm Yearly Pro' : 'AcePharm Monthly Pro';
            const amountFormatted = plan === 'yearly_pro' ? '£49.99' : '£4.99';
            const receipt = generateReceiptEmail({
              learnerName: dataObject.customer_details?.name || 'Learner',
              planName,
              amountFormatted,
              dateFormatted: now.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              invoiceId: dataObject.invoice || dataObject.id,
            });

            await sendTransactionalEmail(env, {
              to: customerEmail,
              subject: receipt.subject,
              html: receipt.html,
              text: receipt.text,
            });
          } catch (emailErr) {
            console.warn('Could not dispatch Stripe checkout receipt email:', emailErr);
          }
        }
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
  const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
  const db = drizzle(c.env.DB);

  let rawBody = '';
  try {
    rawBody = await c.req.text();
  } catch {
    return c.json({ error: 'Invalid payload' }, 400);
  }

  // Validate Stripe HMAC signature if secret is configured
  if (webhookSecret) {
    if (!signature) {
      return c.json({ error: 'Unauthorized: Missing stripe-signature header' }, 401);
    }
    const isValid = await verifyStripeSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return c.json({ error: 'Unauthorized: Invalid Stripe webhook signature' }, 401);
    }
  } else {
    console.warn('STRIPE_WEBHOOK_SECRET not configured; webhook signature validation skipped in development/test');
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: 'Webhook payload is not valid JSON' }, 400);
  }

  try {
    const res = await handleStripeWebhook(db, event, c.env);
    return c.json(res);
  } catch (err: any) {
    return c.json({ error: err?.message || 'Webhook failed' }, 400);
  }
});
