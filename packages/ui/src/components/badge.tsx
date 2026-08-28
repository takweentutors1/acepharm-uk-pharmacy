import * as React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'teal';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-indigo-wash text-indigo': variant === 'default',
          'bg-success-wash text-success border border-success/20': variant === 'success',
          'bg-warning-wash text-warning border border-warning/20': variant === 'warning',
          'bg-danger-wash text-danger border border-danger/20': variant === 'danger',
          'bg-sky-50 text-info border border-info/20': variant === 'info',
          'bg-teal/10 text-teal border border-teal/20': variant === 'teal',
          'border border-border text-slate': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
