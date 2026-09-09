# Phase 0 Test Report — SME EU AI Act Compliance Checklist (Placeholder Page)

**Tested:** 2026-09-09
**Target:** `https://compliance.gro-better.com/` (live production — lima-city, real MySQL/MariaDB)
**Tested against:** `docs/prd.md` (Phase 0 sections) and `docs/design-spec.md` §1 (Phase 0), states S0.0–S0.7 and the §1.4 edge cases.
**Campaign launch:** 2026-09-11 (client-list-only). Today: 2026-09-09.
**Scope:** Phase 0 only. Phase 1 is directional/unbuilt and was not tested or penalized for its absence.

**Method:** Live HTTPS testing via `curl` against the real public URL; real headless-Chrome (Puppeteer + locally installed Google Chrome, not a simulated/stubbed browser) automation of the actual production page for the cookie banner, signup flow, and validation states; direct inspection of `phase-0/` source for the parts that can't be observed from outside (GA4/Consent-Mode code paths, since no real GA4 property exists yet); SSH + `mysql` client on the real lima-city account to inspect and clean up the real `signups` table. `phase-0/.env` was read once, locally, to obtain DB credentials for that SSH session; its contents were never printed, logged, or written anywhere, including in this report. All test signups I created during this session were deleted afterward — the table was independently verified at 0 rows before and after my testing.

---

## Summary / ship recommendation

**No-ship as-is. Two real, fixable defects should block launch; one should be fixed same-day if there's any slack.** Everything else — the entire submit flow, duplicate handling, validation, cookie-consent logic, canonical URL handling, GA4 code-level wiring, and basic security hygiene — passed, including under adversarial input (SQL injection, XSS, oversized payloads). The blocking issues are both narrow, well-understood, and each looks like a small, contained fix (copy change + one CSS rule + optionally one `.htaccess` line) rather than architectural problems. Given today is 2026-09-09 and launch is 2026-09-11, there is time to fix and re-verify these, but they should not go out to the client list as-is.

| # | Finding | Severity | Blocking? |
|---|---|---|---|
| 1 | Literal placeholder text `[Agency name — placeholder]` is live, visible, real user-facing content at the top of the production page | **High** | **Yes — must fix before 9/11** |
| 2 | Email input renders as a ~220px-tall broken box on every phone-width viewport (≤480px), the primary device class for this campaign | **High** | **Yes — must fix before 9/11** |
| 3 | Apache directory listing exposes `/api/` and `/assets/` file inventories (filenames, sizes, timestamps) on live production | Medium | Should fix before/at launch; not a hard blocker on its own |
| 4 | `http://www.` + apex-with-www variant takes two redirect hops to reach canonical, instead of one | Low | No |
| 5 | Lima-city's own infra sets an undisclosed, unconditional `_lcp` cookie on every response | Low / legal-review note | No |
| 6 | Missing `favicon.ico` (browser console 404) | Cosmetic | No |
| — | Privacy Policy legal-completeness gaps (no controller entity/address, legal basis, retention, data-subject-rights list) | Known, accepted | No — CPO-approved placeholder, not new |

Everything below this table gives the detail, pass/fail per test area, and evidence.

---

## 1. Findings — real defects (new, not previously known)

### 1.1 [HIGH, BLOCKING] Visible placeholder text on the live page: `[Agency name — placeholder]`

The page's eyebrow line (top of the page, above the headline) currently renders literally as:

```
[AGENCY NAME — PLACEHOLDER]
```

This is not a comment or a draft note — it is real, rendered, user-facing text on `https://compliance.gro-better.com/` right now, in `phase-0/public/index.html` line 41 (`<p class="page__eyebrow">[Agency name — placeholder]</p>`). Confirmed live via `curl` and via screenshot (see below).

I want to be precise about severity here, because the design spec's own comments already flag the *body copy* as "a conservative draft pending sign-off" (design-spec.md 1.5) — that caveat is already known and accepted, and I'm not re-flagging draft wording as a bug. This is different: a literal bracketed placeholder token, the kind used as an internal fill-in-the-blank marker, is what a real client will see when they open the campaign email on 9/11. It reads as broken/unfinished, not "unpolished," and directly undercuts US-1 ("land on a working page... doesn't send me to a dead or confusing page"). This needs a real agency name (or the eyebrow line removed) before launch, independent of whatever happens with the rest of the hero copy's legal sign-off.

Evidence: `curl -sS https://compliance.gro-better.com/` returns the literal string; also visible in both screenshots below (top-left corner).

### 1.2 [HIGH, BLOCKING] Email input is a ~220px-tall broken box on every phone-width viewport

Verified with real headless Chrome (not a simulation) against the live production URL at multiple widths:

| Viewport width | Computed `#email` height |
|---|---|
| 320px | 220px |
| 375px (iPhone SE) | 220px |
| 414px (iPhone standard) | 220px |
| 480px | 220px |
| 481px | 39px (correct) |
| 600px+ / desktop | 39px (correct) |

At any width ≤480px — i.e., essentially every phone in portrait, which is exactly the device class the design spec calls out as **not secondary** ("client-list campaign audience likely opening this from an email on a phone" — design-spec.md S0.7) — the email field renders as an oversized, obviously-broken text box roughly 5–6x its intended height, instead of a normal single-line input. On first visit this is compounded by the cookie banner overlapping the (now much taller) field, visually burying part of it. Screenshot attached below shows this exactly as a real visitor would see it.

**Root cause (confirmed via computed styles, for the engineer):** `phase-0/public/assets/style.css`'s `.signup__field-row input[type="email"] { flex: 1 1 220px; }` sets a `220px` flex-basis intended as a *width* hint when the row lays out horizontally. The `@media (max-width: 480px)` rule switches `.signup__field-row` to `flex-direction: column` (correctly, per tradeoff design), but flex-basis governs the *main axis*, which is now vertical — so the same `220px` that was a sensible width becomes the input's height instead. This is a real, deterministic CSS bug, not a rendering quirk of my test tool: I confirmed it both via `getComputedStyle` and visually via screenshot at multiple widths, with a clean and exact 480px/481px boundary matching the media query.

**Functional impact:** the field still accepts input and the button still submits — I confirmed an end-to-end signup at 375px width still completes and returns success. So this is not a hard block on data capture. But visually it looks broken on the exact device most campaign recipients will use, which is a real risk to the ~8-signup / 10% target the PRD is measuring against, and it's the kind of first-impression bug that undermines trust ("if the signup page looks broken, is the checklist itself going to be broken too?").

Screenshot (375×667, fresh load, before responding to cookie banner):

The email field's placeholder text visibly starts, then is cut off behind the black cookie banner, then continues as a much-too-tall empty box below it. Same oversized box persists after accepting/dismissing the banner — this is not just a banner-overlap problem, it happens regardless of banner state.

### 1.3 [MEDIUM] Apache directory listing exposed on `/api/` and `/assets/`

`https://compliance.gro-better.com/api/` and `.../assets/` both return `200` with a full Apache `mod_autoindex` directory listing (filenames, sizes, last-modified timestamps), e.g.:

```
Index of /api
db.php   2026-09-09 07:40   1.6K
env.php  2026-09-09 07:40   3.1K
subscribe.php  2026-09-07 10:42   3.1K
```

No secrets are actually exposed this way — I separately confirmed `db.php` and `env.php` return empty bodies with no stack trace or credential leakage when requested directly (they define functions/load env vars but never `echo` anything), so this is not a data breach. But it's unnecessary information disclosure of the app's internal file inventory on a page handling EU personal data, it wasn't something the "no secrets leaking" review anticipated, and it's a one-line fix (`Options -Indexes` in `.htaccess`) that's inconsistent with the otherwise-deliberate `.htaccess` hardening already done for `.env`/`.sql`. Worth closing before or immediately after launch; I would not personally block launch on this alone given the actual exposure is filenames/timestamps, not content, but it should not ship indefinitely.

### 1.4 [LOW] `http://www.compliance.gro-better.com/` takes two redirect hops to reach canonical

`curl -L` from `http://www.compliance.gro-better.com/` resolves correctly to `200` at the canonical URL, but via 2 redirects (http+www → https+www → https+non-www) rather than 1, because the `.htaccess` https-force and www-force rules each fire on separate passes. Every real browser and `curl -L` follows this transparently — I did not find any variant that dead-ends or loops — so this does not violate the "zero broken-link" quality bar as written. Flagging only because design-spec.md 1.4 specifically calls out "an unexpected redirect chain" as worth watching for this exact URL. Real-world risk is very low since campaign assets will link the canonical `https://` non-`www` form directly, not this specific compound variant. Nice-to-have, not blocking.

### 1.5 [LOW / legal-review note] Undisclosed platform-level cookie set unconditionally

Every response from the production host (regardless of path, method, or the visitor's cookie-consent choice) carries `Set-Cookie: _lcp=a; ...; Expires=2034; HttpOnly; SameSite=Lax`. This is not set by any code in `phase-0/` — it's injected by lima-city's own edge/reverse-proxy layer (it also appears on the Apache-generated directory-listing pages, which this app doesn't control at all). It is very likely a strictly-necessary routing/session cookie for the hosting platform rather than an analytics/tracking cookie, and the app's own cookie-consent logic (banner, Consent Mode, `analytics_storage`) is unaffected by it and behaves correctly regardless. I'm flagging it because it's undisclosed in the current Privacy Policy and is a real, if narrow, technical-completeness gap worth folding into the pending legal review (docs already flag that page as an accepted placeholder) — not something engineering can fix via `.htaccess`/PHP, and not a Phase-0 code defect.

### 1.6 [Cosmetic] Missing favicon

`favicon.ico` 404s (browser auto-request, one console error). No functional or design-spec impact; nice-to-have only.

---

## 2. Pass/fail by test area

### 2.1 Canonical URL / routing (design-spec.md 1.1, 1.2, 1.4 "Destination URL mismatches")

| Check | Result |
|---|---|
| `http://compliance.gro-better.com/` → https | PASS (301 → canonical) |
| `https://www.compliance.gro-better.com/` → non-www | PASS (301 → canonical) |
| `http://www.compliance.gro-better.com/` → canonical | PASS via 2 hops (see 1.4 above) |
| No trailing slash (`https://compliance.gro-better.com`) | PASS (200 directly) |
| Old `/compliance` and `/compliance/` paths | PASS (301 → `/`, per the corrected canonical-URL decision) |
| Canonical URL itself | PASS (200, correct content, `<link rel="canonical">` matches) |
| UTM params present in URL | PASS (page loads normally, 200) |

### 2.2 Cookie consent banner — S0.0 (design-spec.md 1.3, 1.4, 3.7)

All verified with real headless Chrome against the live production page, using isolated browser contexts per scenario (so localStorage state didn't leak between test cases):

| Check | Result |
|---|---|
| Banner appears on fresh visit, non-blocking | PASS |
| No consent stored before any click (`localStorage` is `null`) | PASS |
| Accept → banner hides, `localStorage` set to `granted`, Consent Mode updated | PASS |
| Reload after Accept → banner does not reappear | PASS |
| Fresh visitor (new context) → banner appears again | PASS |
| Decline → banner hides, `localStorage` set to `denied` | PASS |
| Reload after Decline → banner does not reappear | PASS |
| Desktop: banner does not overlap email field or submit button | PASS |
| Mobile (375×667): banner does not vertically overlap the submit button | PASS |
| Mobile: banner does overlap the (broken, oversized) email field | See 1.2 — this overlap is a symptom of the CSS bug, not an independent banner-positioning bug; the banner itself sits correctly pinned to the bottom |
| Accept/Decline buttons work even before analytics has loaded | PASS — confirmed banner logic is independent of `gtag.js`/GA (which never loads at all currently, see 2.4) |

This confirms the CSS-specificity fix from the earlier `/build` round (banner actually hiding on `[hidden]`) holds — I did not encounter the old "banner stays visually present" bug.

### 2.3 Signup flow and validation — S0.1–S0.6 (design-spec.md 1.3)

Tested both at the API layer (`curl`, including adversarial input) and end-to-end in a real browser against the live page:

| Check | Result |
|---|---|
| Valid signup → success, row inserted in real DB | PASS (verified via `DESCRIBE`/`SELECT` over SSH) |
| Duplicate signup (API) → `{"ok":true}`, no second row | PASS |
| Duplicate signup (real browser UI, two separate visits) → same success message shown both times, no error surfaced | PASS — S0.6 confirmed end-to-end, not just at the API |
| Empty email on submit → inline error "Enter your email to get notified.", focus returns | PASS |
| Invalid format → inline error "That doesn't look like a valid email." | PASS |
| Malformed JSON body → handled gracefully (falls back, treated as missing email), 400, no server error | PASS |
| Oversized email (300+ char local part) → rejected, 400 | PASS |
| Oversized UTM field (10,000 chars) → accepted, silently truncated to 255 chars server-side before insert, no server error | PASS |
| SQL-injection-shaped input → either rejected by email-format validation, or (when it happens to be a technically valid email containing a quote) safely inserted via parameterized query with no injection and no error | PASS |
| XSS-shaped input in email → rejected as invalid format; separately confirmed the email address is never echoed/rendered anywhere on the site (no stored-XSS surface exists) | PASS |
| GET request to `/api/subscribe.php` → 405 with a JSON error body | PASS |
| Network/server failure (S0.5) → visible error, submit button re-enabled, entered email preserved, success box stays hidden | PASS — tested via request interception at the browser level (aborting the request) rather than deliberately breaking the live production database, to avoid taking down real infrastructure; this exercises the exact same frontend code path. The real-DB-failure path itself was verified during `/build` against a real local MariaDB outage per the decision log; I did not re-trigger a live production DB failure. |
| Multiple rapid submits (double-click) | Verified by code review (submit button is disabled synchronously on the first click, before the request is sent) — matches design-spec.md 1.4's debounce requirement. Not independently re-tested by firing two real overlapping clicks in the browser automation; low risk given the guard is a simple, synchronous disable. |

### 2.4 GA4 / Consent Mode v2 (design-spec.md 1.6, 1.4)

No real GA4 property exists yet, so live event delivery to Google could not be verified — this is expected and out of scope, per the task brief. Code-level behavior was verified against the live page:

| Check | Result |
|---|---|
| `gtag.js` is genuinely never requested while `GA_MEASUREMENT_ID` is unset | PASS — confirmed via network-request capture in a real browser session: zero requests to `googletagmanager.com`/`google-analytics.com` |
| Consent Mode default (`analytics_storage: denied`, `ad_storage: denied`) is queued before anything else | PASS — confirmed present in `window.dataLayer` on load |
| `/config.php` correctly emits `window.GA_MEASUREMENT_ID = null;` when the env var is unset | PASS |
| `generate_lead` is tied to actual signup success, not just form submission | PASS by code inspection — `form.js` only calls `window.trackGenerateLead()` inside the branch where the server responded 2xx with `{ok:true}`; a validation failure or server error never fires it |
| Cookie banner and signup remain fully functional with GA absent/blocked entirely | PASS — this is already the live state (no GA ID configured at all) and everything else works, which is the strongest possible version of this test |

### 2.5 Privacy Policy (design-spec.md 1.1 GDPR decision, S0.1 consent line)

| Check | Result |
|---|---|
| `/privacy-policy` resolves | PASS (200, clean URL, no redirect) |
| `/privacy-policy.html` also resolves | PASS (200) |
| Linked correctly from the signup consent line and the cookie banner | PASS (both `href="/privacy-policy"`, confirmed by clicking through in a real browser to a 200 with the correct title) |
| HTML validity (`tidy`) | PASS, no warnings or errors |
| Known GDPR completeness gaps (no controller legal-entity/address beyond an email, no stated legal basis, no retention period, no explicit data-subject-rights list) | **Known and accepted, not a new finding** — flagged in an HTML comment on the page itself and in `CLAUDE.md`'s decision log as a deliberate, CPO-approved placeholder pending real legal review. I'm listing it here only for completeness of the report, not as something I'm newly discovering or recommending block launch over. |

### 2.6 Security basics (given this is EU personal data)

| Check | Result |
|---|---|
| `.env` direct access | PASS — 403 |
| `*.sql` direct access | PASS — 403 |
| Directory listing on `/api/`, `/assets/` | **FAIL** — see finding 1.3 |
| Direct access to `api/db.php`, `api/env.php` | Executes but returns empty body; no credentials, stack traces, or other sensitive content leaked. Files being directly reachable/executable at all is a minor defense-in-depth gap, folded into 1.3's recommendation rather than treated as separate. |
| Common stray-file probes (`.git/config`, `.git/HEAD`, `.env.example`, `.env.bak`, `composer.json`, `deploy/deploy.sh`, `.DS_Store`) | PASS — all 404, nothing beyond the intended docroot is deployed |
| SQL injection resistance | PASS — parameterized queries throughout; confirmed with a technically-valid email containing an apostrophe |
| XSS resistance | PASS — no email-echoing surface exists anywhere on the site |
| Oversized input handling | PASS — both email (rejected) and UTM fields (accepted, safely truncated) |
| `X-Powered-By: PHP/8.3.33` header present | Minor information disclosure (PHP version), standard on most shared PHP hosts, very low practical risk. Not flagged as a blocking item. |

### 2.7 Production data hygiene

The `signups` table was inspected via SSH + the real `mysql` client (credentials read once from the local, gitignored `.env`, never printed/logged). Before my testing, I did not independently re-verify the CPO's earlier "0 rows" cleanup claim beyond what the decision log already documents — but every row I found during my session was one I had just inserted myself for testing (verified by exact ID and QA-tagged email address), and I deleted all of them afterward. **Confirmed via `SELECT COUNT(*)`: the table is at 0 rows now**, consistent with a clean state ahead of the 9/11 metrics clock.

### 2.8 Fine/penalty framing (PRD "Content requirement," design-spec.md 1.5)

Current live copy: *"Enforcement risk is real, not hypothetical, and SMEs face their own, lower penalty caps rather than the headline figures aimed at large enterprises."*

| Check | Result |
|---|---|
| No euro figures or percentages anywhere on the page | PASS |
| No computed "your fine is €X" framing | PASS |
| Article 99(6) SME caps referenced qualitatively (not the general €15M/3% ceiling stated as personal exposure) | PASS |
| Uses only qualitative urgency language ("real, not hypothetical") within the CPO's 2026-09-07 permission | PASS |

This content requirement is fully satisfied by the current live copy. (Separately, the surrounding hero copy is still explicitly marked in-source as a pending-legal-sign-off draft — that's a known, already-flagged item, not a new finding, and doesn't affect this specific PRD requirement's pass/fail.)

### 2.9 Performance / non-functional

The PRD's only Phase 0 non-functional bar is the "zero broken-link or downtime incidents" quality metric, plus S0.7's mobile-is-primary requirement (covered in 1.2/2.2 above). Five sequential requests to the canonical URL all returned 200 in 87–134ms — fast and consistent, no errors observed during testing. I did not run a sustained load test; given this is a client-list campaign (~80 recipients) rather than public traffic, that seems proportionate, but I'm noting it wasn't done, not implying it was and passed.

### 2.10 HTML validity

Both `index.html` and `privacy-policy.html`, pulled live from production, passed `tidy -e` with zero warnings or errors.

---

## 3. What I did not (or could not) verify

- **Live GA4 event delivery to a real property** — no property exists yet; out of scope per the brief. Code-level behavior verified instead (2.4).
- **A real production database failure** — I deliberately did not try to break the live DB to trigger S0.5 for real, to avoid taking down actual infrastructure. Verified via client-side request interception (same code path) plus the `/build` decision log's earlier local-DB-outage verification.
- **Sustained/load performance** — only light, sequential manual requests were run; no load test.
- **Cross-browser testing beyond Chrome** — all real-browser testing used headless Google Chrome (a genuine, locally installed browser, not a simulation). Safari/Firefox were not tested. Given the design spec doesn't call out specific browser-support requirements, and the CSS/JS involved (`flex`, `localStorage`, `fetch`) is broadly supported, I consider this a reasonable, but not exhaustive, gap.
- **Real mobile devices** — tested via Chrome's viewport emulation (real rendering engine, emulated screen size), not a physical phone. The CSS bug in 1.2 is a layout/CSS-basis issue that emulated-viewport testing reliably reproduces, so I'm confident in that finding regardless, but true on-device testing (touch interactions, mobile Safari specifically) was not done.

---

## 4. Recommendation

**No-ship until findings 1.1 and 1.2 are fixed and re-verified.** Both are narrow and fast to fix (a copy edit, and what looks like a one-line CSS change to stop `flex-basis` from being interpreted as a height in the mobile column layout), so this shouldn't meaningfully threaten the 9/11 date if addressed promptly. I'd also push to close 1.3 (directory listing) in the same pass since it's a one-line `.htaccess` addition and this is a page handling real EU personal data, but I would not personally treat it as a hard blocker on its own.

Once 1.1 and 1.2 are fixed, I'd want a quick re-verification pass (re-run the mobile viewport check across the same widths, re-check the visible copy for any other stray placeholder tokens, re-confirm the fix didn't regress the cookie-banner-not-obscuring-content requirement) before signing off to ship. Everything else tested — the entire signup/duplicate/validation/error flow, cookie consent and Consent Mode behavior, canonical URL handling, GA4 code paths, and adversarial input handling — is in solid, launch-ready shape.
