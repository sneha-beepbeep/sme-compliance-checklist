/**
 * Phase 1 wizard state machine + client-side status engine
 * (design-spec.md Section 2; /plan Sections 3-5).
 *
 * This file has two clearly separated halves:
 *
 *   1. ChecklistEngine — pure, DOM-independent functions (computeStatus,
 *      isItemAnswered). No fetch, no localStorage, no document reference.
 *      Exposed on `window.ChecklistEngine` for the browser and via
 *      `module.exports` for a Node test harness (see
 *      phase-1/README.md's verification section for how this is actually
 *      exercised — a real Node script runs every Yes/No/Not-sure
 *      combination in items.en.json's placeholder truth tables through
 *      this exact function).
 *
 *   2. The wizard controller — DOM wiring, screen transitions, fetching
 *      content, talking to persistence.js and the contact API. Runs only
 *      in a browser (guarded by `typeof document === 'undefined'`).
 *
 * Copy-framing rule enforced throughout (design-spec.md 2.1): every place
 * a computed status is shown, it is framed as "This item is flagged as:
 * ..." — never "you are compliant" or "you are certified compliant".
 *
 * No "how to fix it" remediation content anywhere (design-spec.md 2.4) —
 * the guidance panel below shows only the computed status and the
 * item's citation object, verbatim from content, nothing else.
 */

(function (root) {
  'use strict';

  // ======================================================================
  // 1. ChecklistEngine — pure status computation
  // ======================================================================

  function ruleComboMatches(combo, subQuestionIds, answers) {
    return subQuestionIds.every(function (id) {
      return combo[id] === answers[id];
    });
  }

  /**
   * Computes an item's status flag from its sub-question answers.
   *
   * @param {object} item - one entry from items.en.json's `items` array.
   * @param {object} answers - map of subQuestionId -> "yes"|"no"|"not_sure".
   * @returns {"compliant"|"not_compliant"|"needs_check"|null} null only
   *   when the item isn't fully answered yet (the wizard UI never shows
   *   a status in that case; callers doing resume/testing should treat
   *   null as "not yet computable", not as a fourth status value).
   */
  function computeStatus(item, answers) {
    answers = answers || {};
    var subQuestionIds = item.subQuestions.map(function (q) {
      return q.id;
    });

    // Fixed platform rule (design-spec.md 2.2c/2.7): any "not_sure"
    // sub-answer defers the ENTIRE item to needs_check, regardless of the
    // other answers or of per-item content. This is engine behavior, not
    // something a content author can override per item.
    var hasNotSure = subQuestionIds.some(function (id) {
      return answers[id] === 'not_sure';
    });
    if (hasNotSure) return 'needs_check';

    var allAnswered = subQuestionIds.every(function (id) {
      return answers[id] === 'yes' || answers[id] === 'no';
    });
    if (!allAnswered) return null;

    var rule = item.statusRule || {};
    var compliantWhen = rule.compliantWhen || [];
    var notCompliantWhen = rule.notCompliantWhen || [];

    var isCompliant = compliantWhen.some(function (combo) {
      return ruleComboMatches(combo, subQuestionIds, answers);
    });
    if (isCompliant) return 'compliant';

    var isNotCompliant = notCompliantWhen.some(function (combo) {
      return ruleComboMatches(combo, subQuestionIds, answers);
    });
    if (isNotCompliant) return 'not_compliant';

    // Unmatched Yes/No combination the content author didn't classify
    // either way: safe fallback, never guesses a firm compliant/
    // not-compliant call for content the truth table didn't anticipate.
    return 'needs_check';
  }

  function isItemAnswered(item, itemAnswers) {
    var subQuestionIds = item.subQuestions.map(function (q) {
      return q.id;
    });
    itemAnswers = itemAnswers || {};
    return subQuestionIds.every(function (id) {
      var v = itemAnswers[id];
      return v === 'yes' || v === 'no' || v === 'not_sure';
    });
  }

  var STATUS_LABELS = {
    compliant: 'Compliant',
    not_compliant: 'Not compliant',
    needs_check: 'Needs-check',
  };

  var ChecklistEngine = {
    computeStatus: computeStatus,
    isItemAnswered: isItemAnswered,
    STATUS_LABELS: STATUS_LABELS,
  };

  root.ChecklistEngine = ChecklistEngine;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChecklistEngine;
  }

  // ======================================================================
  // 2. Wizard controller — DOM-dependent, browser only.
  // ======================================================================

  if (typeof document === 'undefined') {
    // Running under Node (e.g. the status-engine test harness in
    // phase-1/README.md) — nothing below this line is needed there.
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var Persistence = root.ChecklistPersistence;
    var CONTENT_URL = '/content/items.en.json';
    var CONTACT_API_URL = '/api/contact.php';
    var AGENCY_NAME = 'gro digital agency';

    var content = null; // loaded items.en.json
    var qualifyingAnswer = null; // "yes" | "no" | "not_sure" | null
    var answers = {}; // { itemId: { subQId: "yes"|"no"|"not_sure" } }
    var currentItemIndex = 0;
    var contactSubmitted = false;
    var startedEventFired = false;
    var completedEventFired = false;

    // ---- Screen management -------------------------------------------------

    var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));

    function showScreen(id) {
      screens.forEach(function (el) {
        el.hidden = el.id !== id;
      });
      // Land at the top of the new screen — items and results can be
      // taller than one viewport on a phone.
      window.scrollTo(0, 0);
    }

    // ---- Persistence helpers -------------------------------------------------

    var completed = false;

    function persistState() {
      if (!Persistence || !content) return;
      Persistence.save({
        contentVersion: content.contentVersion,
        qualifyingAnswer: qualifyingAnswer,
        answers: answers,
        currentItemId: content.items[currentItemIndex]
          ? content.items[currentItemIndex].id
          : null,
        completed: completed,
        contactSubmitted: contactSubmitted,
      });
    }

    // ---- Analytics helpers (safe no-ops if analytics.js's hooks are absent) --

    function fireStartedIfNeeded() {
      if (startedEventFired) return;
      startedEventFired = true;
      if (typeof root.trackChecklistStarted === 'function') {
        root.trackChecklistStarted();
      }
    }

    function fireCompletedIfNeeded() {
      if (completedEventFired) return;
      completedEventFired = true;
      if (typeof root.trackChecklistCompleted === 'function') {
        root.trackChecklistCompleted();
      }
    }

    // ---- Init ------------------------------------------------------------

    fetch(CONTENT_URL)
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        content = json;
        init();
      })
      .catch(function () {
        // Content failed to load at all — nothing in the wizard can work
        // without it. Surface this rather than showing a blank/broken
        // intro screen (no-silent-failure principle, same as Phase 0).
        var intro = document.getElementById('screen-intro');
        if (intro) {
          intro.innerHTML =
            '<p role="alert">Something went wrong loading the checklist. Please refresh the page to try again.</p>';
        }
      });

    function init() {
      var loadResult = Persistence
        ? Persistence.load(content.contentVersion)
        : { state: null, stale: false };

      renderIntro(loadResult);
      showScreen('screen-intro');
    }

    // ---- S1.1 — Intro screen ----------------------------------------------

    function renderIntro(loadResult) {
      var staleNotice = document.getElementById('intro-stale-notice');
      var resumeBanner = document.getElementById('intro-resume-banner');
      var startBtn = document.getElementById('intro-start-btn');
      var resumeBtn = document.getElementById('intro-resume-btn');
      var startOverBtn = document.getElementById('intro-startover-btn');

      if (staleNotice) staleNotice.hidden = !loadResult.stale;

      var hasResumableState = !!loadResult.state;
      if (resumeBanner) resumeBanner.hidden = !hasResumableState;
      if (startBtn) startBtn.hidden = hasResumableState;
      if (resumeBtn) resumeBtn.hidden = !hasResumableState;
      if (startOverBtn) startOverBtn.hidden = !hasResumableState;

      if (startBtn) {
        startBtn.onclick = function () {
          beginFresh();
        };
      }
      if (startOverBtn) {
        startOverBtn.onclick = function () {
          if (Persistence) Persistence.clear();
          beginFresh();
        };
      }
      if (resumeBtn && hasResumableState) {
        resumeBtn.onclick = function () {
          resumeFrom(loadResult.state);
        };
      }
    }

    function beginFresh() {
      qualifyingAnswer = null;
      answers = {};
      currentItemIndex = 0;
      completed = false;
      contactSubmitted = false;
      showScreen('screen-qualifying');
    }

    function resumeFrom(state) {
      qualifyingAnswer = state.qualifyingAnswer;
      answers = state.answers || {};
      completed = !!state.completed;
      contactSubmitted = !!state.contactSubmitted;

      if (completed) {
        currentItemIndex = content.items.length - 1;
        renderResults();
        return;
      }

      var idx = content.items.findIndex(function (it) {
        return it.id === state.currentItemId;
      });
      currentItemIndex = idx >= 0 ? idx : 0;
      renderItemScreen(currentItemIndex);
    }

    // ---- S1.2 — Qualifying question ----------------------------------------

    (function wireQualifying() {
      var buttons = document.querySelectorAll('[data-qualifying-answer]');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var value = btn.getAttribute('data-qualifying-answer');
          qualifyingAnswer = value;

          if (value === 'no') {
            // Deliberately not persisted (see checklist.js header /
            // phase-1/README.md): a "No" exit has nothing meaningful to
            // resume, so we don't create a save/resume record for it.
            showScreen('screen-qualifying-exit');
            return;
          }

          // "yes" or "not_sure" both proceed into the checklist as normal
          // (design-spec.md S1.2) — the checklist itself is how a
          // "not sure" visitor finds out.
          persistState();
          currentItemIndex = 0;
          renderItemScreen(0);
        });
      });

      var exitBackBtn = document.getElementById('qualifying-exit-back-btn');
      if (exitBackBtn) {
        exitBackBtn.addEventListener('click', function () {
          showScreen('screen-intro');
        });
      }
    })();

    // ---- S1.3 — Item screens ------------------------------------------------

    var itemProgressEl = document.getElementById('item-progress');
    var itemStatementEl = document.getElementById('item-statement');
    var itemSubquestionsEl = document.getElementById('item-subquestions');
    var itemStatusPanelEl = document.getElementById('item-status-panel');
    var itemStatusTextEl = document.getElementById('item-status-text');
    var itemGuidancePanelEl = document.getElementById('item-guidance-panel');
    var itemGuidanceTextEl = document.getElementById('item-guidance-text');
    var itemBackBtn = document.getElementById('item-back-btn');
    var itemNextBtn = document.getElementById('item-next-btn');

    function renderItemScreen(index) {
      // Always ensure the item screen container itself is the visible
      // screen, regardless of which caller reached this function
      // (qualifying-question branch, Next, Back, or a resumed session) —
      // this function is the single entry point into S1.3, so the
      // screen-transition responsibility lives here rather than being
      // duplicated (and easy to miss) at every call site.
      showScreen('screen-item');

      currentItemIndex = index;
      var item = content.items[index];
      var itemAnswers = answers[item.id] || {};

      if (itemProgressEl) {
        itemProgressEl.textContent = 'Item ' + (index + 1) + ' of ' + content.items.length;
      }
      if (itemStatementEl) {
        itemStatementEl.textContent = item.statement;
      }

      itemSubquestionsEl.innerHTML = '';
      item.subQuestions.forEach(function (q) {
        var wrapper = document.createElement('fieldset');
        wrapper.className = 'subquestion';

        var legend = document.createElement('legend');
        legend.textContent = q.text;
        wrapper.appendChild(legend);

        ['yes', 'no', 'not_sure'].forEach(function (value) {
          var label = document.createElement('label');
          label.className = 'subquestion__option';

          var input = document.createElement('input');
          input.type = 'radio';
          input.name = q.id;
          input.value = value;
          input.checked = itemAnswers[q.id] === value;

          input.addEventListener('change', function () {
            fireStartedIfNeeded();
            answers[item.id] = answers[item.id] || {};
            answers[item.id][q.id] = value;
            persistState();
            updateItemStatus(item);
          });

          label.appendChild(input);
          label.appendChild(document.createTextNode(
            value === 'yes' ? ' Yes' : value === 'no' ? ' No' : ' Not sure'
          ));
          wrapper.appendChild(label);
        });

        itemSubquestionsEl.appendChild(wrapper);
      });

      itemBackBtn.hidden = index === 0;
      updateItemStatus(item);
    }

    function updateItemStatus(item) {
      var itemAnswers = answers[item.id] || {};
      var answered = ChecklistEngine.isItemAnswered(item, itemAnswers);

      if (!answered) {
        itemStatusPanelEl.hidden = true;
        itemGuidancePanelEl.hidden = true;
        itemNextBtn.disabled = true;
        return;
      }

      var status = ChecklistEngine.computeStatus(item, itemAnswers);

      itemStatusPanelEl.hidden = false;
      // Copy-framing rule (design-spec.md 2.1): "flagged as", never a
      // direct "you are ..." determination.
      itemStatusTextEl.textContent =
        'This item is flagged as: ' + ChecklistEngine.STATUS_LABELS[status];
      itemStatusTextEl.className = 'item-status-text item-status-text--' + status;

      if (status === 'not_compliant' || status === 'needs_check') {
        itemGuidancePanelEl.hidden = false;
        // Citation-only guidance (design-spec.md 2.4) — no remediation
        // content, ever. Exactly the status + the content file's own
        // citation object, nothing added or inferred here.
        itemGuidanceTextEl.textContent =
          (item.citation && item.citation.label ? item.citation.label + ': ' : '') +
          (item.citation && item.citation.reference ? item.citation.reference : '');
      } else {
        itemGuidancePanelEl.hidden = true;
      }

      itemNextBtn.disabled = false;
    }

    if (itemBackBtn) {
      itemBackBtn.addEventListener('click', function () {
        if (currentItemIndex > 0) {
          renderItemScreen(currentItemIndex - 1);
        }
      });
    }

    if (itemNextBtn) {
      itemNextBtn.addEventListener('click', function () {
        var item = content.items[currentItemIndex];
        if (!ChecklistEngine.isItemAnswered(item, answers[item.id] || {})) return;

        if (currentItemIndex + 1 < content.items.length) {
          renderItemScreen(currentItemIndex + 1);
        } else {
          completed = true;
          persistState();
          renderResults();
        }
      });
    }

    // ---- S1.4 / S1.5 — Results screens -------------------------------------

    function getFlaggedItems() {
      return content.items.filter(function (item) {
        var status = ChecklistEngine.computeStatus(item, answers[item.id] || {});
        return status !== 'compliant';
      });
    }

    function renderResults() {
      fireCompletedIfNeeded();

      var flagged = getFlaggedItems();

      if (flagged.length === 0) {
        renderCompliantResults();
        showScreen('screen-results-compliant');
      } else {
        renderFlaggedResults(flagged);
        showScreen('screen-results-flagged');
      }
    }

    function statusRecapList(container) {
      container.innerHTML = '';
      content.items.forEach(function (item) {
        var status = ChecklistEngine.computeStatus(item, answers[item.id] || {});
        var li = document.createElement('li');
        li.className = 'results-recap__item results-recap__item--' + status;
        li.textContent = item.statement + ' — flagged as: ' + ChecklistEngine.STATUS_LABELS[status];
        container.appendChild(li);
      });
    }

    function renderCompliantResults() {
      var list = document.getElementById('results-compliant-list');
      if (list) statusRecapList(list);
    }

    function renderFlaggedResults(flagged) {
      var list = document.getElementById('results-flagged-list');
      if (list) statusRecapList(list);

      var ctaBtn = document.getElementById('results-flagged-contact-btn');
      if (ctaBtn) {
        ctaBtn.onclick = function () {
          renderContactForm(flagged);
          showScreen('screen-contact');
        };
      }
    }

    var lowKeyContactLink = document.getElementById('results-compliant-contact-link');
    if (lowKeyContactLink) {
      lowKeyContactLink.addEventListener('click', function (event) {
        event.preventDefault();
        // No flagged items at all — the contact form still works with an
        // empty pre-checked list (design-spec.md 2.7's "zero items
        // flagged but still wants to talk to someone" edge case).
        renderContactForm([]);
        showScreen('screen-contact');
      });
    }

    // ---- S1.6 / S1.7 / S1.8 — Contact form ---------------------------------

    var contactItemsListEl = document.getElementById('contact-items-list');
    var contactEmailInput = document.getElementById('contact-email');
    var contactEmailError = document.getElementById('contact-email-error');
    var contactMessageInput = document.getElementById('contact-message');
    var contactSubmitBtn = document.getElementById('contact-submit-btn');
    var contactSubmitError = document.getElementById('contact-submit-error');
    var contactForm = document.getElementById('contact-form');

    function renderContactForm(flaggedItems) {
      contactItemsListEl.innerHTML = '';
      flaggedItems.forEach(function (item) {
        var label = document.createElement('label');
        label.className = 'contact-items__option';

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = item.id;
        checkbox.checked = true;
        checkbox.setAttribute('data-item-checkbox', '1');

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + item.statement));
        contactItemsListEl.appendChild(label);
      });

      if (flaggedItems.length === 0) {
        var note = document.createElement('p');
        note.className = 'contact-items__empty-note';
        note.textContent = 'No specific items are flagged — that\'s fine, tell us what\'s on your mind below.';
        contactItemsListEl.appendChild(note);
      }

      if (contactEmailError) {
        contactEmailError.hidden = true;
      }
      if (contactSubmitError) {
        contactSubmitError.hidden = true;
      }
      if (contactSubmitBtn) {
        contactSubmitBtn.disabled = false;
        contactSubmitBtn.textContent = 'Send';
      }
    }

    if (contactForm) {
      contactForm.addEventListener('submit', function (event) {
        event.preventDefault();

        // Debounce: bail if a submit is already in flight, mirroring
        // Phase 0's form.js double-click guard.
        if (contactSubmitBtn.disabled) return;

        var email = (contactEmailInput.value || '').trim();
        var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email === '') {
          showContactFieldError('Enter your email so we can follow up.');
          contactEmailInput.focus();
          return;
        }
        if (!emailRe.test(email)) {
          showContactFieldError("That doesn't look like a valid email.");
          contactEmailInput.focus();
          return;
        }
        clearContactFieldError();
        clearContactSubmitError();

        var selectedItems = Array.prototype.slice
          .call(contactItemsListEl.querySelectorAll('[data-item-checkbox]'))
          .filter(function (cb) {
            return cb.checked;
          })
          .map(function (cb) {
            return cb.value;
          });

        var message = (contactMessageInput.value || '').trim();

        contactSubmitBtn.disabled = true;
        contactSubmitBtn.textContent = 'Sending…';

        fetch(CONTACT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, items: selectedItems, message: message }),
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
              contactSubmitted = true;
              persistState();
              if (typeof root.trackChecklistContactSubmitted === 'function') {
                root.trackChecklistContactSubmitted();
              }
              renderContactConfirmation(selectedItems.length);
              showScreen('screen-contact-confirmation');
            } else {
              contactSubmitBtn.disabled = false;
              contactSubmitBtn.textContent = 'Send';
              showContactSubmitError();
            }
          })
          .catch(function () {
            // Network failure (S1.8) — preserve entered input, surface
            // the error visibly, allow retry. No silent failures.
            contactSubmitBtn.disabled = false;
            contactSubmitBtn.textContent = 'Send';
            showContactSubmitError();
          });
      });
    }

    function showContactFieldError(message) {
      if (!contactEmailError) return;
      contactEmailError.textContent = message;
      contactEmailError.hidden = false;
      contactEmailInput.setAttribute('aria-invalid', 'true');
    }

    function clearContactFieldError() {
      if (!contactEmailError) return;
      contactEmailError.textContent = '';
      contactEmailError.hidden = true;
      contactEmailInput.removeAttribute('aria-invalid');
    }

    function showContactSubmitError() {
      if (contactSubmitError) contactSubmitError.hidden = false;
    }

    function clearContactSubmitError() {
      if (contactSubmitError) contactSubmitError.hidden = true;
    }

    if (contactEmailInput) {
      contactEmailInput.addEventListener('input', function () {
        if (contactEmailError && !contactEmailError.hidden) clearContactFieldError();
      });
    }

    function renderContactConfirmation(itemCount) {
      var el = document.getElementById('contact-confirmation-message');
      if (!el) return;
      if (itemCount > 0) {
        el.textContent =
          'Thanks — ' + AGENCY_NAME + ' will be in touch soon to help with ' +
          itemCount + ' item' + (itemCount === 1 ? '' : 's') + '.';
      } else {
        el.textContent = 'Thanks — ' + AGENCY_NAME + ' will be in touch soon.';
      }
    }
  });
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
