/**
 * DAMA-CRM Analytics & Telemetry Tracking Service
 * Client-side privacy-first analytics tracker (RGPD / GDPR compliant).
 */

export interface AnalyticsEvent {
  id: string;
  name: string;
  category: 'navigation' | 'interaction' | 'conversion' | 'system';
  properties?: Record<string, any>;
  timestamp: string;
  path: string;
  sessionId: string;
}

class AnalyticsService {
  private sessionId: string;
  private storageKey = 'dama_analytics_events';
  private maxStoredEvents = 150;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    try {
      let sid = sessionStorage.getItem('dama_session_id');
      if (!sid) {
        sid = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('dama_session_id', sid);
      }
      return sid;
    } catch {
      return 'sess_' + Math.random().toString(36).substring(2, 9);
    }
  }

  public trackPageView(path: string): void {
    this.trackEvent('page_view', { path }, 'navigation');
  }

  public trackEvent(
    name: string,
    properties: Record<string, any> = {},
    category: 'navigation' | 'interaction' | 'conversion' | 'system' = 'interaction'
  ): void {
    try {
      const event: AnalyticsEvent = {
        id: 'evt_' + Math.random().toString(36).substring(2, 9),
        name,
        category,
        properties,
        timestamp: new Date().toISOString(),
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
        sessionId: this.sessionId,
      };

      const existing = this.getRecentEvents();
      existing.unshift(event);
      if (existing.length > this.maxStoredEvents) {
        existing.pop();
      }

      localStorage.setItem(this.storageKey, JSON.stringify(existing));

      // Dispatch custom window event so reactive analytics widgets update in real-time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dama:analytics', { detail: event }));
      }
    } catch {
      // Ignore storage errors
    }
  }

  public getRecentEvents(): AnalyticsEvent[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getMetricsSummary() {
    const events = this.getRecentEvents();
    const pageViews = events.filter((e) => e.category === 'navigation');
    const interactions = events.filter((e) => e.category === 'interaction');
    const conversions = events.filter((e) => e.category === 'conversion');

    // Page frequency count
    const pageCounts: Record<string, number> = {};
    pageViews.forEach((e) => {
      const p = e.properties?.path || e.path;
      pageCounts[p] = (pageCounts[p] || 0) + 1;
    });

    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: events.length,
      pageViewsCount: pageViews.length,
      interactionsCount: interactions.length,
      conversionsCount: conversions.length,
      topPages,
      activeSessionId: this.sessionId,
    };
  }

  public clearHistory(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const analytics = new AnalyticsService();
