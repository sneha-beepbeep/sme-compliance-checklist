/**
 * GA4 (gtag.js) + Google Consent Mode v2.
 *
 * PLACEHOLDER: GA_MEASUREMENT_ID below is a placeholder. Replace with the
 * real GA4 property's Measurement ID before this ships, and mark the
 * `generate_lead` event as a conversion in the GA4 admin console
 * (design-spec.md S1.6) — that second step isn't code, it's GA4 config.
 *
 * Consent Mode ordering matters: default consent must be set BEFORE the
 * gtag.js library script is requested, so no analytics/ad cookies are
 * ever set before a visitor has made a choice on the cookie banner
 * (S0.0). This file is loaded synchronously, early in <head>
 * (index.html), specifically to guarantee that ordering happens before
 * anything else on the page runs.
 *
 * This file must never throw in a way that blocks the rest of the page —
 * the email-capture flow and the cookie banner's own Accept/Decline UI
 * must keep working even if GA is blocked entirely (ad blockers, network
 * failure, etc. — design-spec.md 1.4 edge cases).
 */

(function () {
  var GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // PLACEHOLDER — replace before ship
  var CONSENT_STORAGE_KEY = 'cookie_consent'; // shared with cookie-banner.js

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  try {
    // Default: both analytics and ad storage denied, until the visitor
    // actively accepts (S0.0). Must run before gtag.js is requested below.
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      wait_for_update: 500,
    });

    // A returning visitor who already made a choice on a previous visit
    // won't see the banner again (S0.0 persists the choice), but that
    // choice must still take effect on every fresh page load.
    var stored = null;
    try {
      stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch (e) {
      // localStorage unavailable (private mode, blocked, etc.) — fall
      // back to default-denied rather than breaking the page over it.
    }
    if (stored === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
    }

    // GA4's default automatic page_view event. GA4 natively parses
    // utm_source/utm_medium/utm_campaign (and utm_term/utm_content, if
    // present) from the landing URL's query string into its own
    // channel-grouping/campaign dimensions — no custom event params
    // needed here for UTM capture (design-spec.md S1.6).
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    script.onerror = function () {
      // GA script blocked or failed to load (ad blocker, network issue).
      // Nothing else on the page depends on this succeeding — signup and
      // the cookie banner are both independent of GA having loaded.
    };
    document.head.appendChild(script);
  } catch (e) {
    // Never let analytics setup break the rest of the page.
  }

  /**
   * Called by cookie-banner.js when the visitor clicks Accept/Decline.
   */
  window.setAnalyticsConsent = function (granted) {
    try {
      gtag('consent', 'update', {
        analytics_storage: granted ? 'granted' : 'denied',
        ad_storage: 'denied',
      });
    } catch (e) {
      // no-op — never let this break the banner's own UI response.
    }
  };

  /**
   * Called by form.js on successful signup (S0.4), whether the email was
   * new or a duplicate. Fires regardless of the current consent state —
   * Consent Mode itself decides whether this becomes a full cookie-based
   * conversion or a cookieless modeled ping (design-spec.md 1.4/1.6: GA4
   * can therefore undercount signups relative to the backend `signups`
   * table, which remains the source of truth for the ~8-signup target).
   */
  window.trackGenerateLead = function () {
    try {
      gtag('event', 'generate_lead', { method: 'email_capture' });
    } catch (e) {
      // no-op
    }
  };
})();
