import React from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@acepharm/ui';
import { Compass, Home, BookOpen, Layers } from 'lucide-react';

export default function NotFound() {
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
              404
            </Badge>
          </div>
        </div>

        {/* 404 Card */}
        <Card className="p-6 sm:p-8 bg-surface border-border shadow-lg space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo/10 text-indigo mx-auto flex items-center justify-center border border-indigo/20 shadow-xs">
            <Compass className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl font-bold text-ink">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-slate leading-relaxed max-w-xs mx-auto">
              The page, study resource, or exam session you are looking for does not exist or has been moved.
            </p>
          </div>

          {/* Quick Navigation Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <Link href="/" className="w-full">
              <Button
                variant="primary"
                size="md"
                className="w-full flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </Button>
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link href="/session/new" className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo" />
                  New Session
                </Button>
              </Link>
              <Link href="/progress" className="w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <Layers className="w-3.5 h-3.5 text-teal" />
                  View Progress
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
