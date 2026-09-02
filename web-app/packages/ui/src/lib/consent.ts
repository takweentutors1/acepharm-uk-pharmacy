/**
 * Consent management for AcePharm analytics & error telemetry.
 * Non-negotiable: Non-essential tracking must remain inactive until consent is granted.
 */

export interface ConsentSettings {
  essential: boolean; // Always true
  analytics: boolean; // GA4 / Firebase Analytics / Cloudflare Web Analytics
  telemetry: boolean; // Sentry Error Tracking
  timestamp: number;
}

const CONSENT_STORAGE_KEY = 'acepharm_cookie_consent_v1';

export function getStoredConsent(): ConsentSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentSettings;
  } catch {
    return null;
  }
}

export function saveConsent(settings: Omit<ConsentSettings, 'essential' | 'timestamp'>): ConsentSettings {
  const fullSettings: ConsentSettings = {
    essential: true,
    analytics: Boolean(settings.analytics),
    telemetry: Boolean(settings.telemetry),
    timestamp: Date.now(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullSettings));
      window.dispatchEvent(new CustomEvent('acepharm_consent_updated', { detail: fullSettings }));
    } catch {
      // Storage unavailable
    }
  }

  return fullSettings;
}

export function hasGivenConsent(): boolean {
  return getStoredConsent() !== null;
}
