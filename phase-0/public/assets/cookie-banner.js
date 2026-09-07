/**
 * S0.0 — cookie consent banner.
 *
 * - Non-blocking bottom bar layered on top of the page (see index.html /
 *   style.css) — never gates, delays, or covers the rest of the page's
 *   content or the email form.
 * - Accept / Decline only, no granular preference center (design-spec.md
 *   3.7).
 * - Non-response is NOT consent: the banner simply stops reappearing once
 *   a visitor has made an explicit choice; scrolling past it, or leaving
 *   the page without clicking either button, is never treated as
 *   acceptance.
 * - The choice itself is persisted in localStorage — this is functional/
 *   strictly-necessary storage, not analytics storage, so remembering it
 *   doesn't itself require consent (design-spec.md S0.0).
 * - Must keep working even if analytics.js's external gtag.js script
 *   fails to load entirely (ad blockers etc.) — this file only depends on
 *   window.setAnalyticsConsent existing as a function, which analytics.js
 *   defines unconditionally, independent of whether the external script
 *   it injects ever actually loads.
 */

(function () {
  var CONSENT_STORAGE_KEY = 'cookie_consent'; // shared with analytics.js

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
  // showing, so it can never cover the email field / submit button on
  // small viewports (S0.7).
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
      // Already decided on a previous visit — the banner does not
      // reappear (S0.0). analytics.js re-applies a stored 'granted'
      // choice to Consent Mode on every page load; nothing more to do.
      banner.hidden = true;
      return;
    }

    // No stored choice yet: show the banner. Consent stays denied
    // (analytics.js's default) until an explicit click below.
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
