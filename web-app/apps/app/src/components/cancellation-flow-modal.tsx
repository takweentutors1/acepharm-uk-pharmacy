'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  HelpCircle,
  Clock,
  Sparkles,
  Calendar
} from 'lucide-react';

interface CancellationFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPeriodEnd?: string | Date;
  onCancellationComplete?: () => void;
}

const CANCELLATION_REASONS = [
  { id: 'passed_assessment', label: 'I passed my GPhC registration assessment 🎉' },
  { id: 'exam_postponed', label: 'My assessment was postponed / changed sittings' },
  { id: 'too_expensive', label: 'Subscription price is too high for my budget' },
  { id: 'switched_platform', label: 'Using alternative revision materials / books' },
  { id: 'technical_issues', label: 'Encountered technical issues / missing features' },
  { id: 'other', label: 'Other personal reason' },
];

export const CancellationFlowModal: React.FC<CancellationFlowModalProps> = ({
  isOpen,
  onClose,
  currentPeriodEnd = new Date(Date.now() + 14 * 86400000),
  onCancellationComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  if (!isOpen) return null;

  const formattedPeriodEnd = new Date(currentPeriodEnd).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleConfirmCancellation = async () => {
    setIsSubmitting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('acepharm_auth_token') : '';
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.acepharmexams.co.uk';
      await fetch(`${apiBase}/api/v1/stripe/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: selectedReason,
          feedback: feedbackNotes,
        }),
      });
      setIsCancelled(true);
      onCancellationComplete?.();
    } catch (e) {
      console.error('Cancellation error:', e);
      setIsCancelled(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-lg w-full p-6 sm:p-8 bg-surface border-border shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate hover:text-ink p-1 rounded-md transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isCancelled ? (
          /* Success Screen: Access Persists Until Period End */
          <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal/10 text-teal mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-ink">Subscription Cancelled</h3>
            <p className="text-sm text-slate leading-relaxed">
              Your subscription will not renew. You retain <strong className="text-ink">full Pro access</strong> to all questions, mock exams, and Ace AI until:
            </p>
            <div className="p-4 bg-canvas border border-border rounded-xl font-bold text-primary flex items-center justify-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{formattedPeriodEnd}</span>
            </div>
            <p className="text-xs text-slate">
              Your historical performance, saved notes, and flashcards will be safely stored in your account forever.
            </p>
            <Button onClick={onClose} className="w-full mt-4">
              Return to Revision Dashboard
            </Button>
          </div>
        ) : currentStep === 1 ? (
          /* Screen 1: Reason Capture & Reassurance */
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="text-[11px] mb-2 font-mono">
                Step 1 of 2 — Feedback
              </Badge>
              <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                Help us understand why you're leaving
              </h3>
              <p className="text-xs sm:text-sm text-slate mt-1">
                We're constantly refining AcePharm to support UK pharmacy trainees.
              </p>
            </div>

            <div className="space-y-2">
              {CANCELLATION_REASONS.map((r) => (
                <label
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                    selectedReason === r.id
                      ? 'border-primary bg-primary/5 text-ink font-medium shadow-xs'
                      : 'border-border bg-canvas/40 text-slate hover:border-border-strong hover:bg-canvas'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellation_reason"
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-primary w-4 h-4"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'other' && (
              <textarea
                placeholder="Tell us what we could improve..."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-border bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                rows={3}
              />
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="w-1/2">
                Keep Subscription
              </Button>
              <Button
                disabled={!selectedReason}
                onClick={() => setCurrentStep(2)}
                className="w-1/2 flex items-center justify-center gap-1.5"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          /* Screen 2: Period-End Grace Period & Final Confirmation */
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
            <div>
              <Badge variant="outline" className="text-[11px] mb-2 font-mono text-amber-600 border-amber-300">
                Step 2 of 2 — Confirmation
              </Badge>
              <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                Confirm your cancellation
              </h3>
              <p className="text-xs sm:text-sm text-slate mt-1">
                You won't be charged again, and access continues through the end of your billing cycle.
              </p>
            </div>

            {/* Retention & Terms Reassurance Box */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5 text-ink font-medium">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Paid Access Guaranteed:</strong> You maintain full access to all questions & mock exams until <strong>{formattedPeriodEnd}</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-ink font-medium">
                <ShieldCheck className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Data Loss:</strong> Your revision progress, SM-2 flashcards, and notes remain saved if you ever return.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-1/3 order-2 sm:order-1 text-xs"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmCancellation}
                disabled={isSubmitting}
                className="w-full sm:w-2/3 order-1 sm:order-2 bg-danger hover:bg-danger/90 text-white font-bold text-xs"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
