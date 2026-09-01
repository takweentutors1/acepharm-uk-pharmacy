import { describe, it, expect } from 'vitest';
import { buildMimeMessage, sendHostingerSmtpEmail } from './smtp-client';
import {
  sendTransactionalEmail,
  generateWelcomeEmail,
  generateEmailVerificationEmail,
  generatePasswordResetEmail,
  generateReceiptEmail,
  generateCancellationEmail,
  generateUsageWarningEmail,
  generateSupportTicketReplyEmail,
  generateWeeklyRevisionSummaryEmail,
} from './email-service';

describe('Hostinger SMTP Client & Complete Email Template Suite', () => {
  describe('MIME Message Builder (RFC 5322 & RFC 2046)', () => {
    it('generates valid multipart/alternative MIME with headers and body', () => {
      const mime = buildMimeMessage({
        from: 'AcePharm <info@acepharmexams.co.uk>',
        to: 'student@example.ac.uk',
        replyTo: 'support@acepharmexams.co.uk',
        subject: 'AcePharm Registration Confirmation',
        html: '<div style="color: #4f46e5;">Welcome to AcePharm</div>',
        text: 'Welcome to AcePharm',
        messageId: '<custom-id-999@acepharmexams.co.uk>',
      });

      expect(mime).toContain('From: AcePharm <info@acepharmexams.co.uk>');
      expect(mime).toContain('To: student@example.ac.uk');
      expect(mime).toContain('Reply-To: support@acepharmexams.co.uk');
      expect(mime).toContain('Subject: AcePharm Registration Confirmation');
      expect(mime).toContain('Message-ID: <custom-id-999@acepharmexams.co.uk>');
      expect(mime).toContain('MIME-Version: 1.0');
      expect(mime).toContain('Content-Type: multipart/alternative;');
      expect(mime).toContain('Content-Type: text/plain; charset=UTF-8');
      expect(mime).toContain('Content-Type: text/html; charset=UTF-8');
      expect(mime).toContain('Welcome to AcePharm');
    });
  });

  describe('1. Welcome & Onboarding Email Template', () => {
    it('generates welcome email with GPhC revision feature highlights', () => {
      const email = generateWelcomeEmail({
        learnerName: 'Amina',
      });

      expect(email.subject).toContain('Welcome to AcePharm');
      expect(email.html).toContain('Amina');
      expect(email.html).toContain('Adaptive Practice Builder');
      expect(email.html).toContain('Calculation Coach');
      expect(email.html).toContain('Ace AI Clinical Tutor');
      expect(email.text).toContain('Amina');
    });
  });

  describe('2. Email Verification Template', () => {
    it('generates account email verification link email', () => {
      const email = generateEmailVerificationEmail({
        learnerName: 'Farhan',
        verificationLink: 'https://app.acepharmexams.co.uk/auth/action?mode=verifyEmail&oobCode=xyz789',
      });

      expect(email.subject).toBe('Verify your AcePharm account');
      expect(email.html).toContain('Farhan');
      expect(email.html).toContain('https://app.acepharmexams.co.uk/auth/action?mode=verifyEmail&oobCode=xyz789');
    });
  });

  describe('3. Password Reset Request Template', () => {
    it('generates password reset email with 1-hour expiry notice', () => {
      const email = generatePasswordResetEmail({
        learnerName: 'Bilal',
        resetLink: 'https://app.acepharmexams.co.uk/auth/action?mode=resetPassword&oobCode=abc123',
      });

      expect(email.subject).toBe('Reset your AcePharm password');
      expect(email.html).toContain('Bilal');
      expect(email.html).toContain('expire in 1 hour');
      expect(email.html).toContain('https://app.acepharmexams.co.uk/auth/action?mode=resetPassword&oobCode=abc123');
    });
  });

  describe('4. Stripe Subscription Receipt Template', () => {
    it('generates receipt email with plan details and formatted amount', () => {
      const email = generateReceiptEmail({
        learnerName: 'Zainab',
        planName: 'AcePharm Yearly Pro',
        amountFormatted: '£49.99',
        dateFormatted: '2 September 2026',
        invoiceId: 'in_1U9j0pE4ZQ',
      });

      expect(email.subject).toBe('Your AcePharm Receipt — AcePharm Yearly Pro');
      expect(email.html).toContain('Zainab');
      expect(email.html).toContain('AcePharm Yearly Pro');
      expect(email.html).toContain('£49.99');
      expect(email.html).toContain('in_1U9j0pE4ZQ');
    });
  });

  describe('5. Subscription Cancellation Confirmation Template', () => {
    it('generates cancellation confirmation with retention reassurance', () => {
      const email = generateCancellationEmail({
        learnerName: 'Hamza',
        accessUntilFormatted: '1 October 2026',
      });

      expect(email.subject).toBe('AcePharm Subscription Cancellation Confirmation');
      expect(email.html).toContain('Hamza');
      expect(email.html).toContain('1 October 2026');
      expect(email.html).toContain('Zero Learning Loss');
    });
  });

  describe('6. Usage Limit Warning Template', () => {
    it('generates 25/30 free question limit warning email', () => {
      const email = generateUsageWarningEmail({
        learnerName: 'Tariq',
        questionsAnswered: 25,
        remainingQuestions: 5,
      });

      expect(email.subject).toContain('5 free questions remaining');
      expect(email.html).toContain('Tariq');
      expect(email.html).toContain('25 of your 30 free practice questions');
      expect(email.html).toContain('5 questions remaining');
    });
  });

  describe('7. Support Ticket Response Template', () => {
    it('generates support response email with reference ID and reply message', () => {
      const email = generateSupportTicketReplyEmail({
        studentName: 'Fatima',
        ticketId: 'ticket-4819',
        subject: 'Renal Dose Adjustment Question',
        replyMessage: 'For Gentamicin calculations, always calculate CrCl via Cockcroft-Gault using Ideal Body Weight (IBW) if total body weight > 120% of IBW.',
        isResolved: false,
      });

      expect(email.subject).toContain('Renal Dose Adjustment Question');
      expect(email.subject).toContain('ticket-4819');
      expect(email.html).toContain('Fatima');
      expect(email.html).toContain('Cockcroft-Gault');
    });
  });

  describe('8. Weekly Revision Digest Template', () => {
    it('generates weekly revision progress summary with streaks', () => {
      const email = generateWeeklyRevisionSummaryEmail({
        learnerName: 'Ali',
        totalQuestionsAnswered: 85,
        accuracyPercentage: 78,
        currentStreakDays: 6,
        topAreaToImprove: 'Cardiovascular — ACEi vs ARB Monitoring',
      });

      expect(email.subject).toContain('🔥 6 Day Streak');
      expect(email.html).toContain('Ali');
      expect(email.html).toContain('85');
      expect(email.html).toContain('78%');
      expect(email.html).toContain('Cardiovascular — ACEi vs ARB Monitoring');
    });
  });
});
