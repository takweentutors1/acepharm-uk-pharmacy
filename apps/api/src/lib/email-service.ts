/**
 * Resend Transactional Email Dispatcher for AcePharm (Section 13 & Milestone 6)
 * Handles:
 * 1. Subscription Payment Receipts
 * 2. Subscription Cancellation Confirmations (with access period-end date)
 * 3. Free-Tier Monthly Usage Warnings (25/30 questions answered)
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendTransactionalEmail(
  apiKey: string,
  options: SendEmailOptions
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!apiKey || apiKey === 're_mock_key') {
    console.log(`[Resend Mock Email to ${options.to}]: ${options.subject}`);
    return { success: true, id: `msg_mock_${crypto.randomUUID()}` };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'AcePharm Support <noreply@acepharm.co.uk>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API error:', errText);
      return { success: false, error: errText };
    }

    const data: any = await res.json();
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('Failed to send transactional email via Resend:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * 1. Subscription Payment Receipt Email Template
 */
export function generateReceiptEmail(data: {
  learnerName: string;
  planName: string;
  amountFormatted: string;
  dateFormatted: string;
  invoiceId: string;
}): { subject: string; html: string } {
  return {
    subject: `Your AcePharm Receipt — ${data.planName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { display: inline-block; width: 40px; height: 40px; line-height: 40px; background: #4f46e5; color: #ffffff; border-radius: 8px; font-weight: bold; font-size: 20px; text-align: center; }
    .title { font-size: 22px; font-weight: bold; margin-top: 16px; color: #0f172a; }
    .receipt-box { background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .row:last-child { margin-bottom: 0; }
    .total { font-weight: bold; font-size: 16px; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 8px; }
    .btn { display: block; text-align: center; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 24px; }
    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">A</div>
      <div class="title">Payment Receipt</div>
    </div>
    <p>Hi ${data.learnerName || 'Learner'},</p>
    <p>Thank you for subscribing to AcePharm. Your payment has been processed successfully.</p>
    
    <div class="receipt-box">
      <div class="row">
        <span>Plan</span>
        <strong>${data.planName}</strong>
      </div>
      <div class="row">
        <span>Date</span>
        <span>${data.dateFormatted}</span>
      </div>
      <div class="row">
        <span>Invoice Reference</span>
        <span style="font-family: monospace; font-size: 12px;">${data.invoiceId}</span>
      </div>
      <div class="row total">
        <span>Total Paid</span>
        <span>${data.amountFormatted}</span>
      </div>
    </div>

    <a href="https://app.acepharm.co.uk" class="btn" style="color: #ffffff;">Launch Revision Dashboard</a>

    <div class="footer">
      AcePharm UK &bull; Dedicated GPhC Assessment Preparation<br>
      Need help? Contact support@acepharm.co.uk
    </div>
  </div>
</body>
</html>
`,
  };
}

/**
 * 2. Subscription Cancellation Confirmation Email Template
 */
export function generateCancellationEmail(data: {
  learnerName: string;
  accessUntilFormatted: string;
}): { subject: string; html: string } {
  return {
    subject: `AcePharm Subscription Cancellation Confirmation`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { text-align: center; margin-bottom: 24px; }
    .title { font-size: 22px; font-weight: bold; margin-top: 8px; color: #0f172a; }
    .highlight-box { background: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">Subscription Cancellation Confirmed</div>
    </div>
    <p>Hi ${data.learnerName || 'Learner'},</p>
    <p>We've received your request to cancel your AcePharm recurring subscription. You will not be charged again.</p>
    
    <div class="highlight-box">
      <p style="margin: 0; font-size: 14px;"><strong>Your Full Access Continues Until:</strong><br><span style="font-size: 16px; color: #4f46e5; font-weight: bold;">${data.accessUntilFormatted}</span></p>
    </div>

    <p style="font-size: 14px;">All your historical attempts, spaced repetition flashcards, and clinical notes are saved in your account should you choose to return.</p>

    <div class="footer">
      AcePharm UK &bull; support@acepharm.co.uk
    </div>
  </div>
</body>
</html>
`,
  };
}

/**
 * 3. Free-Tier Monthly Usage Warning Email Template (25/30 Questions)
 */
export function generateUsageWarningEmail(data: {
  learnerName: string;
  questionsAnswered: number;
  remainingQuestions: number;
}): { subject: string; html: string } {
  return {
    subject: `You have ${data.remainingQuestions} free questions remaining — AcePharm`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .title { font-size: 20px; font-weight: bold; color: #0f172a; text-align: center; }
    .btn { display: block; text-align: center; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 24px; }
    .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">You've answered ${data.questionsAnswered} of your 30 free questions</div>
    <p>Hi ${data.learnerName || 'Learner'},</p>
    <p>You have only <strong>${data.remainingQuestions} free questions remaining</strong> in your monthly quota.</p>
    <p>Upgrade to AcePharm Pro for £4.99/month to get unlimited access to 3,000+ GPhC questions, Ace AI tutoring, calculations coach, and mock assessments.</p>

    <a href="https://app.acepharm.co.uk/pricing" class="btn" style="color: #ffffff;">Upgrade to Pro</a>

    <div class="footer">
      AcePharm UK &bull; support@acepharm.co.uk
    </div>
  </div>
</body>
</html>
`,
  };
}
