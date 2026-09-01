import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { supportTickets } from '../db/schema';
import { sendTransactionalEmail } from '../lib/email-service';
import type { AuthContext } from '../middleware/auth';

export const contactRouter = new Hono<AuthContext>();

contactRouter.post('/submit', async (c) => {
  const body = await c.req.json<{
    name?: string;
    email?: string;
    category?: string;
    message?: string;
  }>();

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const category = body.category?.trim();
  const message = body.message?.trim();

  if (!name || !email || !message) {
    return c.json({ error: 'Name, email, and message are required.' }, 400);
  }

  // Length limits to prevent payload abuse / DB bloat
  if (name.length > 100) {
    return c.json({ error: 'Name exceeds maximum length of 100 characters.' }, 400);
  }
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'A valid email address is required.' }, 400);
  }
  if (message.length > 5000) {
    return c.json({ error: 'Message exceeds maximum length of 5000 characters.' }, 400);
  }

  const db = drizzle(c.env.DB);
  const ticketId = `ticket-${crypto.randomUUID()}`;
  const now = new Date();

  // 1. Insert into D1 support_tickets table
  try {
    // Map arbitrary category strings to the schema enum: 'billing' | 'technical' | 'clinical_content' | 'account' | 'general'
    const mapCategory = (cat?: string): 'billing' | 'technical' | 'clinical_content' | 'account' | 'general' => {
      const lower = (cat || '').toLowerCase();
      if (lower.includes('bill') || lower.includes('subscript')) return 'billing';
      if (lower.includes('tech') || lower.includes('erratum') || lower.includes('bug')) return 'technical';
      if (lower.includes('clinic') || lower.includes('content') || lower.includes('question')) return 'clinical_content';
      if (lower.includes('account')) return 'account';
      return 'general';
    };

    await db.insert(supportTickets).values({
      id: ticketId,
      userId: null,
      email: email,
      category: mapCategory(category),
      subject: `[Contact Form] ${category || 'Inquiry'}: ${name}`,
      message: `Sender: ${name} (${email})\nCategory: ${category || 'General'}\n\nMessage:\n${message}`,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    });
  } catch (dbErr) {
    console.warn('Could not record support ticket to D1 database:', dbErr);
  }

  // 2. Dispatch confirmation email to sender if configured
  try {
    const resendKey = c.env.RESEND_API_KEY || 're_mock_key';
    const sanitizedName = name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sanitizedMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    await sendTransactionalEmail(resendKey, {
      to: email,
      subject: 'We received your message — AcePharm Support',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <h2 style="color: #4f46e5;">Thank you for contacting AcePharm</h2>
          <p>Hi ${sanitizedName},</p>
          <p>We have received your message regarding <strong>${category || 'Support'}</strong>. A member of our clinical support team will review your inquiry and get back to you shortly.</p>
          <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #475569; white-space: pre-wrap;">"${sanitizedMessage}"</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">AcePharm UK &bull; Reference ID: ${ticketId}</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.warn('Could not dispatch contact confirmation email:', emailErr);
  }

  return c.json({
    status: 'ok',
    ticketId,
    message: 'Your message has been received. Our team will get back to you shortly.',
  });
});

