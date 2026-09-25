import brand from '../../brand.config.json';

// Platform helpers and analytics. Analytics is cookieless and counts page
// views and outbound link clicks only. It never sees anything she logs.

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

/** On iPhone, Safari may clear site data after 7 days unused unless it's on the Home Screen. */
export function needsInstallForSafety(): boolean {
  return isIOS() && !isStandalone();
}

export function registerServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}

export function loadAnalytics() {
  const a = brand.analytics;
  if (a.provider !== 'plausible' || !a.domain) return;
  // Plausible: no cookies, no personal data. The "hash" variant counts
  // #/screen changes as page views; "outbound-links" counts external clicks.
  const s = document.createElement('script');
  s.defer = true;
  s.dataset.domain = a.domain;
  s.src = 'https://plausible.io/js/script.hash.outbound-links.js';
  document.head.appendChild(s);
}
