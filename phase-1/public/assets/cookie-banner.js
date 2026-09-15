/**
 * Cookie consent banner — Phase 1.
 *
 * Adapted near-verbatim from phase-0/public/assets/cookie-banner.js
 * (/plan Section 7) — same GDPR-affirmative-opt-in behavior, same
 * Accept/Decline-only shape (design-spec.md 3.7), just a fresh instance
 * because Phase 1 is a new origin/subdomain and cookie consent choices
 * do not carry across subdomains (/plan Section 2's disclosed tradeoff:
 * a visitor who already accepted on Phase 0 is re-prompted here).
 *
 * - Non-blocking bottom bar layered on top of the page — never gates,
 *   delays, or covers the checklist itself or its controls.
 * - Non-response is NOT consent: the banner simply stops reappearing
 *   once a visitor has made an explicit choice.
 * - The choice itself is persisted in localStorage — functional/
 *   strictly-necessary storage, not analytics storage.
 * - Must keep working even if analytics.js's external gtag.js script
 *   fails to load entirely (ad blockers etc.).
 */

(function () {
  var CONSENT_STORAGE_KEY = 'cookie_consent'; // shared with analytics.js (this origin only)

  function getStoredConsent() {
    try {
      return window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch (e) {
      // If localStorage is unavailable, the banner will simply reappear
      // on the next load. Not ideal, but never blocks this visit's flow.
    }
  }

  function notifyAnalytics(granted) {
    if (typeof window.setAnalyticsConsent === 'function') {
      window.setAnalyticsConsent(granted);
    }
  }

  // Reserve space at the bottom of the page for the banner while it's
  // showing, so it can never cover the checklist's own controls on small
  // viewports — same principle as design-spec.md S0.7, applied here.
  function reserveSpaceForBanner(banner, show) {
    document.body.style.paddingBottom = show ? banner.offsetHeight + 'px' : '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;

    var acceptBtn = document.getElementById('cookie-accept');
    var declineBtn = document.getElementById('cookie-decline');
    var stored = getStoredConsent();

    if (stored === 'granted' || stored === 'denied') {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;
    reserveSpaceForBanner(banner, true);

    window.addEventListener('resize', function () {
      if (!banner.hidden) reserveSpaceForBanner(banner, true);
    });

    function respond(granted) {
      storeConsent(granted ? 'granted' : 'denied');
      notifyAnalytics(granted);
      banner.hidden = true;
      reserveSpaceForBanner(banner, false);
    }

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        respond(true);
      });
    }
    if (declineBtn) {
      declineBtn.addEventListener('click', function () {
        respond(false);
      });
    }
  });
})();
