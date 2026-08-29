/**
 * AcePharm Design Tokens
 * Source of truth: docs/AcePharm Design System & Developer Brief Section 3.3
 */
export const colors = {
  indigo: {
    DEFAULT: 'var(--indigo, #4F46E5)',
    deep: 'var(--indigo-deep, #3730A3)',
    wash: 'var(--indigo-wash, #F1F2FC)',
    light: 'var(--indigo-light, #E0E7FF)',
  },
  ink: 'var(--ink, #111827)',
  slate: {
    DEFAULT: 'var(--slate, #64748B)',
    light: 'var(--slate-light, #94A3B8)',
    lighter: 'var(--slate-lighter, #CBD5E1)',
  },
  canvas: 'var(--canvas, #F8FAFC)',
  surface: 'var(--surface, #FFFFFF)',
  border: {
    DEFAULT: 'var(--border, #E2E8F0)',
    light: 'var(--border-light, #E5E7EB)',
  },
  teal: {
    DEFAULT: 'var(--teal, #0F766E)',
    light: 'var(--teal-light, #EFFAF8)',
  },
  success: {
    DEFAULT: 'var(--success, #15803D)',
    wash: 'var(--success-wash, #F0FDF4)',
    border: 'var(--success-border, #CDEBD6)',
  },
  warning: {
    DEFAULT: 'var(--warning, #B45309)',
    wash: 'var(--warning-wash, #FFFBEB)',
    border: 'var(--warning-border, #FDE9C8)',
  },
  danger: {
    DEFAULT: 'var(--danger, #B91C1C)',
    wash: 'var(--danger-wash, #FEF2F2)',
    border: 'var(--danger-border, #FBD5D5)',
  },
  info: 'var(--info, #0369A1)',
};

export const radii = {
  sm: 'var(--r-sm, 8px)',
  btn: 'var(--r-btn, 11px)',
  input: 'var(--r-input, 10px)',
  card: 'var(--r-card, 15px)',
  panel: 'var(--r-panel, 22px)',
  full: 'var(--r-full, 999px)',
};

export const spacing = {
  s1: '4px',
  s2: '8px',
  s3: '12px',
  s4: '16px',
  s5: '24px',
  s6: '32px',
  s7: '48px',
  s8: '64px',
  s9: '96px',
};

export const shadows = {
  sm: 'var(--shadow-sm, 0 0 0 3px rgba(79, 70, 229, 0.13))',
  card: 'var(--shadow-card, 0 24px 60px -28px rgba(17, 24, 39, 0.28))',
  modal: 'var(--shadow-modal, 0 30px 70px -20px rgba(17, 24, 39, 0.5))',
  toast: 'var(--shadow-toast, 0 12px 30px -8px rgba(0, 0, 0, 0.4))',
  focus: 'var(--shadow-focus, 0 0 0 3px rgba(79, 70, 229, 0.13))',
};

export const fonts = {
  sans: ['var(--sans, "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)'],
  mono: ['var(--mono, "Geist Mono", ui-monospace, "SF Mono", monospace)'],
};
