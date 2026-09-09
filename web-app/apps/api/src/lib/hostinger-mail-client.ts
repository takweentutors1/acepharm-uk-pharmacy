/**
 * Sends transactional email via Hostinger's official Mail HTTP API
 * (https://api.mail.hostinger.com), not raw SMTP. Hostinger's own support
 * confirmed direct SMTP connections from Cloudflare Workers' network are
 * rejected at the TCP level and cannot be whitelisted — this HTTPS API is
 * their documented alternative and works from any `fetch`-capable runtime.
 */

const API_BASE_URL = 'https://api.mail.hostinger.com';

export interface HostingerMailOptions {
  token: string;
  mailboxResourceId: string;
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface HostingerMailResult {
  success: boolean;
  error?: string;
}

function extractEmail(addr: string): string {
  const match = addr.match(/<([^>]+)>/);
  return match ? match[1] : addr.trim();
}

export async function sendViaHostingerMailApi(options: HostingerMailOptions): Promise<HostingerMailResult> {
  const { token, mailboxResourceId } = options;
  if (!token || !mailboxResourceId) {
    return { success: false, error: 'Hostinger Mail API not configured (missing token or mailbox resource id)' };
  }

  const plainText = options.text || options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/mailboxes/${mailboxResourceId}/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: [extractEmail(options.to)],
        ...(options.replyTo ? { replyTo: [extractEmail(options.replyTo)] } : {}),
        subject: options.subject,
        html: options.html,
        text: plainText,
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorBody = await response.text().catch(() => '');
    return { success: false, error: `Hostinger Mail API error (${response.status}): ${errorBody || response.statusText}` };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Hostinger Mail API request failed' };
  }
}
