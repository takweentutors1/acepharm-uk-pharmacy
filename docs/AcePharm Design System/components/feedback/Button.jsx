/**
 * Button Component
 * Primary action element: primary, secondary, ghost, danger variants
 * Sizes: default (44px), sm (38px), lg (52px)
 */

export function Button({
  variant = 'primary',
  size = 'default',
  disabled = false,
  children,
  ...props
}) {
  const sizeClass = {
    default: 'min-h-[44px] px-5 py-[11px] text-base',
    sm: 'min-h-[38px] px-3.5 py-2 text-sm',
    lg: 'min-h-[52px] px-6.5 py-3.5 text-base',
  }[size];

  const variantClass = {
    primary: 'bg-indigo text-white hover:bg-indigo-deep',
    secondary: 'bg-surface text-ink border border-border hover:border-slate',
    ghost: 'bg-transparent text-slate hover:text-ink px-3 py-2.5',
    danger: 'bg-danger text-white hover:bg-red-700',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[11px] border-0 font-medium transition-all duration-150 whitespace-nowrap ${sizeClass} ${variantClass} ${disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}`}
      {...props}
    >
      {children}
    </button>
  );
}
