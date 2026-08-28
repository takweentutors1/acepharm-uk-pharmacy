import * as React from 'react';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          'rounded-btn',
          {
            'bg-indigo text-surface hover:bg-indigo-deep active:bg-indigo-deep': variant === 'primary',
            'bg-indigo-wash text-indigo hover:bg-indigo hover:text-surface': variant === 'secondary',
            'border border-border bg-surface text-ink hover:bg-canvas hover:border-slate': variant === 'outline',
            'text-slate hover:text-ink hover:bg-canvas': variant === 'ghost',
            'bg-danger text-surface hover:bg-danger/90': variant === 'danger',
          },
          {
            'h-9 px-3 text-xs min-h-[36px]': size === 'sm',
            'h-11 px-4 text-sm min-h-[44px]': size === 'md', // 44px touch target per non-negotiables
            'h-12 px-6 text-base min-h-[48px]': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
