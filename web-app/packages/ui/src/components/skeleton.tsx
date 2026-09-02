import * as React from 'react';
import { cn } from '../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text';
  shimmer?: boolean;
}

/**
 * Premium Shimmer & Skeleton Component
 * Provides fluid pulsing and shimmering effects across loading states
 */
export function Skeleton({
  className,
  variant = 'rounded',
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-slate-lighter/40 dark:bg-slate/20',
        {
          'rounded-btn': variant === 'rounded',
          'rounded-full': variant === 'circular',
          'rounded-none': variant === 'rectangular',
          'h-4 w-full rounded': variant === 'text',
        },
        shimmer &&
          'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent',
        className
      )}
      {...props}
    />
  );
}

/**
 * Therapeutic System Category Card Shimmer Skeleton
 */
export function CategoryCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-border bg-surface shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      <div className="space-y-1 pt-1">
        <div className="flex justify-between">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
  );
}

/**
 * Streak Tracker Card Shimmer Skeleton
 */
export function StreakTrackerSkeleton() {
  return (
    <div className="p-5 rounded-card border border-border bg-surface shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton variant="rounded" className="w-9 h-9 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-3 w-16 ml-auto" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="pt-2 border-t border-border space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Hero Recommendation Shimmer Skeleton
 */
export function HeroRecommendationSkeleton() {
  return (
    <div className="p-6 rounded-card border border-indigo/20 bg-surface shadow-sm flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-btn" />
          <Skeleton className="h-9 w-36 rounded-btn" />
        </div>
      </div>
    </div>
  );
}
