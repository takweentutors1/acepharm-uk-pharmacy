import { z } from 'zod';

export const ThemeSchema = z.enum(['light', 'dark', 'system']);
export type Theme = z.infer<typeof ThemeSchema>;

export const ReaderFontSizeSchema = z.enum(['sm', 'md', 'lg', 'xl']);
export type ReaderFontSize = z.infer<typeof ReaderFontSizeSchema>;

export const ReaderFontFamilySchema = z.enum(['inter', 'serif', 'sans', 'opendyslexic']);
export type ReaderFontFamily = z.infer<typeof ReaderFontFamilySchema>;

export const ReaderLineSpacingSchema = z.enum(['compact', 'normal', 'relaxed']);
export type ReaderLineSpacing = z.infer<typeof ReaderLineSpacingSchema>;

export const ReaderModePreferencesSchema = z.object({
  fontSize: ReaderFontSizeSchema.default('md'),
  fontFamily: ReaderFontFamilySchema.default('inter'),
  lineSpacing: ReaderLineSpacingSchema.default('normal'),
  focusGuide: z.boolean().default(false),
  theme: z.enum(['light', 'sepia', 'dark']).default('light'),
});
export type ReaderModePreferences = z.infer<typeof ReaderModePreferencesSchema>;

export const ExamPreferencesSchema = z.object({
  soundEnabled: z.boolean().default(true),
  timerWarningMinutes: z.number().min(1).max(30).default(5),
  autoAdvance: z.boolean().default(false),
  hideOptionsByDefault: z.boolean().default(false),
  showConfidencePrompt: z.boolean().default(true),
  flaggedOnlyFilter: z.boolean().default(false),
});
export type ExamPreferences = z.infer<typeof ExamPreferencesSchema>;

export const UserPreferencesSchema = z.object({
  theme: ThemeSchema.default('system'),
  readerMode: ReaderModePreferencesSchema.default({}),
  examSettings: ExamPreferencesSchema.default({}),
  cookieConsent: z.boolean().nullable().default(null),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

/**
 * Well-defined, standardized storage keys across all apps
 */
export const StorageKeys = {
  PREFERENCES: 'acepharm_user_preferences',
  AUTH_TOKEN: 'acepharm_auth_token',
  STAGE_PREFIX: 'acepharm_stage_',
  FREE_TIER_COUNT: 'acepharm_free_tier_count',
  QUESTION_SESSION_PREFIX: 'acepharm_session_',
} as const;
