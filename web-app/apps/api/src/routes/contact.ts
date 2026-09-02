import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { supportTickets } from '../db/schema';
import { 
  sendTransactionalEmail, 
  generateSupportTicketReplyEmail 
} from '../lib/email-service';
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

  // Rate Limiting on Contact Form Submissions (Anti-bot / Anti-spam)
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'anon_client';
  if (c.env.RATE_LIMIT) {
    try {
      const rateLimitKey = `contact_rl:${clientIp}`;
      const currentCountStr = await c.env.RATE_LIMIT.get(rateLimitKey);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
      if (currentCount >= 5) {
        return c.json({ error: 'Too many contact inquiries submitted. Please wait a few minutes before trying again.' }, 429);
      }
      await c.env.RATE_LIMIT.put(rateLimitKey, (currentCount + 1).toString(), { expirationTtl: 600 }); // 10 minutes window
    } catch (rlErr) {
      console.warn('Rate limiter error for contact form:', rlErr);
    }
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

  // 2. Dispatch confirmation email to sender and notify Hostinger inbox
  try {
    const sanitizedName = name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sanitizedCategory = (category || 'Support').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sanitizedMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const adminInbox = c.env.SUPPORT_INBOX_EMAIL || c.env.SMTP_USER || 'info@acepharmexams.co.uk';

    // A. Auto-reply confirmation to the user
    await sendTransactionalEmail(c.env, {
      to: email,
      replyTo: adminInbox,
      subject: 'We received your message — AcePharm Support',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <h2 style="color: #4f46e5;">Thank you for contacting AcePharm</h2>
          <p>Hi ${sanitizedName},</p>
          <p>We have received your message regarding <strong>${sanitizedCategory}</strong>. A member of our clinical support team will review your inquiry and get back to you shortly.</p>
          <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #475569; white-space: pre-wrap;">"${sanitizedMessage}"</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px;">AcePharm UK &bull; Reference ID: ${ticketId}</p>
        </div>
      `,
    });

    // B. Direct notification to AcePharm Hostinger inbox with user's Reply-To header
    await sendTransactionalEmail(c.env, {
      to: adminInbox,
      replyTo: email,
      subject: `[Contact Form] ${sanitizedCategory}: ${sanitizedName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
          <h2 style="color: #4f46e5;">New AcePharm Inquiry Received</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #64748b; width: 100px;"><strong>From:</strong></td><td>${sanitizedName} (&lt;<a href="mailto:${email}">${email}</a>&gt;)</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Category:</strong></td><td>${sanitizedCategory}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Ticket ID:</strong></td><td><code>${ticketId}</code></td></tr>
          </table>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #1e293b; white-space: pre-wrap;">${sanitizedMessage}</p>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Hit <strong>Reply</strong> to respond directly to ${email}.</p>
        </div>
      `,
      text: `New Contact Form Inquiry:\nFrom: ${name} (${email})\nCategory: ${category || 'General'}\nTicket ID: ${ticketId}\n\nMessage:\n${message}`,
    });
  } catch (emailErr) {
    console.warn('Could not dispatch contact confirmation or admin alert email:', emailErr);
  }

  return c.json({
    status: 'ok',
    ticketId,
    message: 'Your message has been received. Our team will get back to you shortly.',
  });
});

/**
 * Admin Ticket Response Endpoint (Milestone 8)
 * Dispatches branded update email to the student with reference ID and direct reply loop.
 */
contactRouter.post('/ticket/reply', async (c) => {
  const body = await c.req.json<{
    studentEmail: string;
    studentName?: string;
    ticketId: string;
    subject: string;
    replyMessage: string;
    responderName?: string;
    isResolved?: boolean;
  }>();

  if (!body.studentEmail || !body.ticketId || !body.replyMessage) {
    return c.json({ error: 'studentEmail, ticketId, and replyMessage are required.' }, 400);
  }

  const emailData = generateSupportTicketReplyEmail({
    studentName: body.studentName || 'Learner',
    ticketId: body.ticketId,
    subject: body.subject || 'Support Inquiry',
    replyMessage: body.replyMessage,
    responderName: body.responderName || 'AcePharm Clinical Support',
    isResolved: body.isResolved || false,
  });

  const result = await sendTransactionalEmail(c.env, {
    to: body.studentEmail,
    replyTo: c.env.SUPPORT_INBOX_EMAIL || c.env.SMTP_USER || 'info@acepharmexams.co.uk',
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
  });

  return c.json({
    success: result.success,
    id: result.id,
    message: 'Support reply dispatched successfully to student.',
  });
});


