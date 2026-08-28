/**
 * AcePharm Design Tokens
 * Source of truth: Developer Brief Section 3.3 & acepharm-prototype-vision.html
 */
export const colors = {
  indigo: {
    DEFAULT: 'var(--indigo, #4F46E5)',
    deep: 'var(--indigo-deep, #3730A3)',
    wash: 'var(--indigo-wash, #F1F2FC)',
  },
  ink: 'var(--ink, #111827)',
  slate: 'var(--slate, #64748B)',
  canvas: 'var(--canvas, #F8FAFC)',
  surface: 'var(--surface, #FFFFFF)',
  border: 'var(--border, #E2E8F0)',
  teal: 'var(--teal, #0F766E)',
  success: {
    DEFAULT: 'var(--success, #15803D)',
    wash: 'var(--success-wash, #F0FDF4)',
  },
  warning: {
    DEFAULT: 'var(--warning, #B45309)',
    wash: 'var(--warning-wash, #FFFBEB)',
  },
  danger: {
    DEFAULT: 'var(--danger, #B91C1C)',
    wash: 'var(--danger-wash, #FEF2F2)',
  },
  info: 'var(--info, #0369A1)',
};

export const radii = {
  btn: 'var(--r-btn, 11px)',
  input: 'var(--r-input, 10px)',
  card: 'var(--r-card, 15px)',
  panel: 'var(--r-panel, 22px)',
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

export const fonts = {
  sans: ['var(--sans, "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)'],
  mono: ['var(--mono, "Geist Mono", ui-monospace, "SF Mono", monospace)'],
};
