# Phase 1 verification scripts

These are `/build`'s own real verification scripts, kept in the repo
rather than discarded after use so QA (or a future engineer) can re-run
them rather than take this build's verification on faith — consistent
with this pipeline's practice of independently re-verifying rather than
trusting prior claims (see the root `CLAUDE.md` decision log). QA still
owns the formal `/test` pass; these are engineering-level checks, not a
replacement for it.

## Zero-dependency checks (plain Node, no install needed)

```
node phase-1/tests/status-engine.test.js
node phase-1/tests/persistence.test.js
```

- **`status-engine.test.js`** — runs every Yes/No/Not-sure combination
  for every item in the real `public/content/items.en.json` placeholder
  content through the actual `computeStatus()` function exported by
  `public/assets/checklist.js` (not a reimplementation). Confirms the
  "any Not-sure -> Needs-check" fixed platform rule, the truth-table
  lookups, and the "unmatched Yes/No combination -> Needs-check" safety
  fallback (exercised by real content — see item-3's `_note`).
- **`persistence.test.js`** — runs `public/assets/persistence.js`'s real
  `load`/`save`/`clear` functions against a small in-memory
  `localStorage` polyfill (real `getItem`/`setItem`/`removeItem`
  semantics, not canned responses). Confirms a save -> reload -> resume
  cycle preserves exact sub-question answers, and that a
  `contentVersion` mismatch clears the record and reports `stale: true`
  rather than silently remapping old answers onto new questions.

## Browser-level check (needs setup)

```
cd phase-1/tests
npm install
# In another terminal, serve the app locally, e.g.:
#   cd phase-1/public && cp ../.env.example ../.env  # fill in local DB values
#   php -S 127.0.0.1:8091 -t . ../api   # or however you're running it locally
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
BASE_URL="http://127.0.0.1:8091" \
  node wizard-browser.test.js
```

`wizard-browser.test.js` uses `puppeteer-core` (no bundled Chromium
download) against a real local Chrome/Chromium binary, driving a real
headless browser through: intro -> qualifying question (Yes / No-exit /
Not-sure) -> all 4 items (including back-navigation live-recomputing a
changed item's status) -> both results variants -> the contact form
(pre-population, editable item selection, a validation error with
preserved input, then a real successful submission against a real local
backend + DB) -> confirmation copy -> a **real page reload** -> resume
(both a completed-session resume and a mid-checklist resume) -> cookie
banner Accept/Decline behavior and its persistence across a reload.

This requires:
- A real Chrome/Chromium binary locally (`CHROME_PATH`).
- The app actually running and reachable at `BASE_URL`, with a real
  local database configured (`api/contact.php`'s POST needs a working
  DB connection to succeed) — see the root `phase-1/README.md`'s local
  development section.

**Known environment quirk, not a product bug:** in the sandboxed
headless environment this suite was first developed in,
puppeteer-core's coordinate-based `page.click()` (a synthetic mouse
click at the element's on-screen position) silently failed to dispatch
to the target element, while the exact same button's real `onclick`
handler fires correctly when triggered via `element.click()` executed
in-page. This file's `clickEl()` helper uses the latter — it still
exercises the real button/handler/event-bubbling path, it just doesn't
rely on synthetic mouse coordinates. If a future environment doesn't
have this quirk, `page.click()` would work equally well; there was no
reason found to prefer one method once this was understood, so the
working one was kept.

## What none of these scripts can verify

- A real production deploy (real subdomain, real TLS, real Apache
  `.htaccess` behavior — PHP's built-in dev server ignores `.htaccess`
  entirely).
- Real GA4 events actually reaching a real property (no property exists
  yet for Phase 1 — see `phase-1/README.md`).
- Real email deliverability for the `NOTIFY_EMAIL` contact-form
  notification (`api/contact.php`'s `mail()` call) on the actual
  production host.

See `phase-1/README.md` and `phase-1/deploy/README.md` for the full
picture of what's verified vs. still open.
