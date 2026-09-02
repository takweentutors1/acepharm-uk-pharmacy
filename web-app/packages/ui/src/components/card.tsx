import * as React from 'react';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'interactive';
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface text-ink transition-all',
        {
          'shadow-none': variant === 'default',
          'bg-canvas': variant === 'subtle',
          'hover:border-indigo/40 hover:shadow-sm cursor-pointer': variant === 'interactive',
        },
        className
      )}
      {...props}
    />
  );
}
