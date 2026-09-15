/**
 * GA4 (gtag.js) + Google Consent Mode v2 — Phase 1.
 *
 * Adapted near-verbatim from phase-0/public/assets/analytics.js (/plan
 * Section 7): the Consent Mode v2 default-denied-until-Accept pattern is
 * proven in production there and is deliberately not redesigned here. A
 * fresh instance exists only because Phase 1 is a new origin/subdomain
 * (/plan Section 2) — Phase 0's localStorage/cookie-consent choice does
 * not carry over across subdomains, so a Phase 1 visitor is re-prompted
 * by Phase 1's own cookie-banner.js even if they already accepted on
 * Phase 0.
 *
 * The Measurement ID is NOT hardcoded — it's read from
 * window.GA_MEASUREMENT_ID, which /config.php sets from the
 * GA_MEASUREMENT_ID environment variable (same pattern as Phase 0's
 * config.php / api/env.php). No real GA4 property exists for Phase 1 yet
 * (Open Question 7 in /plan — same GA4 property as Phase 0, or a new
 * one, is a GA4-admin-console decision, not a code one) — until
 * GA_MEASUREMENT_ID is set, gtag.js is never requested, exactly like
 * Phase 0 handled the same pre-launch gap.
 *
 * Events (PRD-required three only — /build's default #6 skips the
 * optional `checklist_item_completed` event flagged as available but not
 * required in /plan's Open Question 6):
 *   - checklist_started            (design-spec/PRD "Started" metric)
 *   - checklist_completed          (design-spec/PRD "completed" metric)
 *   - checklist_contact_submitted  (kept distinct from Phase 0's
 *                                    generate_lead so the two conversions
 *                                    are never conflated — /plan Section 7)
 *
 * This file must never throw in a way that blocks the rest of the
 * checklist — the wizard, save/resume, and the cookie banner's own
 * Accept/Decline controls must keep working even if GA is blocked
 * entirely, unset, or fails to load.
 */

(function () {
  var GA_MEASUREMENT_ID = (typeof window.GA_MEASUREMENT_ID === 'string' && window.GA_MEASUREMENT_ID)
    ? window.GA_MEASUREMENT_ID
    : null;
  var CONSENT_STORAGE_KEY = 'cookie_consent'; // shared with cookie-banner.js (this origin only)

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  try {
    // Default: both analytics and ad storage denied, until the visitor
    // actively accepts (this origin's own cookie banner). Must run
    // before gtag.js is requested below.
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      wait_for_update: 500,
    });

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

    // No real GA4 property configured yet — skip loading gtag.js
    // entirely rather than requesting a fake/placeholder ID. Consent
    // Mode defaults above are still set regardless, so nothing needs to
    // change here once a real ID exists; the track*() calls below simply
    // no-op into dataLayer until then.
    if (GA_MEASUREMENT_ID) {
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID);

      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
      script.onerror = function () {
        // GA script blocked or failed to load (ad blocker, network
        // issue). Nothing else on the page depends on this succeeding.
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
   * Called by checklist.js the first time the user answers any
   * sub-question — not on intro-screen load (design-spec/PRD "Started"
   * definition: opened the checklist and answered at least one item).
   */
  window.trackChecklistStarted = function () {
    try {
      gtag('event', 'checklist_started');
    } catch (e) {
      // no-op
    }
  };

  /**
   * Called by checklist.js when the results screen (either variant) is
   * first shown for the current session (design-spec/PRD "completed"
   * definition: reached the final item and viewed the results summary).
   */
  window.trackChecklistCompleted = function () {
    try {
      gtag('event', 'checklist_completed');
    } catch (e) {
      // no-op
    }
  };

  /**
   * Called by checklist.js on a successful contact-form submission
   * (S1.6/US-10's opt-in trigger). Deliberately a distinct event name
   * from Phase 0's generate_lead — these are two different conversions
   * and must never be conflated in reporting (/plan Section 7).
   */
  window.trackChecklistContactSubmitted = function () {
    try {
      gtag('event', 'checklist_contact_submitted');
    } catch (e) {
      // no-op
    }
  };
})();
