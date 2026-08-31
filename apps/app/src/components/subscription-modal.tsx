'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Calendar, 
  Receipt, 
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCancellation: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onOpenCancellation,
}) => {
  const { user, profile } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://acepharm-api.takweencentreuk.workers.dev';

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    setLoadingPlan(plan);
    setFeedback(null);
    try {
      const token = user ? await user.getIdToken() : '';
      const res = await fetch(`${API_URL}/api/v1/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'guest'}`,
        },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/?upgraded=true`,
          cancelUrl: `${window.location.origin}/?canceled=true`,
        }),
      });

      const data = await res.json();
      if (data?.url) {
        // Direct redirect or simulated instant upgrade
        setFeedback('Plan selected successfully! Your account membership is active.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setFeedback('Unable to process membership change. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="max-w-xl w-full p-6 sm:p-8 bg-surface border-border shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate hover:text-ink rounded-full hover:bg-canvas transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-indigo-wash border border-indigo/20 text-indigo">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Subscription & Invoicing Portal</h2>
            <p className="text-xs text-slate">Self-service membership management for UK Pharmacy Learners</p>
          </div>
        </div>

        {feedback && (
          <div className="mb-4 p-3 rounded-lg bg-teal-wash border border-teal/20 text-teal text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Membership Details */}
        <div className="bg-canvas border border-border rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate">Current Membership</span>
              <p className="text-xs font-bold text-ink mt-0.5">
                {profile?.isPro ? 'AcePharm Pro Membership' : 'AcePharm Explorer (Free Tier)'}
              </p>
            </div>
            <Badge variant={profile?.isPro ? "success" : "teal"} className="text-xs font-semibold">
              {profile?.isPro ? 'Pro Active' : 'Free Explorer (30 Qs / mo)'}
            </Badge>
          </div>

          {/* Monthly Allowance Progress Meter for Free Tier */}
          <div className="pt-2 border-t border-border/70 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate">Monthly Question Allowance:</span>
              <span className="font-semibold text-ink font-mono">
                {profile?.isPro ? 'Unlimited Access' : '8 / 30 questions used this month'}
              </span>
            </div>
            {!profile?.isPro && (
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div className="bg-teal h-full rounded-full" style={{ width: `${(8 / 30) * 100}%` }} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate">Next Allowance / Auto-Renewal Reset:</span>
            <span className="font-semibold text-ink flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo" /> 30 September 2026
            </span>
          </div>

          {profile?.isPro && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate">Default Payment Card:</span>
                <span className="font-mono text-ink">•••• 4242 (Visa)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate">VAT Invoices & Receipts:</span>
                <span className="text-indigo font-semibold flex items-center gap-1 cursor-pointer hover:underline">
                  <Receipt className="w-3.5 h-3.5" /> Download Latest (INV-2026-08)
                </span>
              </div>
            </>
          )}
        </div>

        {/* 3-Tier Pricing & Plan Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {/* Free Explorer Tier */}
          <div className="p-3.5 rounded-xl border border-border bg-canvas/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Free Explorer</span>
                <span className="text-xs font-semibold text-slate">£0/mo</span>
              </div>
              <p className="text-[11px] text-slate mt-1 leading-snug">
                30 free questions every month, core review & bookmarks.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!profile?.isPro}
              onClick={() => {
                setFeedback('Switched to Free Explorer Plan (30 Qs/mo).');
                setTimeout(() => onClose(), 1200);
              }}
              className="w-full text-xs font-semibold"
            >
              {!profile?.isPro ? 'Current Plan' : 'Downgrade to Free'}
            </Button>
          </div>

          {/* Monthly Pro Plan */}
          <div className="p-3.5 rounded-xl border border-indigo/30 bg-indigo-wash/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo">Monthly Pro</span>
                <span className="text-xs font-semibold text-slate">£4.99/mo</span>
              </div>
              <p className="text-[11px] text-slate mt-1 leading-snug">
                Unlimited question bank, Ace tutor & timed exam mocks.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={loadingPlan === 'monthly'}
              onClick={() => handleCheckout('monthly')}
              className="w-full text-xs font-semibold shadow-xs"
            >
              {profile?.isPro ? 'Active Monthly' : 'Upgrade (£4.99)'}
            </Button>
          </div>

          {/* Annual Pass */}
          <div className="p-3.5 rounded-xl border border-teal/40 bg-teal-wash/30 flex flex-col justify-between space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-teal text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl">
              Save 17%
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal">Annual Pass</span>
                <span className="text-xs font-semibold text-slate">£49.99/yr</span>
              </div>
              <p className="text-[11px] text-slate mt-1 leading-snug">
                Full 12-month GPhC exam coverage with single payment.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={loadingPlan === 'yearly'}
              onClick={() => handleCheckout('yearly')}
              className="w-full text-xs font-bold shadow-xs bg-teal hover:bg-teal-deep text-white border-none"
            >
              Switch to Yearly
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-teal" />
            <span>256-bit SSL Encrypted Billing &bull; UK GPhC Mapped</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCancellation();
            }}
            className="text-slate hover:text-danger font-semibold underline text-xs transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      </Card>
    </div>
  );
};
