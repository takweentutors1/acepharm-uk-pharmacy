'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@acepharm/ui';
import { AlertTriangle, RotateCcw, Home, LifeBuoy } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client error to monitoring / console
    console.error('AcePharm Client Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink">
              Ace<span className="text-indigo">Pharm</span>
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
              System Error
            </Badge>
          </div>
        </div>

        {/* Error Card */}
        <Card className="p-6 sm:p-8 bg-surface border-border shadow-lg space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-crimson-light text-crimson mx-auto flex items-center justify-center border border-crimson/20 shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl font-bold text-ink">
              Something went wrong
            </h1>
            <p className="text-xs sm:text-sm text-slate leading-relaxed max-w-xs mx-auto">
              An unexpected error occurred while loading this view. Your session progress has been saved locally.
            </p>
          </div>

          {error.digest && (
            <div className="p-2 rounded bg-canvas border border-border text-[11px] font-mono text-slate text-center">
              Error Ref: {error.digest}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Link href="/" className="w-full">
              <Button
                variant="outline"
                size="md"
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold"
              >
                <Home className="w-4 h-4 text-indigo" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>

        {/* Support Link */}
        <p className="text-center text-xs text-slate flex items-center justify-center gap-1.5">
          <LifeBuoy className="w-3.5 h-3.5 text-slate" />
          <span>Need help? Contact{' '}
            <a
              href="mailto:support@acepharmexams.co.uk"
              className="text-indigo hover:underline font-semibold"
            >
              support@acepharmexams.co.uk
            </a>
          </span>
        </p>
      </div>
    </div>
  );
}
