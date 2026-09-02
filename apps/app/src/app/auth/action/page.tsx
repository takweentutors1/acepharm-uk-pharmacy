'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, Button, Badge } from '@acepharm/ui';
import { 
  CheckCircle2, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Sparkles,
  Lock,
  Check,
  X,
  RotateCcw
} from 'lucide-react';

import { auth } from '@/lib/firebase';
import { 
  applyActionCode, 
  verifyPasswordResetCode, 
  confirmPasswordReset 
} from 'firebase/auth';
import { apiClient } from '@/lib/api-client';

function AuthActionHandlerContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'verifyEmail', 'resetPassword', 'recoverEmail'
  const oobCode = searchParams.get('oobCode'); // Firebase action one-time code
  const continueUrl = searchParams.get('continueUrl') || '/session/new';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Password strength calculations
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  useEffect(() => {
    if (!mode || !oobCode) {
      setLoading(false);
      return;
    }

    const verifyCode = async () => {
      try {
        if (mode === 'verifyEmail') {
          // Apply email verification code directly in Firebase
          await applyActionCode(auth, oobCode);
          setSuccess(true);
          setSuccessMessage('Your email address has been verified successfully. Your AcePharm learner account is now fully active with complete question bank access!');
          setLoading(false);
        } else if (mode === 'resetPassword') {
          // Verify reset code and get associated email
          const email = await verifyPasswordResetCode(auth, oobCode);
          setUserEmail(email);
          setLoading(false);
        } else if (mode === 'recoverEmail') {
          await applyActionCode(auth, oobCode);
          setSuccess(true);
          setSuccessMessage('Your email recovery request has been processed. Your previous security settings have been restored.');
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Firebase action error:', err);
        setError(err?.message || 'The verification or reset link is invalid, expired, or has already been used.');
        setLoading(false);
      }
    };

    verifyCode();
  }, [mode, oobCode]);

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!oobCode) {
      setError('Missing authentication reset code. Please request a new link.');
      return;
    }

    setIsSubmittingPassword(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      // Dispatch confirmation email in background
      if (userEmail) {
        try {
          await apiClient.post('/api/v1/auth/send-custom-password-changed', {
            email: userEmail,
          });
        } catch {
          // Non-blocking
        }
      }

      setIsSubmittingPassword(false);
      setSuccess(true);
      setSuccessMessage('Your password has been changed successfully. You can now log in with your new credentials.');
    } catch (err: any) {
      setIsSubmittingPassword(false);
      setError(err?.message || 'Failed to update password. Please request a new reset link.');
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

      <Card className="max-w-md w-full p-6 sm:p-8 bg-surface border-border shadow-xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo to-teal" />

        {loading ? (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-8 h-8 text-indigo animate-spin mx-auto" />
            <p className="text-sm text-slate font-medium">Verifying your secure link...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-crimson-light text-crimson flex items-center justify-center mx-auto border border-crimson/20 shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">Link Invalid or Expired</h2>
            <p className="text-xs sm:text-sm text-slate leading-relaxed">
              {error}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => { window.location.href = '/auth/login'; }}
                className="w-full text-xs font-bold"
              >
                Go to Sign In & Request New Link
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
        ) : success ? (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto border border-teal/20 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <Badge variant="teal" className="text-xs">
              {mode === 'verifyEmail' ? 'Account Verified' : 'Security Updated'}
            </Badge>
            <h2 className="text-xl font-bold text-ink">
              {mode === 'verifyEmail' ? 'Email Verified Successfully!' : 'Password Updated!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate leading-relaxed">
              {successMessage}
            </p>
            <Button
              variant="primary"
              onClick={() => { 
                window.location.href = mode === 'verifyEmail' ? (continueUrl || '/session/new') : '/auth/login'; 
              }}
              className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm"
            >
              {mode === 'verifyEmail' ? 'Launch Practice Builder' : 'Log In with New Password'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : mode === 'resetPassword' ? (
          /* Password Reset Form */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo/10 text-indigo flex items-center justify-center mx-auto mb-3 border border-indigo/20 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <Badge variant="outline" className="text-[11px] mb-2 font-mono">
                {userEmail || 'Security Portal'}
              </Badge>
              <h2 className="text-xl font-bold text-ink">Create New Password</h2>
              <p className="text-xs text-slate mt-1">
                Enter your new credentials for AcePharm revision access.
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-light absolute left-3 top-3" />
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate">Strength:</span>
                      <span className={
                        strengthScore <= 2 ? 'text-crimson font-bold' : strengthScore <= 4 ? 'text-amber font-bold' : 'text-teal font-bold'
                      }>
                        {strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Good' : 'Very Strong'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1 h-1.5 bg-canvas rounded-full overflow-hidden">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-full transition-all ${
                            lvl <= strengthScore
                              ? strengthScore <= 2
                                ? 'bg-crimson'
                                : strengthScore <= 4
                                ? 'bg-amber'
                                : 'bg-teal'
                              : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate pt-1">
                      <span className={`flex items-center gap-1 ${hasMinLength ? 'text-teal font-semibold' : ''}`}>
                        {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ characters
                      </span>
                      <span className={`flex items-center gap-1 ${hasUppercase && hasLowercase ? 'text-teal font-semibold' : ''}`}>
                        {hasUppercase && hasLowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Upper & lower case
                      </span>
                      <span className={`flex items-center gap-1 ${hasNumber ? 'text-teal font-semibold' : ''}`}>
                        {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number included
                      </span>
                      <span className={`flex items-center gap-1 ${hasSpecial ? 'text-teal font-semibold' : ''}`}>
                        {hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Special symbol
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-light absolute left-3 top-3" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingPassword || !hasMinLength}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold mt-2 shadow-sm"
              >
                {isSubmittingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Reset Password & Sign In'
                )}
              </Button>
            </form>
          </div>
        ) : (
          /* Fallback Default Auth Welcome */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo/10 text-indigo flex items-center justify-center mx-auto mb-2 border border-indigo/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">AcePharm Account Security</h2>
            <p className="text-xs sm:text-sm text-slate">
              Please use the secure link sent to your email to verify your account or reset your password.
            </p>
            <Button
              variant="primary"
              onClick={() => { window.location.href = '/'; }}
              className="w-full mt-2 text-xs font-bold"
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {/* Reassurance Footer */}
        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-slate flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          <span>GPhC Assessment Revision Platform &bull; UK Secure Auth</span>
        </div>
      </Card>
    </div>
  );
}

export default function AuthActionHandlerPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen bg-canvas">
        <Loader2 className="w-8 h-8 text-indigo animate-spin" />
      </div>
    }>
      <AuthActionHandlerContent />
    </Suspense>
  );
}
