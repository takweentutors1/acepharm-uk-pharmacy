'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@acepharm/ui';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { sendCustomPasswordResetEmail } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again or request a reset link.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || 'Unable to sign in. Please verify your details.');
      }
      setLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setForgotEmail(email || '');
    setForgotError(null);
    setForgotSuccess(false);
    setShowForgotModal(true);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      await sendCustomPasswordResetEmail(forgotEmail);
      setForgotSuccess(true);
      setResendCountdown(60);
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to dispatch password reset email. Please verify your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-canvas px-4 py-12">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo to-teal flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
          A
        </div>
        <span className="text-2xl font-bold tracking-tight text-ink">AcePharm</span>
      </div>

      <Card className="max-w-md w-full p-6 sm:p-8 bg-surface border border-border shadow-card rounded-card relative overflow-hidden">
        <div className="text-center mb-6">
          <Badge variant="teal" className="mb-2 text-xs">
            UK Pharmacy Learner Portal
          </Badge>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Log in to your account</h1>
          <p className="text-xs text-slate mt-1.5 leading-relaxed">
            Continue your clinical revision sessions and track your accuracy calibration.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-btn bg-danger-wash border border-danger-border text-danger text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.ac.uk"
                className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
              />
              <Mail className="w-4 h-4 text-slate-light absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={handleOpenForgotPassword}
                className="text-xs text-indigo hover:text-indigo-deep font-semibold transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
              />
              <Lock className="w-4 h-4 text-slate-light absolute left-3 top-3" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 shadow-sm font-semibold text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Log in
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-slate">
          Don't have an account yet?{' '}
          <a href="/auth/register" className="font-bold text-indigo hover:text-indigo-deep transition-colors">
            Start revising free
          </a>
        </div>

        <div className="mt-5 pt-3 text-center text-[11px] text-slate-light flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          <span>Independent UK Revision &bull; GPhC Aligned &bull; GDPR Compliant</span>
        </div>
      </Card>

      {/* Branded Forgot Password Modal / In-Page Flow */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-md w-full p-6 sm:p-7 bg-surface border border-border shadow-2xl rounded-card space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo/10 text-indigo flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-ink">Reset Your Password</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate hover:text-ink text-xs font-bold p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="p-3 rounded-btn bg-danger-wash border border-danger-border text-danger text-xs leading-relaxed">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto border border-teal/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-ink">Reset Link Dispatched</h3>
                  <p className="text-xs text-slate leading-relaxed">
                    We have sent a secure password reset link to <strong>{forgotEmail}</strong> via Hostinger SMTP.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full text-xs font-bold"
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resendCountdown > 0 || forgotLoading}
                    onClick={handleSendResetEmail}
                    className="w-full text-xs"
                  >
                    {resendCountdown > 0 ? (
                      `Resend link in ${resendCountdown}s`
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-indigo" /> Resend Reset Link
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <p className="text-xs text-slate leading-relaxed">
                  Enter the email address registered with your AcePharm learner account. We will send a secure reset link.
                </p>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@university.ac.uk"
                      className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-light absolute left-3 top-3" />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/3 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={forgotLoading}
                    className="w-2/3 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
