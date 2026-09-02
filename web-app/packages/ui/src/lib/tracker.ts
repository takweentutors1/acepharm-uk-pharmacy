import { getStoredConsent, type ConsentSettings } from './consent';

/**
 * Universal Tracking Event Schema
 */
export interface TrackEventOptions {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export interface UserIdentification {
  userId: string;
  role?: string;
  stage?: string;
  [key: string]: any;
}

export interface ErrorReportOptions {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'info' | 'warning' | 'error' | 'fatal';
}

/**
 * Thin provider-agnostic analytics & telemetry adapter.
 * Wraps Sentry, Firebase/GA4, and Cloudflare Web Analytics behind a single interface.
 * Non-negotiable rule: Failure of tracking scripts never throws, never surfaces to users, and never blocks app execution.
 */
class AnalyticsTracker {
  private initialized = false;
  private consent: ConsentSettings | null = null;
  private cfToken: string | null = null;
  private sentryDsn: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.consent = getStoredConsent();
      window.addEventListener('acepharm_consent_updated', (e: Event) => {
        const customEvent = e as CustomEvent<ConsentSettings>;
        this.updateConsent(customEvent.detail);
      });
    }
  }

  /**
   * Initializes client telemetry & analytics when consent permits.
   */
  public init(config: { cloudflareWebAnalyticsToken?: string; sentryDsn?: string; gaMeasurementId?: string } = {}) {
    if (typeof window === 'undefined' || this.initialized) return;

    this.cfToken = config.cloudflareWebAnalyticsToken || null;
    this.sentryDsn = config.sentryDsn || null;
    this.initialized = true;

    if (this.consent) {
      this.applyProviders(this.consent);
    }
  }

  /**
   * Updates tracking providers dynamically based on user consent changes.
   */
  public updateConsent(consent: ConsentSettings) {
    this.consent = consent;
    if (typeof window === 'undefined') return;
    this.applyProviders(consent);
  }

  private applyProviders(consent: ConsentSettings) {
    try {
      if (consent.analytics) {
        this.loadCloudflareWebAnalytics();
        this.loadGoogleAnalytics();
      }
      if (consent.telemetry) {
        this.loadSentry();
      }
    } catch {
      // Non-negotiable: Analytics initialization failure is silent
    }
  }

  private loadGoogleAnalytics() {
    const gaId = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GA_MEASUREMENT_ID) || 'G-ACEPHARMUK';
    if (!gaId || document.getElementById('ga4-script')) return;

    try {
      const script = document.createElement('script');
      script.id = 'ga4-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      const win = window as any;
      win.dataLayer = win.dataLayer || [];
      const gtag = (...args: any[]) => {
        win.dataLayer.push(args);
      };
      win.gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId, { anonymize_ip: true });
    } catch {
      // Silent catch
    }
  }

  private loadCloudflareWebAnalytics() {
    if (!this.cfToken || document.getElementById('cf-web-analytics')) return;
    try {
      const script = document.createElement('script');
      script.id = 'cf-web-analytics';
      script.defer = true;
      script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      script.setAttribute('data-cf-beacon', JSON.stringify({ token: this.cfToken }));
      document.head.appendChild(script);
    } catch {
      // Silent catch
    }
  }

  private loadSentry() {
    if (!this.sentryDsn) return;
    // Sentry will hook into the window error listener or SDK when installed
  }

  /**
   * Track custom analytics event (e.g. question answered, session completed, Ace invoked)
   */
  public trackEvent(eventName: string, options: TrackEventOptions = {}) {
    if (!this.consent?.analytics || typeof window === 'undefined') return;

    try {
      // 1. Google Analytics 4 / Firebase Analytics integration
      const win = window as any;
      if (typeof win.gtag === 'function') {
        win.gtag('event', eventName, options);
      }

      // 2. Custom event dispatch for internal subscribers
      window.dispatchEvent(
        new CustomEvent('acepharm_track_event', {
          detail: { eventName, options, timestamp: Date.now() },
        })
      );
    } catch {
      // Never throw on tracking failure
    }
  }

  /**
   * Identify current logged-in user
   */
  public identifyUser(user: UserIdentification) {
    if (!this.consent?.analytics || typeof window === 'undefined') return;

    try {
      const win = window as any;
      if (typeof win.gtag === 'function') {
        win.gtag('set', 'user_properties', {
          user_id: user.userId,
          user_role: user.role,
          user_stage: user.stage,
        });
      }
    } catch {
      // Silent catch
    }
  }

  /**
   * Capture exceptions and send to Sentry (only if user consented to telemetry)
   */
  public captureException(error: unknown, options: ErrorReportOptions = {}) {
    try {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.error('[AcePharm Error Handler]', error, options);
      }

      if (!this.consent?.telemetry || typeof window === 'undefined') return;

      const win = window as any;
      if (win.Sentry && typeof win.Sentry.captureException === 'function') {
        win.Sentry.captureException(error, {
          tags: options.tags,
          extra: options.extra,
          level: options.level || 'error',
        });
      }
    } catch {
      // Silent catch
    }
  }

  /**
   * Track page views across route changes
   */
  public trackPageView(path: string, title?: string) {
    if (!this.consent?.analytics || typeof window === 'undefined') return;

    try {
      const win = window as any;
      if (typeof win.gtag === 'function') {
        win.gtag('event', 'page_view', {
          page_path: path,
          page_title: title || document.title,
        });
      }
    } catch {
      // Silent catch
    }
  }
}

export const tracker = new AnalyticsTracker();
