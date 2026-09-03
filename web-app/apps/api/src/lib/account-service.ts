import { eq } from 'drizzle-orm';
import { subscriptions, users } from '../db/schema';

/**
 * Permanently deletes a user account (GDPR right to erasure / Apple
 * Guideline 5.1.1(v)). Cancels any live Stripe subscription immediately —
 * a deleted account should never keep being billed — then hard-deletes
 * the `users` row, which cascades via FK constraints (D1 has
 * `foreign_keys` enabled) to every user-owned table: sessions, question
 * attempts, bookmarks, notes, Ace threads, subscriptions, etc.
 */
export async function deleteUserAccount(
  db: any,
  userId: string,
  stripeSecretKey?: string
): Promise<void> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (sub?.stripeSubscriptionId && stripeSecretKey) {
    try {
      await fetch(`https://api.stripe.com/v1/subscriptions/${sub.stripeSubscriptionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });
    } catch (err) {
      console.error('Failed to cancel Stripe subscription during account deletion:', err);
    }
  }

  await db.delete(users).where(eq(users.id, userId));
}
