/**
 * Phase 0 email capture form.
 *
 * States implemented (design-spec.md 1.3):
 *   S0.2 — empty / invalid-format / valid client-side validation
 *   S0.3 — submit-pending (debounced against double-click)
 *   S0.4 — success confirmation
 *   S0.5 — network/server error: visible, not silent; input preserved
 *   S0.6 — duplicate email: the backend returns the same success shape
 *          as a fresh signup, so this file never needs to branch on it —
 *          the visitor always sees S0.4.
 *
 * The submission itself works regardless of whether the visitor has
 * responded to the cookie banner yet (design-spec.md 1.4 edge case) —
 * this file never checks cookie-consent state before submitting.
 *
 * API path is domain-root-absolute ("/api/subscribe.php") rather than
 * relative, matching the deployment assumption documented in
 * public/.htaccess: compliance.gro-better.com's document root is
 * dedicated to this app, and the canonical URL is the subdomain root
 * itself (no virtual path involved, since 2026-09-09's move away from
 * the original apex+path form). An absolute path avoids any ambiguity
 * either way. Local Docker dev mirrors this: assets/ and api/ are both
 * merged at the container's web root, so this same absolute path works
 * unchanged in both environments.
 */

(function () {
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var CONSENT_STORAGE_KEY = 'cookie_consent'; // shared with cookie-banner.js
  var API_URL = '/api/subscribe.php';

  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_campaign: params.get('utm_campaign') || null,
    };
  }

  function getConsentAnalytics() {
    try {
      return window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'granted';
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('signup-form');
    if (!form) return;

    var emailInput = document.getElementById('email');
    var submitBtn = document.getElementById('signup-submit');
    var emailError = document.getElementById('email-error');
    var submitError = document.getElementById('signup-submit-error');
    var successBox = document.getElementById('signup-success');

    function showFieldError(message) {
      emailError.textContent = message;
      emailError.hidden = false;
      emailInput.setAttribute('aria-invalid', 'true');
    }

    function clearFieldError() {
      emailError.textContent = '';
      emailError.hidden = true;
      emailInput.removeAttribute('aria-invalid');
    }

    function showSubmitError() {
      submitError.hidden = false;
    }

    function clearSubmitError() {
      submitError.hidden = true;
    }

    function setPending(pending) {
      submitBtn.disabled = pending;
      submitBtn.textContent = pending ? 'Sending…' : 'Notify me';
    }

    function showSuccess() {
      // Form is de-emphasized in favor of the confirmation message, but
      // the page's headline/context copy stays visible around it (S0.4)
      // — that's handled by leaving the rest of the page untouched here.
      form.hidden = true;
      successBox.hidden = false;
    }

    function validate(email) {
      if (email === '') {
        return 'Enter your email to get notified.';
      }
      if (!EMAIL_RE.test(email)) {
        return "That doesn't look like a valid email.";
      }
      return null;
    }

    // Not spec-required, but avoids a stale error message sitting under
    // a value the visitor has already started fixing.
    emailInput.addEventListener('input', function () {
      if (!emailError.hidden) clearFieldError();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      // Debounce: bail immediately if a submit is already in flight, so
      // a double-click can't fire a second request (design-spec.md 1.4).
      if (submitBtn.disabled) return;

      var email = emailInput.value.trim();
      var error = validate(email);

      if (error) {
        showFieldError(error);
        emailInput.focus();
        return;
      }

      clearFieldError();
      clearSubmitError();
      setPending(true);

      var payload = Object.assign(
        { email: email, consent_analytics: getConsentAnalytics() },
        getUtmParams()
      );

      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return { ok: false };
            })
            .then(function (body) {
              return { status: response.status, body: body };
            });
        })
        .then(function (result) {
          if (result.status >= 200 && result.status < 300 && result.body && result.body.ok) {
            // Covers both a fresh signup and a duplicate email (S0.6) —
            // the backend returns the same shape either way.
            showSuccess();
            if (typeof window.trackGenerateLead === 'function') {
              window.trackGenerateLead();
            }
          } else {
            // Server responded but rejected the request. Client-side
            // validation should already catch bad input, so in practice
            // this path is a genuine server-side problem — treated as
            // S0.5. Input is left untouched either way.
            setPending(false);
            showSubmitError();
          }
        })
        .catch(function () {
          // Network failure (S0.5). Preserve the entered email — do not
          // clear the field — and surface the error visibly; no silent
          // failures.
          setPending(false);
          showSubmitError();
        });
    });
  });
})();
