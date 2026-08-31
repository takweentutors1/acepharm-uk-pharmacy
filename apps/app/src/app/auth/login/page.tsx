'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@acepharm/ui';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { sendCustomPasswordResetEmail } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first, then click "Forgot password?".');
      return;
    }
    setError(null);
    try {
      await sendCustomPasswordResetEmail(email);
      setResetSent(true);
    } catch (err: any) {
      setError('Failed to send reset email. Please ensure your email is correct.');
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

        {resetSent && (
          <div className="mb-5 p-3.5 rounded-btn bg-teal-light border border-teal/20 text-teal text-xs leading-relaxed">
            Password reset link sent to <strong>{email}</strong>. Please check your inbox.
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
                onClick={handleForgotPassword}
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
            className="w-full mt-2 flex items-center justify-center gap-2 shadow-sm font-semibold"
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
    </div>
  );
}
