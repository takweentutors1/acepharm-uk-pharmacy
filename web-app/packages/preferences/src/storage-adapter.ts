import { StorageKeys } from './schema';

/**
 * Safe LocalStorage helpers that gracefully fallback in SSR/workers
 */
export const SafeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {}
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  getJSON: <T>(key: string, fallback: T): T => {
    const raw = SafeStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON: <T>(key: string, value: T): void => {
    try {
      SafeStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

// Specialized Domain Helpers
export const AuthStorage = {
  getToken: (): string => SafeStorage.getItem(StorageKeys.AUTH_TOKEN) || '',
  setToken: (token: string): void => SafeStorage.setItem(StorageKeys.AUTH_TOKEN, token),
  removeToken: (): void => SafeStorage.removeItem(StorageKeys.AUTH_TOKEN),
  
  getSavedProfile: <T>(): T | null => SafeStorage.getJSON<T | null>(StorageKeys.USER_PROFILE, null),
  setSavedProfile: <T>(profile: T): void => SafeStorage.setJSON(StorageKeys.USER_PROFILE, profile),
  removeSavedProfile: (): void => SafeStorage.removeItem(StorageKeys.USER_PROFILE),

  getStage: (uid: string): string | null => SafeStorage.getItem(`${StorageKeys.STAGE_PREFIX}${uid}`),
  setStage: (uid: string, stage: string): void => SafeStorage.setItem(`${StorageKeys.STAGE_PREFIX}${uid}`, stage),
};

export const SessionStorageHelper = {
  getKey: (sessionId: string, questionId: string) => 
    `${StorageKeys.QUESTION_SESSION_PREFIX}${sessionId}_q_${questionId}`,
    
  getResponse: (sessionId: string, questionId: string) => {
    return SafeStorage.getJSON<{
      selectedOptionId?: string | null;
      confidence?: any;
      isSubmitted?: boolean;
      updatedAt?: number;
    } | null>(SessionStorageHelper.getKey(sessionId, questionId), null);
  },

  saveResponse: (
    sessionId: string,
    questionId: string,
    data: { selectedOptionId?: string | null; confidence?: any; isSubmitted?: boolean }
  ) => {
    SafeStorage.setJSON(SessionStorageHelper.getKey(sessionId, questionId), {
      ...data,
      updatedAt: Date.now(),
    });
  },
};
