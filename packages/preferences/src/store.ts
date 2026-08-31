import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  UserPreferences, 
  UserPreferencesSchema, 
  StorageKeys,
  Theme,
  ReaderModePreferences,
  ExamPreferences 
} from './schema';

export interface PreferencesState {
  theme: Theme;
  readerMode: ReaderModePreferences;
  examSettings: ExamPreferences;
  cookieConsent: boolean | null;
  isHydrated: boolean;
  setTheme: (theme: Theme) => void;
  updateReaderMode: (settings: Partial<ReaderModePreferences>) => void;
  updateExamSettings: (settings: Partial<ExamPreferences>) => void;
  setCookieConsent: (consent: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  resetAll: () => void;
}

const defaultValues: UserPreferences = UserPreferencesSchema.parse({});

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: defaultValues.theme,
      readerMode: defaultValues.readerMode,
      examSettings: defaultValues.examSettings,
      cookieConsent: defaultValues.cookieConsent,
      isHydrated: false,
      setTheme: (theme: Theme) => set({ theme }),
      updateReaderMode: (settings: Partial<ReaderModePreferences>) =>
        set((state) => ({ readerMode: { ...state.readerMode, ...settings } })),
      updateExamSettings: (settings: Partial<ExamPreferences>) =>
        set((state) => ({ examSettings: { ...state.examSettings, ...settings } })),
      setCookieConsent: (cookieConsent: boolean) => set({ cookieConsent }),
      setHydrated: (isHydrated: boolean) => set({ isHydrated }),
      resetAll: () => set({ 
        theme: defaultValues.theme,
        readerMode: defaultValues.readerMode,
        examSettings: defaultValues.examSettings,
        cookieConsent: defaultValues.cookieConsent,
        isHydrated: true 
      }),
    }),
    {
      name: StorageKeys.PREFERENCES,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as any))),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
