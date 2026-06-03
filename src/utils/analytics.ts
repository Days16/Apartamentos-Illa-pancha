declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
    window.plausible(name, { props });
  }
}

export const EVENTS = {
  APARTMENT_VIEW: 'apartment_view',
  BOOKING_START: 'booking_start',
  BOOKING_COMPLETE: 'booking_complete',
  SEARCH: 'search',
  CONTACT_SUBMIT: 'contact_submit',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export function reportWebVitals(): void {
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    const send = (metric: { name: string; value: number; id: string }) => {
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    };
    onCLS(send);
    onINP(send);
    onFCP(send);
    onLCP(send);
    onTTFB(send);
  });
}
