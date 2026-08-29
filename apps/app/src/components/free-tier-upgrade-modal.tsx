'use client';

import React from 'react';
import { Card } from '@acepharm/ui';
import { Sparkles, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface FreeTierUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionsAnswered?: number;
}

export const FreeTierUpgradeModal: React.FC<FreeTierUpgradeModalProps> = ({
  isOpen,
  onClose,
  questionsAnswered = 30,
}) => {
  if (!isOpen) return null;

  const handleSelectPlan = async (plan: 'monthly' | 'yearly') => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('acepharm_auth_token') : '';
      const res = await fetch('https://acepharm-api.takweencentreuk.workers.dev/api/v1/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'guest'}`,
        },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/session/new?upgraded=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('Error starting Stripe checkout:', e);
      window.location.href = '/pricing';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-xl w-full p-6 sm:p-8 bg-surface border-border shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-indigo to-teal" />

        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            You've completed your 30 free questions!
          </h2>
          <p className="text-xs sm:text-sm text-slate leading-relaxed max-w-md mx-auto">
            You've explored the core revision engine. Upgrade to AcePharm Pro to unlock unlimited access to the entire 3,000+ clinical question bank, AI tutor, and mock exams.
          </p>
        </div>

        {/* Value Prop Highlights */}
        <div className="bg-canvas/60 rounded-xl p-4 border border-border/70 mb-6 space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-ink font-medium">
            <Check className="w-4 h-4 text-teal shrink-0" />
            <span>Unlimited GPhC-mapped SBA & EMQ questions</span>
          </div>
          <div className="flex items-center gap-2.5 text-ink font-medium">
            <Check className="w-4 h-4 text-teal shrink-0" />
            <span>Unlimited Ace AI clinical tutor dialogue & explanations</span>
          </div>
          <div className="flex items-center gap-2.5 text-ink font-medium">
            <Check className="w-4 h-4 text-teal shrink-0" />
            <span>Calculation Coach & 7-Day Spaced Revision Planner</span>
          </div>
          <div className="flex items-center gap-2.5 text-ink font-medium">
            <Check className="w-4 h-4 text-teal shrink-0" />
            <span>SM-2 smart flashcards & full mock assessment player</span>
          </div>
        </div>

        {/* Plan Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Monthly Plan */}
          <div 
            onClick={() => handleSelectPlan('monthly')}
            className="border-2 border-border hover:border-primary/50 bg-canvas/30 hover:bg-canvas rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between text-left group"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate mb-1">Monthly Plan</div>
              <div className="text-2xl font-bold text-ink mb-1">
                £4.99 <span className="text-xs text-slate font-normal">/month</span>
              </div>
              <p className="text-[11px] text-slate">Flexible access. Cancel anytime at period end.</p>
            </div>
            <button className="mt-4 w-full py-2 px-3 rounded-lg border border-border text-xs font-bold text-ink group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center gap-1.5">
              Choose Monthly
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Yearly Plan (Best Value) */}
          <div 
            onClick={() => handleSelectPlan('yearly')}
            className="border-2 border-primary bg-primary/5 hover:bg-primary/10 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between text-left relative group shadow-sm"
          >
            <span className="absolute -top-2.5 right-3 bg-primary text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
              Save £9.89
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Yearly Plan</div>
              <div className="text-2xl font-bold text-ink mb-1">
                £49.99 <span className="text-xs text-slate font-normal">/year</span>
              </div>
              <p className="text-[11px] text-slate">One payment for full assessment cycle access.</p>
            </div>
            <button className="mt-4 w-full py-2 px-3 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Choose Yearly (Best Value)
            </button>
          </div>
        </div>

        {/* Footer / Reassurance */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border text-xs text-slate">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal" />
            <span>Secure Stripe checkout. Keep learning history always.</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate hover:text-ink underline transition-colors"
          >
            Review question explanation first
          </button>
        </div>
      </Card>
    </div>
  );
};
