import { sendHostingerSmtpEmail, type SmtpResult } from './smtp-client';

/**
 * Hostinger SMTP Transactional Email Dispatcher for AcePharm
 * Built with AcePharm Design System Tokens:
 * Primary Indigo (#4F46E5), Deep Indigo (#3730A3), Indigo Wash (#F1F2FC),
 * Ink (#111827), Slate (#64748B), Canvas (#F8FAFC), Surface (#FFFFFF), Border (#E2E8F0), Emerald (#10B981), Amber (#F59E0B), Crimson (#EF4444)
 */

export interface SendEmailOptions {
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailEnvironment {
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  SUPPORT_INBOX_EMAIL?: string;
  RESEND_API_KEY?: string;
}

export async function sendTransactionalEmail(
  envOrApiKey: EmailEnvironment | string,
  options: SendEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  // If invoked with legacy string or empty config, normalize to environment object
  const env: EmailEnvironment =
    typeof envOrApiKey === 'string'
      ? {
          SMTP_HOST: 'smtp.hostinger.com',
          SMTP_PORT: '465',
          SMTP_USER: 'info@acepharmexams.co.uk',
          SMTP_PASS: envOrApiKey === 're_mock_key' ? undefined : envOrApiKey,
          SMTP_FROM: 'AcePharm <info@acepharmexams.co.uk>',
        }
      : envOrApiKey || {};

  const host = env.SMTP_HOST || 'smtp.hostinger.com';
  const port = Number(env.SMTP_PORT || 465);
  const user = env.SMTP_USER || 'info@acepharmexams.co.uk';
  const pass = env.SMTP_PASS;
  const from = options.from || env.SMTP_FROM || `AcePharm <${user}>`;

  const result = await sendHostingerSmtpEmail({
    host,
    port,
    user,
    pass,
    from,
    to: options.to,
    replyTo: options.replyTo,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  return {
    success: result.success,
    id: result.messageId,
    error: result.error,
  };
}

/**
 * Shared AcePharm Email Layout Template Wrapper
 */
export function wrapEmailInDesignSystem(options: {
  title: string;
  badgeText: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  bodyContent: string;
  headerAccentGradient?: string;
}): string {
  const accentGradient = options.headerAccentGradient || 'linear-gradient(90deg, #4F46E5 0%, #3730A3 100%)';
  const badgeBg = options.badgeBgColor || '#F1F2FC';
  const badgeText = options.badgeTextColor || '#4F46E5';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #F8FAFC;
      padding: 40px 16px;
    }
    .main-table {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 10px 25px -5px rgba(17, 24, 39, 0.04);
      overflow: hidden;
    }
    .header-bar {
      background: ${accentGradient};
      height: 6px;
      width: 100%;
    }
    .content-padding {
      padding: 36px 32px 32px 32px;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 9999px;
      background-color: ${badgeBg};
      color: ${badgeText};
      margin-bottom: 16px;
    }
    .brand-row {
      margin-bottom: 24px;
    }
    .brand-logo {
      display: inline-block;
      width: 36px;
      height: 36px;
      line-height: 36px;
      background-color: #4F46E5;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 18px;
      text-align: center;
      border-radius: 10px;
      vertical-align: middle;
    }
    .brand-name {
      display: inline-block;
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      margin-left: 10px;
      letter-spacing: -0.02em;
      vertical-align: middle;
    }
    .h1-title {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
      line-height: 1.25;
      margin: 0 0 16px 0;
      letter-spacing: -0.02em;
    }
    .body-text {
      font-size: 14px;
      line-height: 1.65;
      color: #64748B;
      margin: 0 0 20px 0;
    }
    .btn-primary {
      display: inline-block;
      background-color: #4F46E5;
      color: #FFFFFF !important;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 11px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .btn-secondary {
      display: inline-block;
      background-color: #F1F2FC;
      color: #4F46E5 !important;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 11px;
      text-align: center;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding: 24px 32px;
      background-color: #F8FAFC;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      line-height: 1.5;
    }
    .footer-links a {
      color: #4F46E5;
      text-decoration: none;
      margin: 0 6px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    .footer-disclaimer {
      margin-top: 12px;
      font-size: 11px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table class="main-table" role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <div class="header-bar"></div>
                <div class="content-padding">
                  <div class="brand-row">
                    <span class="brand-logo">A</span>
                    <span class="brand-name">AcePharm</span>
                  </div>
                  <div>
                    <span class="badge">${options.badgeText}</span>
                  </div>
                  <h1 class="h1-title">${options.title}</h1>
                  ${options.bodyContent}
                </div>
                <div class="footer">
                  <div class="footer-links">
                    <a href="https://acepharmexams.co.uk">Website</a> &bull;
                    <a href="https://app.acepharmexams.co.uk">Dashboard</a> &bull;
                    <a href="https://acepharmexams.co.uk/privacy">Privacy</a> &bull;
                    <a href="mailto:info@acepharmexams.co.uk">Support</a>
                  </div>
                  <div class="footer-disclaimer">
                    AcePharm UK &bull; Clinical Pharmacy Revision Platform.<br>
                    AcePharm is independent and not endorsed by the General Pharmaceutical Council (GPhC).
                  </div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * 1. Welcome & Onboarding Email Template
 */
export function generateWelcomeEmail(data: {
  learnerName: string;
  studyYear?: string;
}): { subject: string; html: string; text: string } {
  const name = data.learnerName || 'there';
  const bodyContent = `
    <p class="body-text">Hi ${name},</p>
    <p class="body-text">Welcome to <strong>AcePharm</strong> — the premier clinical pharmacy examination platform built specifically for the UK GPhC assessment.</p>
    
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #111827;">What you can do right now:</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.8; color: #475569;">
        <li><strong>Adaptive Practice Builder:</strong> Customise question sessions by BNF chapter and high-weight clinical subtopics.</li>
        <li><strong>Calculation Coach:</strong> Master Resource Booklet calculations with live validation & step-by-step breakdowns.</li>
        <li><strong>Ace AI Clinical Tutor:</strong> Ask questions and receive guidance grounded in BNF 87, NICE CGs, and MEP.</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="https://app.acepharmexams.co.uk/session/new" class="btn-primary">Start First Revision Session &rarr;</a>
    </div>
  `;

  return {
    subject: `Welcome to AcePharm — Your GPhC Revision Companion`,
    html: wrapEmailInDesignSystem({
      title: 'Welcome to AcePharm',
      badgeText: 'Account Activated',
      bodyContent,
    }),
    text: `Hi ${name},\n\nWelcome to AcePharm — the premier clinical pharmacy examination platform built specifically for the UK GPhC assessment.\n\nStart your first revision session at https://app.acepharmexams.co.uk/session/new`,
  };
}

/**
 * 2. Email Verification Template
 */
export function generateEmailVerificationEmail(data: {
  learnerName: string;
  verificationLink: string;
}): { subject: string; html: string; text: string } {
  const name = data.learnerName || 'there';
  const bodyContent = `
    <p class="body-text">Hi ${name},</p>
    <p class="body-text">Please verify your email address to secure your AcePharm account and ensure seamless progress synchronization across your devices.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.verificationLink}" class="btn-primary">Verify Email Address &rarr;</a>
    </div>

    <p class="body-text" style="font-size: 12px; color: #94A3B8;">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="${data.verificationLink}" style="color: #4F46E5; word-break: break-all;">${data.verificationLink}</a>
    </p>

    <p class="body-text" style="font-size: 12px; color: #94A3B8; margin-top: 20px;">
      If you did not create an AcePharm account, you can safely disregard this email.
    </p>
  `;

  return {
    subject: `Verify your AcePharm account`,
    html: wrapEmailInDesignSystem({
      title: 'Verify Your Email',
      badgeText: 'Security Verification',
      bodyContent,
    }),
    text: `Hi ${name},\n\nPlease verify your email address using this link: ${data.verificationLink}\n\nAcePharm UK`,
  };
}

/**
 * 3. Password Reset Request Template
 */
export function generatePasswordResetEmail(data: {
  learnerName: string;
  resetLink: string;
}): { subject: string; html: string; text: string } {
  const name = data.learnerName || 'there';
  const bodyContent = `
    <p class="body-text">Hi ${name},</p>
    <p class="body-text">We received a request to reset the password for your AcePharm account. Click the button below to choose a new, secure password.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.resetLink}" class="btn-primary">Reset Password &rarr;</a>
    </div>

    <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 16px; border-radius: 4px; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; color: #92400E; font-weight: 600;">
        Security Notice: This link will expire in 1 hour. If you did not request a password reset, your account is secure and you can ignore this message.
      </p>
    </div>

    <p class="body-text" style="font-size: 12px; color: #94A3B8;">
      Direct link: <a href="${data.resetLink}" style="color: #4F46E5; word-break: break-all;">${data.resetLink}</a>
    </p>
  `;

  return {
    subject: `Reset your AcePharm password`,
    html: wrapEmailInDesignSystem({
      title: 'Password Reset Request',
      badgeText: 'Account Security',
      badgeBgColor: '#FEF3C7',
      badgeTextColor: '#D97706',
      bodyContent,
    }),
    text: `Hi ${name},\n\nClick the link below to reset your AcePharm password:\n${data.resetLink}\n\nThis link will expire in 1 hour.`,
  };
}

/**
 * 4. Subscription Payment Receipt Email Template
 */
export function generateReceiptEmail(data: {
  learnerName: string;
  planName: string;
  amountFormatted: string;
  dateFormatted: string;
  invoiceId: string;
}): { subject: string; html: string; text: string } {
  const bodyContent = `
    <p class="body-text">Hi ${data.learnerName || 'there'},</p>
    <p class="body-text">Thank you for subscribing to AcePharm. Your payment has been processed successfully via Stripe.</p>
    
    <table role="presentation" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin: 20px 0; padding: 18px;" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #64748B;">Plan</td>
        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #111827;">${data.planName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #64748B;">Billing Date</td>
        <td align="right" style="padding: 6px 0; font-size: 13px; color: #111827;">${data.dateFormatted}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #64748B;">Invoice ID</td>
        <td align="right" style="padding: 6px 0; font-size: 12px; font-family: ui-monospace, 'SF Mono', monospace; color: #64748B;">${data.invoiceId}</td>
      </tr>
      <tr>
        <td colspan="2" style="border-top: 1px solid #E2E8F0; padding-top: 10px; margin-top: 6px;"></td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #111827;">Amount Paid</td>
        <td align="right" style="padding: 6px 0; font-size: 16px; font-weight: 800; color: #4F46E5;">${data.amountFormatted}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="https://app.acepharmexams.co.uk/session/new" class="btn-primary">Launch Practice Builder &rarr;</a>
    </div>
  `;

  return {
    subject: `Your AcePharm Receipt — ${data.planName}`,
    html: wrapEmailInDesignSystem({
      title: 'Payment Receipt',
      badgeText: 'Subscription Confirmed',
      badgeBgColor: '#ECFDF5',
      badgeTextColor: '#059669',
      bodyContent,
    }),
    text: `Your AcePharm Receipt — ${data.planName}\n\nAmount Paid: ${data.amountFormatted}\nInvoice ID: ${data.invoiceId}\nBilling Date: ${data.dateFormatted}\n\nAccess practice builder at https://app.acepharmexams.co.uk/session/new`,
  };
}

/**
 * 5. Subscription Cancellation Confirmation Email Template
 */
export function generateCancellationEmail(data: {
  learnerName: string;
  accessUntilFormatted: string;
}): { subject: string; html: string; text: string } {
  const bodyContent = `
    <p class="body-text">Hi ${data.learnerName || 'there'},</p>
    <p class="body-text">We've received your request to cancel your recurring AcePharm subscription. Your payment method will not be charged again.</p>
    
    <div style="background-color: #F8FAFC; border-left: 4px solid #4F46E5; border-radius: 0 12px 12px 0; padding: 18px; margin: 24px 0;">
      <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4F46E5;">Your Full Pro Access Continues Until</p>
      <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #111827;">${data.accessUntilFormatted}</p>
    </div>

    <p class="body-text">
      <strong>Zero Learning Loss:</strong> All your historical question attempts, SM-2 flashcard review intervals, and personal clinical notes will remain securely stored in your account should you choose to return.
    </p>

    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="https://app.acepharmexams.co.uk" class="btn-primary">Return to Revision Dashboard</a>
    </div>
  `;

  return {
    subject: `AcePharm Subscription Cancellation Confirmation`,
    html: wrapEmailInDesignSystem({
      title: 'Subscription Cancelled',
      badgeText: 'Cancellation Scheduled',
      badgeBgColor: '#FFFBEB',
      badgeTextColor: '#D97706',
      bodyContent,
    }),
    text: `AcePharm Subscription Cancellation Confirmation\n\nYour Pro access remains active until ${data.accessUntilFormatted}. All your study data remains saved.\n\nDashboard: https://app.acepharmexams.co.uk`,
  };
}

/**
 * 6. Free-Tier Monthly Usage Warning Email Template (25/30 Questions)
 */
export function generateUsageWarningEmail(data: {
  learnerName: string;
  questionsAnswered: number;
  remainingQuestions: number;
}): { subject: string; html: string; text: string } {
  const bodyContent = `
    <p class="body-text">Hi ${data.learnerName || 'there'},</p>
    <p class="body-text">You have completed <strong>${data.questionsAnswered} of your 30 free practice questions</strong>. You have <strong style="color: #B45309;">${data.remainingQuestions} questions remaining</strong> in your monthly quota.</p>
    
    <div style="background-color: #F1F2FC; border: 1px solid #C7D2FE; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #3730A3;">Unlock Unlimited Revision with AcePharm Pro:</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; color: #4338CA;">
        <li>3,000+ GPhC-style SBA and EMQ practice questions</li>
        <li>Unlimited Ace AI clinical tutor dialogue & guidance</li>
        <li>Calculation Coach and 7-Day Revision Planner</li>
        <li>Full mock exam simulation and SM-2 spaced repetition</li>
      </ul>
      <p style="margin: 12px 0 0 0; font-size: 14px; font-weight: 700; color: #111827;">From only <strong>£4.99/month</strong> or <strong>£49.99/year</strong> (Save £9.89).</p>
    </div>

    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="https://acepharmexams.co.uk/pricing" class="btn-primary">Upgrade to Pro &rarr;</a>
    </div>
  `;

  return {
    subject: `You have ${data.remainingQuestions} free questions remaining — AcePharm`,
    html: wrapEmailInDesignSystem({
      title: 'Free Question Limit Approaching',
      badgeText: `${data.remainingQuestions} Free Questions Left`,
      badgeBgColor: '#FFFBEB',
      badgeTextColor: '#D97706',
      bodyContent,
    }),
    text: `Hi ${data.learnerName || 'there'},\n\nYou have ${data.remainingQuestions} free questions remaining in your monthly quota. Upgrade to Pro for unlimited revision at https://acepharmexams.co.uk/pricing`,
  };
}

/**
 * 7. Support Ticket Reply & Resolution Notification Template
 */
export function generateSupportTicketReplyEmail(data: {
  studentName: string;
  ticketId: string;
  subject: string;
  replyMessage: string;
  responderName?: string;
  isResolved?: boolean;
}): { subject: string; html: string; text: string } {
  const statusBadge = data.isResolved ? 'Ticket Resolved' : 'Support Update';
  const badgeBg = data.isResolved ? '#ECFDF5' : '#F1F2FC';
  const badgeColor = data.isResolved ? '#059669' : '#4F46E5';

  const bodyContent = `
    <p class="body-text">Hi ${data.studentName || 'there'},</p>
    <p class="body-text">Our clinical support team has provided an update regarding your inquiry <strong>"${data.subject}"</strong> (Reference ID: <code>${data.ticketId}</code>).</p>
    
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #4F46E5; border-radius: 4px 12px 12px 4px; padding: 20px; margin: 24px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #4F46E5; margin-bottom: 8px; text-transform: uppercase;">
        ${data.responderName || 'AcePharm Clinical Support Team'}
      </div>
      <div style="font-size: 14px; line-height: 1.65; color: #1E293B; white-space: pre-wrap;">${data.replyMessage}</div>
    </div>

    <p class="body-text" style="font-size: 13px;">
      ${data.isResolved ? 'This ticket has been marked as resolved. If you need any further assistance, simply reply directly to this email.' : 'You can reply directly to this email to continue the conversation.'}
    </p>

    <div style="text-align: center; margin: 28px 0 12px 0;">
      <a href="https://app.acepharmexams.co.uk" class="btn-primary">Go to Revision Dashboard &rarr;</a>
    </div>
  `;

  return {
    subject: `[Support Update] Re: ${data.subject} (${data.ticketId})`,
    html: wrapEmailInDesignSystem({
      title: data.isResolved ? 'Support Ticket Resolved' : 'Response from AcePharm Support',
      badgeText: statusBadge,
      badgeBgColor: badgeBg,
      badgeTextColor: badgeColor,
      bodyContent,
    }),
    text: `Hi ${data.studentName},\n\nUpdate on ticket ${data.ticketId} (${data.subject}):\n\n${data.replyMessage}\n\nAcePharm Support Team`,
  };
}

/**
 * 8. Weekly Revision Insight & Streaks Summary Email Template
 */
export function generateWeeklyRevisionSummaryEmail(data: {
  learnerName: string;
  totalQuestionsAnswered: number;
  accuracyPercentage: number;
  currentStreakDays: number;
  topAreaToImprove: string;
}): { subject: string; html: string; text: string } {
  const bodyContent = `
    <p class="body-text">Hi ${data.learnerName || 'there'},</p>
    <p class="body-text">Here is your weekly revision digest to keep you on track for the GPhC registration assessment.</p>
    
    <table role="presentation" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin: 20px 0; padding: 18px;" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #64748B;">Questions Solved This Week</td>
        <td align="right" style="padding: 8px 0; font-size: 16px; font-weight: 800; color: #111827;">${data.totalQuestionsAnswered}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #64748B;">Weekly Accuracy</td>
        <td align="right" style="padding: 8px 0; font-size: 16px; font-weight: 800; color: ${data.accuracyPercentage >= 70 ? '#059669' : '#D97706'};">${data.accuracyPercentage}%</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #64748B;">Active Study Streak</td>
        <td align="right" style="padding: 8px 0; font-size: 16px; font-weight: 800; color: #4F46E5;">🔥 ${data.currentStreakDays} Days</td>
      </tr>
      <tr>
        <td colspan="2" style="border-top: 1px solid #E2E8F0; padding-top: 10px; margin-top: 6px;"></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 13px; color: #64748B;">Recommended Focus</td>
        <td align="right" style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #3730A3;">${data.topAreaToImprove}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="https://app.acepharmexams.co.uk/session/new" class="btn-primary">Continue Revision Streak &rarr;</a>
    </div>
  `;

  return {
    subject: `Your Weekly AcePharm Revision Digest — 🔥 ${data.currentStreakDays} Day Streak`,
    html: wrapEmailInDesignSystem({
      title: 'Weekly Revision Progress',
      badgeText: 'Weekly Insight',
      bodyContent,
    }),
    text: `Hi ${data.learnerName},\n\nWeekly Progress:\nQuestions: ${data.totalQuestionsAnswered}\nAccuracy: ${data.accuracyPercentage}%\nStreak: ${data.currentStreakDays} days\nFocus: ${data.topAreaToImprove}\n\nContinue at https://app.acepharmexams.co.uk`,
  };
}
