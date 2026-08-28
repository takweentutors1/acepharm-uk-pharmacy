import { colors, radii, spacing, fonts } from './index.js';

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        indigo: colors.indigo,
        ink: colors.ink,
        slate: colors.slate,
        canvas: colors.canvas,
        surface: colors.surface,
        border: colors.border,
        teal: colors.teal,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        info: colors.info,
      },
      borderRadius: {
        btn: radii.btn,
        input: radii.input,
        card: radii.card,
        panel: radii.panel,
      },
      spacing: {
        s1: spacing.s1,
        s2: spacing.s2,
        s3: spacing.s3,
        s4: spacing.s4,
        s5: spacing.s5,
        s6: spacing.s6,
        s7: spacing.s7,
        s8: spacing.s8,
        s9: spacing.s9,
      },
      fontFamily: {
        sans: fonts.sans,
        mono: fonts.mono,
      },
      maxWidth: {
        measure: '72ch', // 65–75 character measure for question stems
      },
    },
  },
  plugins: [],
};
