'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button, Badge } from '@acepharm/ui';
import { CheckCircle2, ArrowRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

import { apiVerifyEmail } from '@/lib/auth-client';
import { ApiError } from '@/lib/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const continueUrl = searchParams.get('continueUrl') || '/session/new';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    apiVerifyEmail(token)
      .then(() => {
        setSuccess(true);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? 'The verification link is invalid, expired, or has already been used.'
            : 'The verification link is invalid, expired, or has already been used.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-canvas px-4 py-12">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo to-teal flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
          A
        </div>
        <span className="text-2xl font-bold tracking-tight text-ink">AcePharm</span>
      </div>

      <Card className="max-w-md w-full p-6 sm:p-8 bg-surface border-border shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo to-teal" />

        {loading ? (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 text-indigo animate-spin mx-auto" />
            <p className="text-sm text-slate font-medium">Verifying your email...</p>
          </div>
        ) : error || !token ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-crimson-light text-crimson flex items-center justify-center mx-auto border border-crimson/20 shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">Link Invalid or Expired</h2>
            <p className="text-xs sm:text-sm text-slate leading-relaxed">
              {error || 'This verification link is missing its code. Please request a new one from your account.'}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => { window.location.href = '/auth/login'; }}
                className="w-full text-xs font-bold"
              >
                Go to Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => { window.location.href = '/'; }}
                className="w-full text-xs font-semibold"
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto border border-teal/20 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <Badge variant="teal" className="text-xs">Account Verified</Badge>
            <h2 className="text-xl font-bold text-ink">Email Verified Successfully!</h2>
            <p className="text-xs sm:text-sm text-slate leading-relaxed">
              Your email address has been verified successfully. Your AcePharm learner account is now fully active with complete question bank access!
            </p>
            <Button
              variant="primary"
              onClick={() => { window.location.href = continueUrl; }}
              className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm"
            >
              Launch Practice Builder
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-slate flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          <span>GPhC Assessment Revision Platform &bull; UK Secure Auth</span>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen bg-canvas">
        <Loader2 className="w-8 h-8 text-indigo animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
