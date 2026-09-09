/**
 * GA4 (gtag.js) + Google Consent Mode v2.
 *
 * The Measurement ID is NOT hardcoded here — it's read from
 * window.GA_MEASUREMENT_ID, which /config.php sets from the
 * GA_MEASUREMENT_ID environment variable (see config.php and
 * api/env.php). A real GA4 property doesn't exist yet as of this
 * writing, so that env var is unset and GA_MEASUREMENT_ID below is
 * `null`: Consent Mode defaults still get set (harmless with no GA
 * loaded), but the gtag.js script is deliberately never requested —
 * no fake/placeholder ID is ever sent to Google. Once a real GA4
 * property exists, setting GA_MEASUREMENT_ID (in .env or a real env
 * var) is the only change needed; also mark `generate_lead` as a
 * conversion in the GA4 admin console (design-spec.md S1.6) — that
 * step isn't code, it's GA4 config.
 *
 * index.html loads /config.php, then this file, in that order, in
 * <head>, so window.GA_MEASUREMENT_ID is already defined here.
 *
 * Consent Mode ordering matters: default consent must be set BEFORE the
 * gtag.js library script is requested, so no analytics/ad cookies are
 * ever set before a visitor has made a choice on the cookie banner
 * (S0.0). This file runs synchronously, early in <head>, specifically to
 * guarantee that ordering happens before anything else on the page runs.
 *
 * This file must never throw in a way that blocks the rest of the page —
 * the email-capture flow and the cookie banner's own Accept/Decline UI
 * must keep working even if GA is blocked entirely, unset, or fails to
 * load (ad blockers, network failure, etc. — design-spec.md 1.4 edge
 * cases).
 */

(function () {
  var GA_MEASUREMENT_ID = (typeof window.GA_MEASUREMENT_ID === 'string' && window.GA_MEASUREMENT_ID)
    ? window.GA_MEASUREMENT_ID
    : null;
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

    // No real GA4 property configured yet (GA_MEASUREMENT_ID env var
    // unset) — skip loading gtag.js entirely rather than requesting a
    // fake/placeholder ID. Consent Mode defaults above are still set
    // regardless, so nothing needs to change here once a real ID exists;
    // window.gtag()/trackGenerateLead() calls below simply no-op into
    // dataLayer until then.
    if (GA_MEASUREMENT_ID) {
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
        // Nothing else on the page depends on this succeeding — signup
        // and the cookie banner are both independent of GA having loaded.
      };
      document.head.appendChild(script);
    }
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
