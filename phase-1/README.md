# Phase 1 — Full interactive checklist (engineering README)

This is the engineering README for `/build`'s work — written for whoever
picks this codebase up next (QA, a future engineer, or this same
pipeline resuming later), not for the end user (there is no end-user
README for Phase 1 yet; that's `/ship`'s job once this reaches that
stage). See the root `CLAUDE.md` decision log for the pipeline's current
stage and status.

Built against the approved plan at
`~/.claude/plans/sprightly-stargazing-toucan.md`, `docs/prd.md` (US-5–
US-11), and `docs/design-spec.md` Section 2. Phase 0 (the placeholder
page, live at `https://compliance.gro-better.com/`) is untouched by this
work — see `phase-0/README.md` for that app.

## ⚠️ All checklist content is placeholder

Every item statement, sub-question, and citation in
`public/content/items.en.json` is a deliberately obvious placeholder
(`[PLACEHOLDER — pending legal sanity-check]`, `_NOTICE` field at the
top of the file) — **not real Article 50 text**. Real content is blocked
on the still-running legal sanity-check referenced in `docs/prd.md` and
`docs/design-spec.md` Section 2. The status-computation *mechanism* is
real and fully tested (see Verification below); the *words* it operates
on are not. Swapping in real content once the legal sanity-check
delivers is a content-file edit (`items.en.json`), not a code change —
this was a deliberate design goal (/plan Section 3), not a side effect.

## Layout

- `public/` — everything served to the browser:
  - `index.html` — all wizard screens (intro, qualifying question, item
    template, both results variants, contact form, confirmation) as
    plain `<section class="screen">` elements, shown/hidden by
    `checklist.js`.
  - `assets/checklist.js` — two clearly separated halves: a pure,
    DOM-independent `ChecklistEngine` (status computation) exposed to
    both the browser and a Node test harness, and a DOM-dependent wizard
    controller that only runs in a browser.
  - `assets/persistence.js` — save/resume against `localStorage`
    (`checklist_progress_v1`). See its header comment and /plan Section
    5 for the exact data shape and staleness handling.
  - `assets/analytics.js`, `assets/cookie-banner.js` — adapted from
    `phase-0/public/assets/` for Phase 1's own origin/events (see
    "Why a second cookie banner" below).
  - `assets/style.css` — wizard styling. Deliberately avoids the
    `flex-basis`-becomes-height CSS bug class that caused two real
    production incidents in Phase 0 (see the stylesheet's own header
    comment) — fixed proactively here rather than rediscovered.
  - `content/items.en.json` — the content data model (see above).
  - `config.php` — env-driven `GA_MEASUREMENT_ID`, same pattern as
    Phase 0's `public/config.php`.
  - `.htaccess` — canonical-URL scaffolding (host-agnostic, no
    hardcoded domain — see "Canonical URL" below), `.env`/`.sql` deny
    rule, `Options -Indexes` (applied from the start, not added after a
    `/test` finding the way Phase 0's was).
- `api/` — `contact.php` (POST endpoint, US-10's backend surface),
  `db.php`, `env.php` — copied and adapted from `phase-0/api/`, not
  shared, per /plan Section 1 (keeps Phase 0 and Phase 1 independently
  deployable/rollback-able).
- `db/schema.sql` — `contact_requests` table, standard SQL only.
- `deploy/` — `deploy.sh` / `apply-schema.sh` / `push-env.sh` +
  `README.md`, Phase 1's own copies of Phase 0's deploy scripts,
  carrying forward the `--exclude ".env"` / `--exclude "api"` fix
  Phase 0 needed after a real production incident.
- `tests/` — this build's own verification scripts, kept in the repo
  rather than discarded — see `tests/README.md`.
- `Dockerfile`, `docker-compose.yml` — local dev parity only (ports
  8081/3307, distinct from Phase 0's 8080/3306, so both can run side by
  side).
- `.env.example` — placeholders only, never real secrets.

## Local development

**Docker was checked first and is not installed in this environment**
(the same situation Phase 0's `/build` hit) — verification below was
done natively: PHP 8.5 (Homebrew) + MariaDB 12.3 (Homebrew), matching
Phase 0's own pivot. `Dockerfile`/`docker-compose.yml` are provided and
written the same way Phase 0's were, but were not themselves run in this
environment; they're straightforward Apache+PHP+MariaDB containers using
the same proven shape as Phase 0's, not new/risky code.

Native local setup (what was actually used for every check below):

```
brew services start mariadb   # if not already running
mysql -u "$(whoami)" -e "
  CREATE DATABASE IF NOT EXISTS sme_compliance_p1;
  CREATE USER IF NOT EXISTS 'app'@'localhost' IDENTIFIED BY 'app_password';
  GRANT ALL PRIVILEGES ON sme_compliance_p1.* TO 'app'@'localhost';
"
mysql -u app -papp_password sme_compliance_p1 < db/schema.sql

# Merge public/ + api/ into one docroot, matching the deployed layout
# (this is what Dockerfile does, and what public/config.php's own
# comment explicitly calls out as load-bearing — see Phase 0's real
# path-bug history):
mkdir -p /tmp/phase1-docroot
rsync -a public/ /tmp/phase1-docroot/
rsync -a api/ /tmp/phase1-docroot/api/
cat > /tmp/phase1-docroot/.env <<EOF
DB_HOST=127.0.0.1
DB_NAME=sme_compliance_p1
DB_USER=app
DB_PASSWORD=app_password
EOF

cd /tmp/phase1-docroot && php -S 127.0.0.1:8091
```

Then open `http://127.0.0.1:8091`.

## Canonical URL — not yet decided

`/plan` Open Question 2 recommends a new subdomain (e.g.
`checklist.gro-better.com`) but this is a real DNS/hosting decision, not
an engineering one — same category of decision that took several real
iterations to land on for Phase 0 (`compliance.gro-better.com`, see the
root `CLAUDE.md` decision log). Nothing in this codebase hardcodes a
domain name anywhere in application logic; `.htaccess`'s rules are
host-agnostic (`%{HTTP_HOST}`-based), and the canonical URL only appears
in a commented-out `<link rel="canonical">` in `index.html` and in
documentation, exactly the same "build it configurable, decide the real
value later" pattern Phase 0 used for `GA_MEASUREMENT_ID`.

## Why a second cookie banner (not Phase 0's)

Phase 1 is a new subdomain/origin from Phase 0 — `localStorage` and
cookie choices don't carry across origins. A visitor who already
accepted cookies on `compliance.gro-better.com` will be re-prompted here.
This is a disclosed tradeoff from /plan Section 2, not a bug.

## Judgment calls made during `/build` (flagged, not silently decided)

- **Privacy-policy link.** The cookie banner and no other consent
  surface on this page link to Phase 0's existing
  `https://compliance.gro-better.com/privacy-policy` (cross-domain)
  rather than duplicating a second privacy policy for a second
  subdomain of the same agency. Neither the plan nor the design spec
  specified this either way. That existing page also has known GDPR
  content gaps (no data-controller address, no stated legal basis, no
  retention period — see the root `CLAUDE.md` 2026-09-09 decision log)
  which this link inherits rather than duplicates or fixes; still
  pending the same real legal review already tracked for Phase 0.
- **"Start" vs. an existing resumable record.** The design spec says
  intro offers "Resume" alongside "Start" but doesn't say what clicking
  a fresh "Start" does if a resumable record already exists. This build
  clears the old record and starts fresh in that case (a
  `Start over` button, distinct from `Resume`) — avoids an ambiguous
  merge of old and new answers.
- **A "No" answer to the qualifying question is not persisted.** There
  is nothing meaningful to resume from an immediate exit, so no
  save/resume record is created until the user actually enters the
  checklist (`qualifyingAnswer` is `yes` or `not_sure`).
- **`checklist_completed` fires once per page load**, guarded by an
  in-memory flag, not once per browser session — reaching the results
  screen a second time via back-navigation-then-forward within the same
  page load does not re-fire it, but a fresh page load (including a
  resumed session) can. Not specified either way by the design spec;
  this reads "completed" as "reached the results screen" per
  `docs/prd.md`'s own metric definition, applied per page load.

## Open items — defaults applied per `/build`'s instructions, NOT CPO-confirmed

These resolve `/plan`'s "open items for the CPO" using the plan's own
stated recommendations, because `/build` was instructed to apply them as
defaults rather than block. **None of these are final decisions** — flag
for explicit CPO sign-off before `/ship`:

1. **Fine-framing.** Phase 1 does NOT inherit Phase 0's
   qualitative-urgency-language permission (design-spec.md 2.6 requires
   its own confirmation). This build mentions fines exactly once, on the
   intro screen, in conservative, non-alarmist, non-quantitative
   language that notes Article 99(6) SME caps exist without stating any
   figure — and deliberately does not repeat it on the results screen,
   per the instruction to avoid fine-adjacent copy where avoidable.
2. **Canonical subdomain.** Not decided — see "Canonical URL" above.
   `checklist.gro-better.com` appears only in comments/docs as a
   placeholder, never in logic.
3. **Notification channel.** PHP `mail()`, recipient from `NOTIFY_EMAIL`
   env var. **Deliverability on the real production host is completely
   unverified** — see Verification below. `contact_requests.notified_at
   IS NULL` is the queryable fallback if it proves unreliable.
4. **Content file format.** JSON, per the plan's own recommendation.
5. **Local-storage staleness handling.** Implemented exactly as /plan
   Section 5 recommended: a `contentVersion` mismatch clears the record
   and shows "this checklist has been updated, please start again."
   Real, tested behavior (see Verification) — but still a recommendation
   the design spec explicitly left open for the CPO, not a confirmed
   final decision.
6. **`checklist_item_completed` GA4 event.** Skipped, per instruction —
   only the three PRD-required events exist
   (`checklist_started`, `checklist_completed`,
   `checklist_contact_submitted`).
7. **GA4 property.** Same pattern as Phase 0 — env-driven
   `GA_MEASUREMENT_ID`, actual property ID is a GA4-admin decision for
   later, not resolved here.

## Standing, not new (carried from `/plan` and `/design`)

- The PRD/design tension on US-7 (remediation content being cut narrows
  US-7 as literally written) — not this build's call, surfaced for
  CPO/PM reconciliation in `docs/prd.md`.
- Sub-question copy phrasing (factual self-check vs. legal-advice-
  adjacent) — this build wrote sub-questions as obvious placeholders
  ("[Placeholder, factual self-check — not legal advice] ...") rather
  than trying to resolve the real phrasing question, since real wording
  is downstream of the legal sanity-check anyway.

## Verification — what was actually checked, and how

Locally verified for real (native PHP/MariaDB, no Docker — see "Local
development" above for why):

- **Syntax/lint:** `php -l` clean on every `.php` file (one real bug
  caught and fixed: a docblock comment in `api/env.php` containing the
  literal substring `*/` closed the comment early and corrupted the rest
  of the file into invalid PHP — a real, if unusual, catch).
  `node --check` clean on every `.js` file. `tidy -e` clean on
  `index.html`. `items.en.json` parses as valid JSON.
- **Schema:** `db/schema.sql` applies cleanly to a real local MariaDB
  instance (`DESCRIBE contact_requests` confirmed the exact expected
  shape).
- **Contact endpoint, full flow, against a real local DB** (merged
  docroot mirroring the deployed layout, exactly the way Phase 0 caught
  its real `config.php` path bug): `GET` → 405; empty/invalid email →
  400 with the right message; a valid submission inserts a row with the
  right shape; a second submission from the same email inserts a
  **second** row rather than erroring or deduplicating (design-spec.md
  2.7 — contact requests are not deduplicated, unlike Phase 0's
  signups); a simulated DB failure (bad credentials) returns the
  generic visible error with the real cause only in the server log,
  never leaking to the client (S1.8); `config.php` confirmed emitting
  both `null` (unset `GA_MEASUREMENT_ID`) and a real value once set;
  `NOTIFY_EMAIL`'s best-effort `mail()` code path was exercised locally
  (it "succeeded" against the local machine's own `sendmail`, which
  proves the code path and `notified_at` bookkeeping work — it proves
  **nothing** about real-world deliverability from the actual production
  host, see the open item above).
- **Status engine — every combination, using real content:**
  `tests/status-engine.test.js` runs every Yes/No/Not-sure combination
  for all 4 real placeholder items (50 checks total) through the actual
  `computeStatus()` function, confirming: the "any Not-sure ->
  Needs-check" override holds regardless of other answers; every
  Yes/No combination in the truth tables resolves correctly; a
  deliberately-unmatched Yes/No combination in item-3's content (see its
  `_note`) correctly falls back to Needs-check rather than guessing; a
  partially-answered item returns `null` rather than a guessed status.
- **Save/resume — real logic, simulated storage:**
  `tests/persistence.test.js` runs the actual `load`/`save`/`clear`
  functions against a real (if in-memory) `localStorage`-shaped object:
  a fresh load, a save → reload → resume cycle preserving exact
  per-question answers (including a mid-item partial answer), and a
  `contentVersion` bump correctly clearing the record and reporting
  `stale: true` rather than silently remapping old answers.
- **Full wizard, in a real headless browser (not just DOM-level
  simulation):** `tests/wizard-browser.test.js` uses `puppeteer-core`
  against the system's real installed Google Chrome (no bundled
  Chromium download) to click through the entire flow for real — intro,
  qualifying question (Yes / No-exit / Not-sure), all 4 items including
  back-navigation live-recomputing a changed status, both results
  variants, the contact form (pre-population, editable selection, a
  real validation error with preserved input, then a real successful
  submission against the real local backend+DB), the confirmation
  screen's copy, **a real page reload** confirming both a
  completed-session resume and a mid-checklist resume, and the cookie
  banner's Accept/Decline behavior and its persistence across a reload.
  51 checks, 0 failures, 0 uncaught JS errors during the walkthrough.
  **This caught one real bug**, described below.

### One real bug found and fixed during this verification

`renderItemScreen()` updated the item screen's *content* correctly on
every path, but only one call site (`Next`/`Back`, where the item screen
was already the visible screen) happened to work by coincidence — the
qualifying-question → item-1 transition and the resume-into-an-item path
never actually called `showScreen('screen-item')`, so the item screen's
container stayed `hidden` even though its contents were fully rendered
underneath. The browser test caught this because its DOM queries
(`querySelector`, `dispatchEvent`) work regardless of visibility, so the
first version of the test suite passed on hidden content and only the
explicit "is this screen visible" assertions failed. Fixed by moving the
`showScreen('screen-item')` call to the top of `renderItemScreen()`
itself, so every caller gets it for free — re-verified with a full clean
re-run (51/51) afterward.

### Explicitly NOT verifiable in this local environment

- A real production deploy (real subdomain, real TLS/HTTPS, real
  Apache `.htaccess` behavior for the canonical-URL redirects and the
  `.env`/`.sql` deny rule — PHP's built-in dev server ignores
  `.htaccess` entirely, same limitation Phase 0's `/build` had).
- Whether the production host supports real process-level PHP env vars
  or needs `api/env.php`'s `.env`-file fallback (both are wired and
  locally tested; which one actually applies is unconfirmed, same
  caveat Phase 0 carried before its own real deploy).
- Whether the production host's SSH shell has a `mysql` client
  (needed by `deploy/apply-schema.sh`).
- Real PHP `mail()` deliverability from the actual production host —
  see the `NOTIFY_EMAIL` open item above.
- Real GA4 events reaching a real property — no property exists yet;
  `analytics.js` skips loading `gtag.js` entirely while
  `GA_MEASUREMENT_ID` is unset, exactly like Phase 0 handled the same
  gap pre-launch.
- Cross-browser/real-device rendering (this build's headless-Chrome test
  is real Chrome, but only one engine, one viewport, one machine) —
  Phase 0's own history (the cookie-banner/email-input CSS bugs) shows
  real human multi-device testing at `/test` found things headless
  automation alone didn't.

See `phase-1/deploy/README.md`'s verification checklist for what "done"
means once a real subdomain and credentials exist.
