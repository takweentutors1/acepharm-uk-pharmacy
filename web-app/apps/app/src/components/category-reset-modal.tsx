'use client';

import React, { useState } from 'react';
import { Button, Card, Badge } from '@acepharm/ui';
import { AlertTriangle, RotateCcw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CategoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  questionCount: number;
  onResetSuccess?: () => void;
}

export function CategoryResetModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  questionCount,
  onResetSuccess,
}: CategoryResetModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = confirmationInput.trim() === 'RESET';

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setIsSubmitting(true);
    // Simulates calling POST /api/v1/sessions/reset-category
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setConfirmationInput('');
        onResetSuccess?.();
        onClose();
      }, 1500);
    }, 700);
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

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <RotateCcw className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">Reset Category Practice History</h2>
            <p className="text-xs text-slate">
              Re-practice questions as unattempted in custom practice sessions.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal mx-auto animate-bounce" />
            <h3 className="text-sm font-bold text-ink">Category Practice History Cleared</h3>
            <p className="text-xs text-slate max-w-sm mx-auto">
              Questions in <strong>{categoryName}</strong> have been returned to your practice pool. Your first-attempt baseline accuracy remains permanently protected.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {/* Category Target Box */}
            <div className="p-3.5 rounded-lg bg-canvas border border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-ink block">{categoryName}</span>
                <span className="text-[11px] text-slate">{questionCount} questions in this therapeutic system</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {categoryId}
              </Badge>
            </div>

            {/* Non-Negotiable Rule #1 Safeguard Callout */}
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-ink space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-600">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Dual-Store Protection Guarantee</span>
              </div>
              <p className="text-[11px] text-slate leading-relaxed">
                Clearing this category deletes your working practice session attempts (<code className="text-ink font-mono text-[10px]">question_attempts</code>) so you can re-test yourself. <strong>Your initial first-attempt accuracy records (<code className="text-ink font-mono text-[10px]">question_first_attempts</code>) are permanently preserved</strong> to protect diagnostic integrity.
              </p>
            </div>

            {/* Explicit Confirmation Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                Type <strong className="font-mono text-rose-600">RESET</strong> to confirm:
              </label>
              <input
                type="text"
                required
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type RESET"
                className="w-full text-xs font-mono p-3 rounded-lg border border-border bg-canvas text-ink uppercase focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="submit"
                disabled={!isConfirmed || isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? 'Resetting Category...' : 'Confirm Category Reset'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
