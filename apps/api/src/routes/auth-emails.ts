import { Hono } from 'hono';
import { z } from 'zod';
import { 
  sendTransactionalEmail, 
  generateVerificationEmail, 
  generatePasswordResetEmail, 
  generatePasswordChangedConfirmationEmail,
  type EmailEnvironment 
} from '../lib/email-service';
import type { AuthContext } from '../middleware/auth';

export const authEmailsRouter = new Hono<AuthContext>();

const verificationSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  stage: z.string().optional(),
  verificationLink: z.string().url().optional(),
});

const passwordResetSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  resetLink: z.string().url().optional(),
});

const passwordChangedSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

/**
 * Helper to generate action code link via Firebase REST API if not explicitly supplied
 */
async function generateFirebaseActionLink(
  apiKey: string,
  requestType: 'VERIFY_EMAIL' | 'PASSWORD_RESET',
  email: string,
  continueUrl: string = 'https://app.acepharmexams.co.uk/session/new'
): Promise<string> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType,
      email,
      continueUrl,
      returnOobLink: true, // Returns the oobLink directly without sending Firebase's default email
    }),
  });

  const data: any = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error?.message || `Failed to generate auth action link (${resp.status})`);
  }

  // Rewrite standard Firebase web action link to our custom branded Next.js router
  // e.g. https://acepharm-uk.firebaseapp.com/__/auth/action?apiKey=...&mode=resetPassword&oobCode=...
  if (data.oobLink) {
    try {
      const parsed = new URL(data.oobLink);
      const customOrigin = 'https://app.acepharmexams.co.uk/auth/action';
      const mode = parsed.searchParams.get('mode') || (requestType === 'PASSWORD_RESET' ? 'resetPassword' : 'verifyEmail');
      const oobCode = parsed.searchParams.get('oobCode');
      const apiKeyParam = parsed.searchParams.get('apiKey');

      return `${customOrigin}?mode=${encodeURIComponent(mode)}&oobCode=${encodeURIComponent(oobCode || '')}&apiKey=${encodeURIComponent(apiKeyParam || '')}&continueUrl=${encodeURIComponent(continueUrl)}`;
    } catch {
      return data.oobLink;
    }
  }

  throw new Error('No action code link returned from Identity Toolkit');
}

/**
 * POST /api/v1/auth/send-custom-verification
 * Generates custom verification link and dispatches branded email via Hostinger SMTP
 */
authEmailsRouter.post('/send-custom-verification', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = verificationSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid verification request parameters', details: validation.error.format() }, 400);
  }

  const { email, name, stage } = validation.data;
  let link = validation.data.verificationLink;

  try {
    const fbApiKey = c.env.FIREBASE_ADMIN_KEY || 'AIzaSyBdwa5chw66W854gxwGu-ooNjR6zmZiZ5Y';
    if (!link) {
      link = await generateFirebaseActionLink(
        fbApiKey,
        'VERIFY_EMAIL',
        email,
        'https://app.acepharmexams.co.uk/session/new'
      );
    }

    const emailTemplate = generateVerificationEmail({
      name,
      verificationLink: link,
      stage,
    });

    const emailResult = await sendTransactionalEmail(c.env as EmailEnvironment, {
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!emailResult.success) {
      return c.json({ 
        error: 'Failed to dispatch email via Hostinger SMTP', 
        details: emailResult.error 
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Custom branded verification email dispatched successfully',
      messageId: emailResult.id,
    });
  } catch (err: any) {
    console.error('Error generating/sending verification email:', err);
    return c.json({ error: err?.message || 'Internal server error while processing verification email' }, 500);
  }
});

/**
 * POST /api/v1/auth/send-custom-password-reset
 * Generates custom password reset link and dispatches branded email via Hostinger SMTP
 */
authEmailsRouter.post('/send-custom-password-reset', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = passwordResetSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid password reset request parameters', details: validation.error.format() }, 400);
  }

  const { email, name } = validation.data;
  let link = validation.data.resetLink;
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || undefined;

  try {
    const fbApiKey = c.env.FIREBASE_ADMIN_KEY || 'AIzaSyBdwa5chw66W854gxwGu-ooNjR6zmZiZ5Y';
    if (!link) {
      link = await generateFirebaseActionLink(
        fbApiKey,
        'PASSWORD_RESET',
        email,
        'https://app.acepharmexams.co.uk/auth/login'
      );
    }

    const emailTemplate = generatePasswordResetEmail({
      name,
      resetLink: link,
      requestIp: clientIp,
    });

    const emailResult = await sendTransactionalEmail(c.env as EmailEnvironment, {
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!emailResult.success) {
      return c.json({ 
        error: 'Failed to dispatch reset email via Hostinger SMTP', 
        details: emailResult.error 
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Custom branded password reset email dispatched successfully',
      messageId: emailResult.id,
    });
  } catch (err: any) {
    console.error('Error generating/sending password reset email:', err);
    return c.json({ error: err?.message || 'Internal server error while processing password reset email' }, 500);
  }
});

/**
 * POST /api/v1/auth/send-custom-password-changed
 * Dispatches confirmation security alert after successful password reset
 */
authEmailsRouter.post('/send-custom-password-changed', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = passwordChangedSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Invalid request parameters', details: validation.error.format() }, 400);
  }

  const { email, name } = validation.data;

  try {
    const emailTemplate = generatePasswordChangedConfirmationEmail({ name });
    const emailResult = await sendTransactionalEmail(c.env as EmailEnvironment, {
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return c.json({
      success: true,
      message: 'Password change confirmation dispatched',
      messageId: emailResult.id,
    });
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to dispatch confirmation email' }, 500);
  }
});
