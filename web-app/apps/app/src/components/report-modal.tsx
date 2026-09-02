'use client';

import React, { useState } from 'react';
import { Button, Card, Badge } from '@acepharm/ui';
import { Flag, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  publicId: string;
  questionVersion: number;
  sessionId?: string;
}

export function ReportQuestionModal({
  isOpen,
  onClose,
  questionId,
  publicId,
  questionVersion,
  sessionId,
}: ReportModalProps) {
  const [issueType, setIssueType] = useState<
    'clinical_inaccuracy' | 'typo' | 'explanation_unclear' | 'broken_reference' | 'other'
  >('clinical_inaccuracy');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    // Simulating API call to POST /api/v1/questions/:id/report
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setMessage('');
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg bg-surface border-border shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate hover:text-ink p-1 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border">
          <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <Flag className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">Report Question Error</h2>
            <p className="text-xs text-slate">
              Flag clinical ambiguities, guideline changes, or errors to our review team.
            </p>
          </div>
        </div>

        {/* Auto-Attached Clinical Metadata Callout */}
        <div className="mb-4 p-3 rounded-lg bg-canvas border border-border/80 text-[11px] font-mono text-slate space-y-1">
          <div className="flex items-center justify-between">
            <span><strong>Question ID:</strong> {publicId}</span>
            <span><strong>Version:</strong> v{questionVersion}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate/80">
            <span><strong>Session Ref:</strong> {sessionId ? sessionId.slice(0, 8) : 'Direct Practice'}</span>
            <span><strong>Auto-Captured:</strong> Time & User Agent</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal mx-auto animate-bounce" />
            <h3 className="text-sm font-bold text-ink">Report Submitted</h3>
            <p className="text-xs text-slate max-w-xs mx-auto">
              Our clinical governance team has logged this issue with full question telemetry.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Type of Issue
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'clinical_inaccuracy', label: 'Clinical Inaccuracy / BNF Change' },
                  { id: 'explanation_unclear', label: 'Explanation Unclear' },
                  { id: 'broken_reference', label: 'Outdated Guideline / Link' },
                  { id: 'typo', label: 'Typo or Grammar' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIssueType(item.id as any)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                      issueType === item.id
                        ? 'border-indigo bg-indigo/5 text-indigo ring-1 ring-indigo'
                        : 'border-border bg-canvas/60 text-slate hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Issue Description & Clinical Reference
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain what is incorrect or unclear. If citing a guideline, please include the BNF section or NICE guideline code..."
                className="w-full text-xs p-3 rounded-lg border border-border bg-canvas text-ink placeholder:text-slate/60 focus:ring-1 focus:ring-indigo focus:border-indigo"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!message.trim() || isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? 'Sending Report...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
