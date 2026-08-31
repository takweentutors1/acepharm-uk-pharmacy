'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@acepharm/ui';
import { Mail, Lock, User, GraduationCap, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState('foundation');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, name, stage);
      router.push('/');
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. Please log in.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Could not complete registration. Please check your details.');
      }
      setLoading(false);
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
            Start Free Explorer Access
          </Badge>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Create your free account</h1>
          <p className="text-xs text-slate mt-1.5 leading-relaxed">
            30 free questions every month. No credit card required.
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
              Full name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aisha Patel"
                className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all"
              />
              <User className="w-4 h-4 text-slate-light absolute left-3 top-3" />
            </div>
          </div>

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
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Current MPharm / Training Stage
            </label>
            <div className="relative">
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full text-sm py-2.5 pl-9 pr-3 rounded-btn border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo transition-all appearance-none cursor-pointer"
              >
                <option value="mpharm_y2">MPharm Year 2 (Therapeutics & Basics)</option>
                <option value="mpharm_y3">MPharm Year 3 (Clinical Disease States)</option>
                <option value="mpharm_y4">MPharm Year 4 (Complex Patient Cases)</option>
                <option value="foundation">Foundation Trainee (GPhC Assessment)</option>
                <option value="oriel">Oriel SJT Preparation Candidate</option>
                <option value="prescribing">Independent Prescribing Pharmacist</option>
              </select>
              <GraduationCap className="w-4 h-4 text-slate-light absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
                Setting up account...
              </>
            ) : (
              <>
                Create account & start revising
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-border text-center text-xs text-slate">
          Already have an account?{' '}
          <a href="/auth/login" className="font-bold text-indigo hover:text-indigo-deep transition-colors">
            Log in
          </a>
        </div>

        <div className="mt-5 pt-3 text-center text-[11px] text-slate-light flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          <span>Independent UK Platform &bull; No credit card required</span>
        </div>
      </Card>
    </div>
  );
}
