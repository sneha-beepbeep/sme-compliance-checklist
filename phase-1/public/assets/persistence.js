/**
 * Save/resume persistence for the Phase 1 checklist (design-spec.md S1.9,
 * data-shape per /plan Section 5).
 *
 * Confirmed requirement (CPO, 2026-09-11): lightweight, local-only,
 * no-account save/resume. Storage key is version-suffixed
 * ("checklist_progress_v1") for future migration, per the plan.
 *
 * What's stored (per the plan — deliberately NOT the computed status):
 *   - contentVersion: the items.en.json contentVersion active when this
 *     record was written.
 *   - qualifyingAnswer: "yes" | "no" | "not_sure" | null
 *   - answers: { [itemId]: { [subQuestionId]: "yes"|"no"|"not_sure" } }
 *   - currentItemId: the item the user was last on (or null)
 *   - completed: boolean — reached the results screen
 *   - contactSubmitted: boolean — informational only; a second contact
 *     submission is still allowed and treated as a normal message
 *     (design-spec.md 2.7), this flag doesn't block anything.
 *
 * Status is intentionally never stored — it's always recomputed live from
 * the current content file (see checklist.js's ChecklistEngine), so a
 * returning user can revise a single sub-answer and have the status
 * recompute, and any future fix to the status logic applies retroactively
 * to a resumed session, mirroring Phase 0's no-silent-failure principle
 * (design-spec.md 2.2e, Section 3 tradeoff 10).
 *
 * Staleness handling (recommendation-turned-default per /build's
 * instructions, NOT yet a CPO-confirmed final decision — see /plan
 * Section 5 and Open Question 5): if a stored record's contentVersion
 * does not match the live content file's contentVersion, the record is
 * cleared outright rather than remapped — the caller is told `stale:
 * true` so it can show an honest "this checklist has been updated,
 * please start again" message instead of silently reusing answers that
 * may no longer line up with the current questions.
 *
 * Environment note: this file references `localStorage` via a small
 * indirection (`getStorage()`) rather than `window.localStorage`
 * directly, purely so a Node test harness can exercise this logic
 * without a real browser DOM — see phase-1/README.md's verification
 * section. In a real browser this behaves identically to referencing
 * `window.localStorage` directly.
 */

(function (root) {
  'use strict';

  var STORAGE_KEY = 'checklist_progress_v1';

  function getStorage() {
    try {
      if (typeof root.localStorage !== 'undefined' && root.localStorage) {
        return root.localStorage;
      }
    } catch (e) {
      // Accessing localStorage can throw in some private-browsing modes.
    }
    return null;
  }

  function emptyState(contentVersion) {
    return {
      contentVersion: contentVersion,
      qualifyingAnswer: null,
      answers: {},
      currentItemId: null,
      completed: false,
      contactSubmitted: false,
    };
  }

  function clear() {
    var storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(STORAGE_KEY);
    } catch (e) {
      // No-op — nothing else to fall back to.
    }
  }

  /**
   * Load any stored progress and compare it against the live content's
   * contentVersion.
   *
   * Returns:
   *   { state: null, stale: false }  — nothing stored yet (fresh visitor).
   *   { state: null, stale: true }   — something was stored, but for an
   *                                     older contentVersion; the record
   *                                     was cleared as a side effect.
   *   { state: {...}, stale: false } — a valid, current-version record.
   */
  function load(currentContentVersion) {
    var storage = getStorage();
    if (!storage) {
      return { state: null, stale: false };
    }

    var raw;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch (e) {
      return { state: null, stale: false };
    }

    if (!raw) {
      return { state: null, stale: false };
    }

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Corrupt record — treat like nothing was ever stored, but clear it
      // so we don't keep re-parsing garbage on every load.
      clear();
      return { state: null, stale: false };
    }

    if (!parsed || typeof parsed !== 'object') {
      clear();
      return { state: null, stale: false };
    }

    if (parsed.contentVersion !== currentContentVersion) {
      clear();
      return { state: null, stale: true };
    }

    // Defensive normalization in case an older/partial record is missing
    // a field this version of the app expects.
    var normalized = emptyState(currentContentVersion);
    normalized.qualifyingAnswer = parsed.qualifyingAnswer || null;
    normalized.answers = (parsed.answers && typeof parsed.answers === 'object') ? parsed.answers : {};
    normalized.currentItemId = parsed.currentItemId || null;
    normalized.completed = !!parsed.completed;
    normalized.contactSubmitted = !!parsed.contactSubmitted;

    return { state: normalized, stale: false };
  }

  function save(state) {
    var storage = getStorage();
    if (!storage) {
      // No localStorage available (private mode, blocked, etc.) — the
      // checklist still works for this single session, it just won't
      // resume on a reload. Not a submission-critical failure (that's
      // S1.8's contact-form territory), so this fails silently by design.
      return false;
    }
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  var ChecklistPersistence = {
    STORAGE_KEY: STORAGE_KEY,
    emptyState: emptyState,
    load: load,
    save: save,
    clear: clear,
  };

  root.ChecklistPersistence = ChecklistPersistence;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChecklistPersistence;
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
