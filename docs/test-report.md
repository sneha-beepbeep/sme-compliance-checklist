# Phase 0 Test Report — SME EU AI Act Compliance Checklist (Placeholder Page)

**Tested:** 2026-09-09 (fresh, full re-test — supersedes the 2026-09-09 report written before this fix pass; this is not a patch/append, every check below was re-run independently)
**Target:** `https://compliance.gro-better.com/` (live production — lima-city, real MySQL/MariaDB)
**Tested against:** `docs/prd.md` (Phase 0 sections) and `docs/design-spec.md` §1 (Phase 0), states S0.0–S0.7 and the §1.4 edge cases.
**Campaign launch:** 2026-09-11 (client-list-only). Today: 2026-09-09.
**Scope:** Phase 0 only. Phase 1 is directional/unbuilt and was not tested or penalized for its absence.

**Why this pass exists:** the prior `/test` pass found two blocking defects (a literal `[Agency name — placeholder]` string live on production, and a mobile email input rendering as a ~220px-tall broken box on every viewport ≤480px) plus a medium directory-listing exposure. The CPO looped back to `/build`; the engineer fixed all three and self-verified; the orchestrator then independently spot-checked those fixes. None of that constituted an independent QA pass — this report is that pass, run cold, against the live site as it stands today, not against anyone else's claims. Fixing the email input also exposed an identical, previously-masked bug in the cookie banner's own text element, which the fixing engineer reports may still cause overlap on the shortest phones. That claim gets its own independent, from-scratch verification below (§2), not a trust-and-move-on.

**Method:** Live HTTPS testing via `curl` against the real public URL, including adversarial payloads; real headless Google Chrome (Puppeteer + a locally installed, genuine Chrome binary — not a simulated/stubbed browser) driving the actual production page for viewport/overlap/click testing, the cookie banner, the full signup flow, and validation states; direct inspection of live-served JS/PHP source (`analytics.js`, `config.php`) for GA4/Consent-Mode behavior that can't be fully observed from outside; SSH + the real `mysql` client on the lima-city account (via the account's own server-side `.env`, so no local secret ever left this machine) to inspect and clean up the real `signups` table. `phase-0/.env` was read once, locally, only to confirm the SSH connection details already given to me; its contents were never printed, logged, or written anywhere, including in this report — DB access itself was performed by sourcing the **server's own** `.env` over the SSH session, not by transmitting local credentials. All test data I created (7 rows total across the session, all `qa-*`-prefixed test addresses) was deleted immediately after use; the table was independently verified at 0 rows before, during (only my own rows present, confirmed by exact ID/prefix), and after this session.

---

## Summary / ship recommendation

**No-ship as-is, but narrowly.** All three previously-blocking/medium findings are now genuinely fixed and independently re-verified — not just re-confirmed on the orchestrator's word. One new real defect surfaced during independent re-testing: **the cookie banner does still overlap and functionally block the email field/submit button on a specific, non-trivial band of shorter phone viewports**, confirmed with actual simulated taps failing to land in the field, not just a visual read. Below that finding is a full independent measurement of exactly which devices are and are not affected, which refines (and in one respect corrects) the fixing engineer's own report. Everything else — full signup/duplicate/validation/error flow, cookie-consent persistence, canonical URL handling, GA4 code-level Consent Mode wiring, and adversarial-input handling — passed cleanly.

| # | Finding | Severity | Blocking? | Status vs. last report |
|---|---|---|---|---|
| 1 | Cookie banner fully covers and functionally blocks tapping the email field and submit button, on first visit (before Accept/Decline), on phones in roughly the 640–700px logical-height band | **High** | **Yes — recommend fixing before 9/11** | **New** (surfaced by, not caused by, the fix to Finding 2 below) |
| 2 | `[Agency name — placeholder]` literal placeholder text | — | — | **Fixed, independently re-verified.** Eyebrow now reads "gro digital agency"; no bracket tokens found anywhere in rendered (non-comment) HTML on either live page. |
| 3 | Email input ~220px-tall broken box on viewports ≤480px | — | — | **Fixed, independently re-verified.** Computed height is a correct ~39px at 320/375/414/480/481/600/768/1024px — full matrix re-run fresh, not spot-checked. |
| 4 | `/api/`, `/assets/` directory listing exposed | — | — | **Fixed, independently re-verified.** Both now return `403 Forbidden` with an Apache error page, no file inventory. |
| 5 | `http://www.` + apex-with-www variant takes two redirect hops | Low | No | Unchanged, known/accepted |
| 6 | Lima-city's own infra sets an undisclosed `_lcp` cookie unconditionally | Low / legal-review note | No | Unchanged, known/accepted |
| 7 | Missing `favicon.ico` | Cosmetic | No | Unchanged, known/accepted |
| — | Privacy Policy legal-completeness gaps | Known, accepted | No | Unchanged — still explicitly flagged in-source as a placeholder pending real legal review |

Everything below gives full detail, evidence, and pass/fail per test area.

---

## 1. Re-verification of the three previously-fixed issues

### 1.1 Placeholder text — FIXED, confirmed

`curl`-fetched the live page fresh and searched the rendered HTML (HTML comments stripped first, since the source deliberately keeps internal "PLACEHOLDER copy pending legal sign-off" comments as engineering notes — those are not user-facing and not a defect). Result: **zero bracketed tokens anywhere in visible content** on either `index.html` or `privacy-policy.html`. The eyebrow line now reads `gro digital agency` (`<p class="page__eyebrow">gro digital agency</p>`), confirmed both via `curl` and screenshot.

One thing worth flagging precisely so it isn't confused with the fixed bug: `privacy-policy.html`'s source still contains an HTML comment mentioning "the unfilled `[blog URL]` placeholder" — but that's a **team-only code comment describing what was already cleaned up**, not live content; it is never rendered. I checked specifically because it superficially looks similar to the old bug. It isn't — it's a `<!-- -->` comment, invisible to any visitor, and it correctly documents a past fix rather than exposing a live token.

### 1.2 Email input mobile rendering — FIXED, confirmed

Re-ran the exact viewport matrix from the original finding, fresh, in a real headless Chrome instance against production:

| Viewport width | Computed `#email` height |
|---|---|
| 320px | 39.19px |
| 375px | 39.19px |
| 414px | 39.19px |
| 480px | 39.19px |
| 481px | 39.19px |
| 600px | 39.19px |
| 768px | 39.19px |
| 1024px | 39.19px |

Correct, consistent single-line input at every width tested, including both sides of the old 480/481px media-query boundary. The `.htaccess`/CSS fix holds.

### 1.3 Directory listing — FIXED, confirmed

```
GET /api/    -> 403 Forbidden (Apache error page, no file listing)
GET /assets/ -> 403 Forbidden (Apache error page, no file listing)
```

`Options -Indexes` is doing its job. No file inventory, filenames, sizes, or timestamps are exposed anymore.

---

## 2. New finding: cookie banner overlap on short-viewport phones — full independent assessment

### 2.1 What I tested and how

The fixing engineer's own report (per the task brief) claimed: overlap persists on "iPhone-SE-style, ~568–667px logical height" phones, with real click interception confirmed, while "mainstream current phones (390×844 and up, e.g. iPhone 12+)" are unaffected. I did not take this at face value. I independently:

1. Loaded the live production page in real headless Chrome across a matrix of real device viewport dimensions (widths 320/360/375/390/414, heights spanning 568–844), on a **fresh browser context per test** (no stored cookie-consent choice), matching a genuine first-time campaign visitor.
2. Measured actual `getBoundingClientRect()` overlap between the banner and the email input/submit button.
3. Ran **real simulated taps** via Puppeteer's CDP-backed `.click()` (which dispatches actual mouse/touch events at true viewport coordinates — the same mechanism a real tap uses) at the email field and attempted to type into it, to distinguish "visually overlapping but still clickable" from "genuinely blocks interaction."
4. Used `document.elementFromPoint()` at the center of each control to identify exactly what element intercepts the tap.
5. Binary-searched the exact viewport-height threshold, per width, where the bug starts and stops.
6. Checked whether scrolling, or simply responding to the banner, resolves it.

### 2.2 Result: the bug is real, and click interception is confirmed, not inferred

At **375×667** (the logical viewport of iPhone 6/6s/7/8 and iPhone SE 2020/2022 — not a rare or old form factor, it's the standard non-Plus iPhone screen size across roughly a decade of devices) on a **fresh, first-time visit, before any scroll or banner interaction**:

- The banner occupies screen y=554–667.
- The email input occupies y=557–596 — **entirely inside** the banner's footprint.
- The submit button occupies y=604–642 — **entirely inside** the banner's footprint.
- `elementFromPoint()` at the submit button's center returns `cookie-banner__actions` (the banner's own button container), not the submit button.
- A real Puppeteer `.click('#email')` followed by typing a test string **produces an empty field** — the tap never reaches the input at all.

Screenshot at 375×667, fresh load (attached to this test run): the email field and "Notify me" button are **completely invisible**, hidden entirely behind the black cookie banner — only the "Email address" label is visible above it. A real visitor opening the campaign link on this device sees what looks like a page that ends right after a cookie notice, with no visible way to sign up, unless they scroll or tap the banner.

At **414×736** (iPhone 6/7/8 Plus), same fresh-load conditions: banner sits at y=623–736, email/submit sit at y=533–617, fully clear of the banner, and the real click test succeeds normally. Screenshot confirms the field and button are both fully visible above the banner.

### 2.3 Precisely which devices are affected — this refines the engineer's own report

I binary-searched the actual pass/fail threshold rather than trusting the "~568–667px" range as given, and found it's **width-dependent** (narrower widths wrap the hero copy onto more lines, pushing the form further down the page, which shifts the danger zone to taller heights):

| Width | Blocked height range (click genuinely fails) | First height that works |
|---|---|---|
| 320px | up to ~800px | 820px |
| 360px | up to ~710px | 720px |
| 375px | up to ~690px | 700px |
| 390px | up to ~689px | 690px |
| 414px | up to ~689px | 690px |

Two things this corrects relative to the engineer's report, both worth the CPO knowing before deciding severity:

- **The true blocked band is wider than "568–667px"** — at narrower widths (320–360px) it extends up to ~700–800px, meaning some devices the engineer's framing would call "safe" are not. Concretely: **iPhone X/11 Pro/12 mini (375×812) and iPhone 12/13/14 (390×844) are correctly unaffected** (well above every threshold found), consistent with the engineer's claim about "mainstream current phones" — that part holds up. But several small-to-mid Android phones around 360×640–710px logical height (a real, still-circulating budget-Android band, not a hypothetical one) are also blocked, which a "568–667px, iPhone-SE-style" framing doesn't capture.
- **iPhone SE (1st gen), 320×568, is *not* actually affected**, despite being literally named in the "iPhone-SE-style" description. At that size the email field sits *below* the initial viewport entirely (it's off-screen, not overlapping) — the visitor must scroll regardless, and scrolling resolves the issue correctly (confirmed: after scrolling the submit button into view, click works). The engineer's framing risked implying the original iPhone SE is part of the affected set; it isn't, by my direct measurement.

So the accurate statement is: **affected devices are those where the page's total content height, at that width, lands just barely within or just short of the viewport height** — concretely, iPhone 6/6s/7/8 and iPhone SE (2020/2022) at 375×667 (a very large historical iPhone install base still in real use, especially plausible among cost-conscious SME owners — exactly this product's audience), plus a band of smaller/older Android phones around 360×640–710px. Devices meaningfully shorter (568px) or taller (736px+) are not affected.

### 2.4 Mitigating factors (why this isn't as severe as the original two blockers)

- **It only affects the pre-response state.** The moment a visitor taps *either* Accept or Decline — both of which sit fully visible and fully functional even on the affected viewports — the reserved-space logic recalculates correctly and the email field/button become immediately visible and clickable (verified: after a real `#cookie-accept` click, the field's position and a real typed-text test both pass). It is not a dead end.
- **Scrolling also resolves it.** Scrolling the page at all moves the fixed banner's occlusion zone away from the (now higher up, relatively) form; at true max-scroll the reserved bottom padding — not the form — sits under the banner, exactly as designed.
- The underlying bug is the same well-understood `flex-basis`-becomes-height CSS pattern already fixed once this build cycle (in `.signup__field-row input[type="email"]`) — the engineer's own code comments already diagnose it precisely in `.cookie-banner__text`. This suggests a fast, low-risk, well-understood fix, not new investigation.

### 2.5 Why I'm still calling this launch-blocking

Despite the mitigations, I'm recommending this block launch (or be fixed same-day), for reasons independent of the mitigation:

1. **The design spec states this exact requirement explicitly and without qualification:** "This includes S0.0: the cookie banner must not cover or obscure the email field or submit button on small viewports" (design-spec.md, S0.7). This is not a judgment call about UX polish — it's a confirmed, direct violation of a named, non-negotiable requirement, on real hardware, verified with real simulated taps rather than visual inspection alone.
2. **It hits at the worst possible moment.** Every single campaign recipient's very first interaction with this page is a fresh visit with no stored consent choice — meaning the affected population isn't "some later-state edge case," it's **100% of first-time visitors on an affected device**, at exactly the moment the entire page exists to capture (email signup). A visitor who lands, sees what looks like a page with no visible form, and doesn't think to scroll or notice the banner buttons will likely bounce rather than convert — directly working against the ~8-signup / 10% target this launch is measured on.
3. **Fix cost appears low and well-understood**, per §2.4 — this isn't asking for new investigation, it's the same class of bug, in the same file, that was just fixed once already this build cycle, with 2 days of runway remaining before 9/11.

I'd weigh this as **real but somewhat less severe than the original two blockers** (there's a working escape hatch; it's not a hard dead-end for every visitor), but given it's a confirmed, direct violation of an explicit hard design requirement, on a real and meaningfully-sized device population, at the exact moment the launch's core metric is decided, I don't think "ship and monitor" is the right call here with 2 days of buffer still available. **This is the one open judgment call in this report — flagging clearly that reasonable people could land on "ship and hotfix Wednesday" instead, but my recommendation is fix-before-launch.**

---

## 3. Full regression pass — everything that previously passed

### 3.1 Cookie consent banner — S0.0 (design-spec.md 1.3, 1.4, 3.7)

All re-verified fresh, in isolated browser contexts (no cross-test state leakage), against live production:

| Check | Result |
|---|---|
| Banner appears on fresh visit, non-blocking | PASS |
| No consent stored before any click | PASS (`localStorage` null) |
| Consent Mode default (`analytics_storage`/`ad_storage` denied) queued before anything else | PASS — present in `dataLayer` on load |
| Accept → banner hides, `localStorage` set to `granted` | PASS |
| Reload after Accept → banner does not reappear, choice persists | PASS |
| Decline → banner hides, `localStorage` set to `denied` | PASS |
| Reload after Decline → banner does not reappear, choice persists | PASS |
| Desktop (1024px): banner does not overlap email field or submit button | PASS |
| Mobile short-viewport band (~640–700px height, see §2): banner overlaps and blocks the field/button on fresh load | **FAIL — new finding, §2** |
| Mobile mainstream (736px+ height): no overlap | PASS |
| Accept/Decline buttons work before analytics has loaded/if GA is entirely absent | PASS — confirmed independent of `gtag.js` (which never loads at all currently, no GA property configured) |

### 3.2 Signup flow and validation — S0.1–S0.6 (design-spec.md 1.3)

Re-tested at both the API layer (`curl`, including adversarial input) and end-to-end in a real browser:

| Check | Result |
|---|---|
| Empty email on submit → inline error "Enter your email to get notified.", focus returns to field | PASS |
| Invalid format → inline error "That doesn't look like a valid email." | PASS |
| Valid signup → success shown, real row inserted (verified via SSH+`mysql`) | PASS |
| Duplicate signup, same session (reload + resubmit same email) → identical success message, no error, confirmed no second row created | PASS |
| Duplicate signup via a differently-encoded request (no explicit JSON content-type) → still treated as success/duplicate, no new row | PASS |
| Malformed JSON body → handled gracefully, 400, no server error | PASS |
| GET request → 405 with JSON error body | PASS |
| Network/server failure (request aborted client-side, same code path as a real failure) → visible error, submit button re-enabled, entered email preserved, success box stays hidden | PASS |
| Multiple rapid submits (real double-click via Puppeteer, not just code review this time) → exactly one network request fires, exactly one row created | PASS — this time verified as an actual behavioral test, not just a code-review inference |
| Oversized email local part (300+ chars) → rejected, 400 | PASS |
| Oversized UTM field (10,000 chars) → accepted without server error (backend truncates safely) | PASS |
| SQL-injection-shaped input → either rejected by format validation, or safely inserted via parameterized query (tested with a technically-valid email containing an apostrophe) | PASS |
| XSS-shaped input in email → rejected as invalid format | PASS |

### 3.3 Canonical URL / routing (design-spec.md 1.1, 1.2, 1.4)

| Check | Result |
|---|---|
| `http://compliance.gro-better.com/` → https canonical | PASS (301) |
| `https://www.compliance.gro-better.com/` → non-www canonical | PASS (301) |
| `http://www.compliance.gro-better.com/` → canonical | PASS, via 2 hops (known/accepted, Low, unchanged) |
| No trailing slash | PASS (200 directly) |
| Old `/compliance`, `/compliance/` paths | PASS (301 → `/`) |
| UTM params present in URL | PASS (200, loads normally) |

### 3.4 Security basics

| Check | Result |
|---|---|
| `.env` direct access | PASS — 403 |
| `.env.example`, `db/schema.sql` direct access | PASS — 404 (not deployed / not reachable) |
| `/api/`, `/assets/` directory listing | PASS — 403 (fixed, see §1.3) |
| Common stray-file probes (`.git/config`, `.git/HEAD`, `.env.bak`, `composer.json`, `deploy/deploy.sh`, `.DS_Store`, `docker-compose.yml`, `Dockerfile`) | PASS — all 404 |
| `X-Powered-By: PHP/8.3.33` on PHP-executed endpoints | Present, minor info disclosure, unchanged known-low-risk item |
| HSTS header (`max-age=31536000; includeSubDomains; preload`) present | Present — not previously reported, a genuine positive, not a defect |

### 3.5 GA4 / Consent Mode v2 (design-spec.md 1.6, 1.4) — code-level, no live GA4 property exists yet

| Check | Result |
|---|---|
| `gtag.js` never requested while no measurement ID is configured | PASS — `config.php` emits `window.GA_MEASUREMENT_ID = null;` live |
| Consent Mode default (`analytics_storage`/`ad_storage` denied, `wait_for_update: 500`) queued first | PASS — confirmed in source and in live `dataLayer` |
| `generate_lead` tied to actual signup success (`window.trackGenerateLead()`), fires regardless of consent state per design (undercounting is expected/documented) | PASS — confirmed by source inspection |
| Cookie banner and signup remain fully functional with GA entirely absent | PASS |

### 3.6 Fine/penalty framing (PRD content requirement, design-spec.md 1.5)

Live copy, unchanged since the last pass: *"Enforcement risk is real, not hypothetical, and SMEs face their own, lower penalty caps rather than the headline figures aimed at large enterprises."*

| Check | Result |
|---|---|
| No euro figures or percentages anywhere on either live page | PASS (regex scan for `€`/`%` patterns, zero matches) |
| No computed "your fine is €X" framing | PASS |
| Article 99(6) SME caps referenced qualitatively, not the general ceiling stated as personal exposure | PASS |
| Qualitative-only urgency language, within the CPO's 2026-09-07 permission | PASS |

This copy is still explicitly marked in-source as pending final legal sign-off — a known, already-accepted state, not a new finding, and doesn't affect this specific pass/fail.

### 3.7 HTML validity

Both `index.html` and `privacy-policy.html`, pulled fresh from production, pass `tidy -e` with zero warnings or errors.

### 3.8 Production data hygiene

Before this session: table was already at 0 rows (I did not independently verify the state *between* the last report and this one, only at the start of my own session — see §4). During testing, I created 7 rows total across the full session (a mix of valid/duplicate/SQL-shaped/oversized-UTM/E2E/double-click test addresses, all `qa-*`-prefixed). Verified by exact ID and email prefix that every row present was one I had just created — no unrelated or leftover data was found. All 7 were deleted immediately after use. **Final `SELECT COUNT(*)`: 0 rows**, confirmed clean ahead of the 9/11 metrics clock.

### 3.9 Performance / non-functional

Five sequential requests to the canonical URL returned 200 in 91–109ms, fast and consistent. No sustained load test was run — proportionate given this is a ~80-recipient client-list campaign, not public traffic, but noting it as not done rather than implying it passed.

---

## 4. What I did not (or could not) verify

- **Live GA4 event delivery to a real property** — no property exists yet; out of scope per the brief and the design spec itself (measurement-config is a `/plan`-stage GA4-admin step). Verified at the code level instead (§3.5).
- **A real production database failure** — deliberately not triggered against live infrastructure; verified via client-side request abortion, which exercises the identical frontend code path, plus the `/build` stage's earlier documented local-DB-outage test.
- **Sustained/load performance** — only light sequential requests were run.
- **Cross-browser testing beyond Chrome** — all real-browser testing used headless Google Chrome (a genuine, locally installed browser). Safari/Firefox were not tested. The CSS/JS involved (`flex`, `localStorage`, `fetch`) is broadly supported, but true cross-browser and mobile-Safari-specific testing was not done — worth noting since the new banner-overlap finding is exactly the kind of layout bug that can vary subtly by browser engine (mobile Safari's viewport/scroll behavior in particular differs from Chrome's in some edge cases). I'd treat my Chrome-based measurements as reliable evidence the bug exists and roughly where, but not as proof the exact pixel thresholds in §2.3 transfer precisely to Safari.
- **Real physical devices** — tested via Chrome's viewport emulation (real rendering engine, emulated screen dimensions), not physical hardware. Given this is fundamentally a CSS layout/flex-basis arithmetic issue that reliably reproduces under viewport emulation (and the click-interception result is a real DOM-level fact, not a rendering artifact), I'm confident in the finding regardless, but on-device touch-target testing wasn't performed.
- **The state of the `signups` table between the previous report's cleanup and the start of this session** — I can only attest to what I observed once I connected; I have no way to independently confirm nothing was added and removed by someone else in between. What I can confirm: it was 0 when I started, and it's 0 now.

---

## 5. Recommendation

**No-ship until the cookie-banner short-viewport overlap (§2) is fixed and re-verified.** The three previously-blocking/medium issues are genuinely fixed — I confirmed this independently, not by trusting prior claims — and everything else tested (the full signup/duplicate/validation/error flow, cookie-consent persistence, canonical URL handling, GA4 code paths, adversarial input handling, HTML validity) is in solid, launch-ready shape.

The one new finding is real, confirmed via actual simulated taps (not just visual/computed-style inspection), and directly violates an explicit design-spec requirement at the exact moment the launch's core success metric is decided (first-touch, pre-consent, on the primary device class this campaign is designed for). It affects a meaningful, well-defined band of real devices — the standard non-Plus iPhone body style spanning iPhone 6 through SE (2022), plus a range of smaller/older Android phones — while leaving the shortest (iPhone SE 1st gen) and all current-generation phones unaffected. It has a working escape hatch (tapping either cookie-banner button, or scrolling, immediately fixes it), which is why I'm calling it real-but-narrower than the original two blockers rather than equally severe — but given it's the same well-understood bug class already fixed once this cycle, in the same general area of code, with two days of runway left, I don't think that mitigation is a good enough reason to ship it as-is. **My recommendation is: fix it, then re-verify with the same threshold matrix in §2.3 before shipping on 9/11** — this looks like hours, not days, of work, and there's still room in the schedule for one more fix-and-verify cycle before the launch date.

If the CPO's own risk tolerance differs — e.g., judging the escape hatch sufficient given the time pressure — that's a legitimate call to make explicitly, but it should be made knowingly, against the concrete device-range evidence above, not by assuming this is a minor cosmetic gap.
