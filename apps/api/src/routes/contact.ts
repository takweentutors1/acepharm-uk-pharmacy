import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { supportTickets } from '../db/schema';
import { sendTransactionalEmail } from '../lib/email-service';
import type { AuthContext } from '../middleware/auth';

export const contactRouter = new Hono<AuthContext>();

contactRouter.post('/submit', async (c) => {
  const body = await c.req.json<{
    name: string;
    email: string;
    category: string;
    message: string;
  }>();

  if (!body.name || !body.email || !body.message) {
    return c.json({ error: 'Name, email and message are required.' }, 400);
  }

  const db = drizzle(c.env.DB);
  const ticketId = `ticket-${crypto.randomUUID()}`;
  const now = new Date();

  // 1. Insert into D1 support_tickets table
  try {
    await db.insert(supportTickets).values({
      id: ticketId,
      userId: null,
      category: body.category || 'General Support',
      subject: `[Contact Form] ${body.category || 'Inquiry'}: ${body.name}`,
      description: `Sender: ${body.name} (${body.email})\nCategory: ${body.category}\n\nMessage:\n${body.message}`,
      status: 'open',
      priority: 'medium',
      createdAt: now,
      updatedAt: now,
    });
  } catch (dbErr) {
    console.warn('Could not record support ticket to D1 database:', dbErr);
  }

  // 2. Dispatch confirmation email to sender if configured
  try {
    const resendKey = (c.env as any).RESEND_API_KEY || 're_mock_key';
    await sendTransactionalEmail(resendKey, {
      to: body.email,
      subject: 'We received your message — AcePharm Support',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <h2 style="color: #4f46e5;">Thank you for contacting AcePharm</h2>
          <p>Hi ${body.name},</p>
          <p>We have received your message regarding <strong>${body.category || 'Support'}</strong>. A member of our clinical support team will review your inquiry and get back to you shortly.</p>
          <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #475569;">"${body.message}"</p>
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
