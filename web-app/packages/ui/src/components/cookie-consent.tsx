'use client';

import React, { useState, useEffect } from 'react';
import { getStoredConsent, saveConsent, type ConsentSettings } from '../lib/consent';

export interface CookieBannerProps {
  onConsentChange?: (consent: ConsentSettings) => void;
  privacyPolicyUrl?: string;
}

export const CookieConsentBanner: React.FC<CookieBannerProps> = ({
  onConsentChange,
  privacyPolicyUrl = '/privacy',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const updated = saveConsent({ analytics: true, telemetry: true });
    setIsVisible(false);
    onConsentChange?.(updated);
  };

  const handleRejectNonEssential = () => {
    const updated = saveConsent({ analytics: false, telemetry: false });
    setIsVisible(false);
    onConsentChange?.(updated);
  };

  const handleSavePreferences = () => {
    const updated = saveConsent({
      analytics: analyticsEnabled,
      telemetry: telemetryEnabled,
    });
    setIsVisible(false);
    onConsentChange?.(updated);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie consent"
      role="region"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-surface/95 backdrop-blur-md border-t border-border shadow-2xl transition-all duration-300 animate-fade-in"
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 text-sm text-slate">
          <h3 className="text-base font-semibold text-ink mb-1">
            Privacy & Cookie Preferences
          </h3>
          <p className="leading-relaxed">
            AcePharm uses essential cookies to keep you signed in. With your permission, we also use privacy-friendly analytics and error monitoring to improve question explanations and platform reliability. We never use advertising cookies or sell data. Learn more in our{' '}
            <a
              href={privacyPolicyUrl}
              className="text-indigo underline hover:text-indigo-deep font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo outline-none rounded"
            >
              Privacy Policy
            </a>.
          </p>

          {showPreferences && (
            <div className="mt-4 p-4 rounded-card bg-canvas border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-ink block">Essential Cookies</span>
                  <span className="text-xs text-slate">Required for authentication and session state</span>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="rounded text-indigo border-border opacity-70 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-ink block">Product & Question Analytics</span>
                  <span className="text-xs text-slate">Anonymized question performance and navigation insights</span>
                </div>
                <input
                  type="checkbox"
                  id="consent-analytics"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="rounded text-indigo focus:ring-indigo border-border cursor-pointer h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-ink block">Error Monitoring (Sentry)</span>
                  <span className="text-xs text-slate">Helps us catch and fix software bugs quickly</span>
                </div>
                <input
                  type="checkbox"
                  id="consent-telemetry"
                  checked={telemetryEnabled}
                  onChange={(e) => setTelemetryEnabled(e.target.checked)}
                  className="rounded text-indigo focus:ring-indigo border-border cursor-pointer h-4 w-4"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {!showPreferences ? (
            <>
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 text-xs font-medium text-slate hover:text-ink transition-colors rounded-btn focus-visible:ring-2 focus-visible:ring-indigo outline-none"
              >
                Customise
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-4 py-2 text-xs font-medium text-ink bg-canvas hover:bg-surface border border-border rounded-btn transition-colors focus-visible:ring-2 focus-visible:ring-indigo outline-none"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo hover:bg-indigo-deep rounded-btn shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-indigo outline-none"
              >
                Accept All
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-xs font-medium text-slate hover:text-ink transition-colors rounded-btn focus-visible:ring-2 focus-visible:ring-indigo outline-none"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo hover:bg-indigo-deep rounded-btn shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-indigo outline-none"
              >
                Save Preferences
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
