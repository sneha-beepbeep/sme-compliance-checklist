# Design Spec: SME EU AI Act Compliance Checklist

**Source:** `docs/prd.md` (approved).

This spec covers two independent builds, per the PRD's phase split. **Phase 0**
and **Phase 1** are designed, documented, and should be planned/built as two
separate efforts — do not let Phase 1's structure leak into Phase 0's 4-day
build, and do not let Phase 0's throwaway simplicity leak into Phase 1's
quality bar.

A consolidated list of open questions for the CPO is in **Section 4**. The
original 13 flags were narrowed to 7 on 2026-09-07 (the CPO resolved flags
1–6, all Phase-0-blocking, that day — those decisions are reflected as
settled design throughout Sections 1, 1.5, 1.6, and 3). The remaining 7
Phase-1 flags were resolved by the CPO on 2026-09-11, in this revision, and
are now reflected as settled design throughout **Section 2**. All 13 original
flags are now resolved. Resolving two of the Phase-1 flags (status-
determination mechanism, and save/resume) each surfaced one new, narrower
open question — both listed at the end of Section 4, non-blocking for
`/plan` to start against but worth a quick read before Phase 1 content is
finalized.

---

## Section 1 — Phase 0: Placeholder Page (ships 11 Sept 2026)

### 1.1 Purpose and constraints recap

Sole job: don't send campaign traffic to a broken/confusing page, capture
interest (target ~8 email signups from ~80 clients), preserve UTM/analytics
tracking, and — if fines are mentioned at all — follow the fine-framing
constraint (qualitative urgency language is allowed, specific figures are
not — see 1.5). No checklist logic, no status determination, no accounts.
This is a single static-feeling page, not an application.

**Decided by the CPO (2026-09-07), replacing the corresponding flags in the
original draft:**
- **Standalone page** — not integrated into the existing agency site's
  branding, nav, or footer. Confirms this spec's original recommendation.
- **Destination URL: `https://compliance.gro-better.com/`** (subdomain
  root, no path). This is the exact URL campaign assets must point to, and
  the one the "zero broken-link" quality bar (PRD Success metrics) is
  measured against — see 1.2 and the new edge case in 1.4. **Corrected
  2026-09-09:** the CPO's original 2026-09-07 decision specified
  `gro-better.com/compliance` (apex domain + path); during Day 2 of
  `/build`, domain porting to lima-city required a subdomain approach
  instead, and the CPO confirmed `compliance.gro-better.com` (subdomain
  root) as the permanent canonical URL going forward. Content now serves
  directly at the subdomain root — there is no `/compliance` virtual path
  to route.
- **Analytics platform: GA4.** See 1.6 for the concrete event
  implementation (this replaces the structural-only event scoping from the
  original draft).
- **GDPR handling: consent line + privacy-policy link on the form (as
  originally recommended), plus a cookie consent banner** — this second
  part goes beyond the original recommendation. See S0.0 in 1.3 and the new
  edge cases in 1.4.
- **Fine/penalty framing: qualitative urgency language is now permitted**
  (e.g., "significant fines," "real enforcement risk"), without stating or
  implying any number. See 1.5 — this is additive permission, not a
  loosening of the PRD's hard no-numbers rule.
- **Duplicate-email handling confirmed as originally spec'd** (S0.6): treat
  as success, no error, no reveal of prior signup status. No design change.

### 1.2 Primary user flow

1. Client clicks the campaign link (email/social, already carrying UTM
   parameters) → lands directly on the placeholder page at
   **`https://compliance.gro-better.com/`** (subdomain root, no path — see
   1.1).
2. Page renders immediately (no login, no loading spinner beyond normal
   network latency) showing: what's coming, why it matters, and an email
   capture form. The cookie consent banner (S0.0) also appears at this
   point as a non-blocking bar layered on the page — it does not gate or
   delay the rest of the content.
3. Client optionally enters their email and submits — this works
   regardless of whether they've responded to the cookie banner yet (see
   the new edge case in 1.4 on why, and what it means for tracking).
4. Page shows an inline confirmation in place of/alongside the form. No
   redirect to a second page — keep it one page to minimize build/QA surface
   in the 4-day window.
5. Analytics fires per 1.6: a `page_view` event capturing incoming UTM
   parameters, and a `generate_lead` (signup-conversion) event on
   successful email submission — both subject to the visitor's
   cookie-consent state at the time.

That's the entire flow. There is no step 6.

### 1.3 Screens and states

**S0.0 — Cookie consent banner**
- Appears alongside the page on load (e.g., a fixed bottom bar) — separate
  from, and layered on top of, the S0.1 landing state. It does not replace
  or delay the page content underneath it.
- Non-blocking: it does not prevent scrolling, reading, or interacting
  with the email capture form while it's still showing.
- Content: a short line explaining the site uses cookies for analytics, a
  link to the privacy policy, and two actions — **Accept** and
  **Decline**. No granular per-category preference toggle for this build
  (one analytics-cookie decision, not a preference center) — kept minimal
  to fit the 4-day build (see tradeoff 3.7).
- Not responding (scrolling past it, dismissing it if a close control
  exists) is **not** treated as acceptance. GDPR requires an affirmative
  opt-in, so the default state remains "no consent" until the visitor
  actively clicks Accept.
- Once a visitor makes a choice, it's remembered locally (e.g., a
  strictly-necessary local cookie or `localStorage` flag) so the banner
  doesn't reappear for that visitor on a repeat view. Storing this
  preference doesn't itself require consent — it's functional/strictly-
  necessary storage, not analytics storage.
- The analytics behavior tied to Accept/Decline is specified in 1.6, not
  here — this state covers only the banner's own UI behavior.

**S0.1 — Landing state (default)**
- Headline: what's coming (plain language — e.g., naming the EU AI Act /
  Article 50 context; exact copy is a legal/marketing call, not resolved
  here).
- Sub-copy: why it matters to their business — non-alarmist, but may now
  use qualitative urgency language per 1.5 (no fine figures).
- Email capture form: single email field + submit button. No name field, no
  other fields — minimizes friction and build time (see tradeoff 3.1).
- Micro-copy under the form stating what happens next (e.g., "We'll email
  you the moment it's ready. One email, no spam.") and a short consent
  line + privacy-policy link (decided — see 1.1). This is separate from,
  and in addition to, the cookie banner in S0.0: the consent line covers
  being contacted / data processing for the signup itself; the cookie
  banner covers analytics tracking cookies. These are two different GDPR
  bases and both are required — one doesn't substitute for the other.

**S0.2 — Email field validation states**
- Empty on submit attempt: inline error, "Enter your email to get notified."
  Focus returns to field.
- Invalid format: inline error, "That doesn't look like a valid email."
  Standard client-side format check; no domain/MX verification (out of
  scope for a 4-day build).
- Valid: no visible change until submit.

**S0.3 — Submit pending state**
- Button shows a brief disabled/loading treatment. Given this is a single
  low-traffic form, no need for optimistic UI — wait for a real response
  before showing success.

**S0.4 — Success/confirmation state**
- Form is replaced (or visually de-emphasized) by a confirmation message,
  e.g., "You're on the list — we'll email you as soon as it's ready."
- Page headline/context copy remains visible so the page doesn't feel like
  it's "reset" — the visitor should still see they landed somewhere
  coherent, not a blank thank-you screen.

**S0.5 — Submission error state (network/server failure)**
- Inline message: "Something went wrong — please try again," submit button
  re-enabled, entered email value preserved (do not clear the field on
  failure).
- No silent failures: if the request fails, the user must see that it
  failed. This matters more than usual here because a failed-but-invisible
  submission directly undercuts the 10%/~8-signup target.

**S0.6 — Duplicate-email state**
- If the same email is submitted twice (same session or a returning
  visitor), treat it as a success, not an error: "You're already on the
  list." Do not tell the user "this email already exists" as a rejection —
  that reads as an error for something that isn't one, and there's no
  account system here for them to have "already" done anything wrong.
  De-duplication, if needed, happens in the backend/analytics layer, not in
  user-facing copy. **Confirmed by the CPO (2026-09-07)** as spec'd — this
  is settled behavior, not an open question.

**S0.7 — Responsive layouts**
- Mobile and desktop must both render the full flow above; no
  desktop-only or mobile-only content. Given a client-list campaign
  audience likely opening this from an email on a phone, mobile is not a
  secondary case here — treat it as equally primary. This includes S0.0:
  the cookie banner must not cover or obscure the email field or submit
  button on small viewports.

### 1.4 Edge cases

- **UTM parameters present but page reached via a shared/forwarded link
  without them:** page must still render the full flow correctly with no
  UTM params; tracking simply won't attribute a campaign source for that
  session. Do not block or alter the page based on UTM presence.
- **Ad blockers / analytics script blocked:** the email capture flow (S0.0
  – S0.6, including the cookie banner) must not depend on the GA4 script
  loading successfully. Tracking failure should never block or break
  signup, and it should never block or break the cookie banner's own
  Accept/Decline controls either — the banner is a lightweight, independent
  UI component, not something gated behind GA4 having loaded.
- **Multiple rapid submits (double-click):** debounce the submit button
  (disable on first click) to avoid duplicate-looking submissions from a
  single action, separate from the intentional-duplicate case in S0.6.
- **Page visited after Phase 1 has actually shipped:** out of scope to
  design now — noted only so it isn't forgotten as a follow-up cleanup task
  once Phase 1 launches (the placeholder should presumably be
  retired/redirected then, not left live indefinitely).
- **Submitting the email form before responding to the cookie banner (new,
  from the cookie-banner decision):** allowed, and succeeds normally
  (S0.2 → S0.4 is unaffected by S0.0's state). The email itself is captured
  via a normal, first-party form submission — not a tracking cookie — so
  it doesn't depend on cookie consent. What *is* affected is the GA4-side
  `generate_lead` event for that submission: it fires under whatever
  consent state was active at submit time (see 1.6), so a visitor who
  submits before/without accepting cookies produces only a consent-mode
  "ping" in GA4, not a fully attributed, cookie-linked conversion. **This
  means GA4's own signup count can undercount true signups.** The backend
  record of submitted emails — not GA4 — must be treated as the source of
  truth for the ~8-signup target and the 10% metric. Flagged as a new
  measurement consideration this decision introduces; design can state it,
  but resolving how marketing/analytics reports on it is outside this
  spec's scope.
- **Visitor declines cookies, or never responds, then never revisits:**
  not a product-level loss if they signed up (the email is captured
  server-side regardless) — only a loss of GA4 session-level attribution,
  consistent with the ad-blocker principle above.
- **Returning visitor, same browser, who already responded to the cookie
  banner:** the banner does not reappear (S0.0's persisted-choice
  behavior); the rest of the page behaves identically to a first visit.
- **Destination URL mismatches (new, from the URL decision):** the "zero
  broken-link" quality bar is measured against `compliance.gro-better.com`
  specifically (see 1.1, 1.2). Any deployment detail that resolves to a
  different effective URL — a trailing slash, `www.compliance.` vs.
  non-`www.` subdomain, `http` vs. `https`, or an unexpected redirect chain
  — risks breaking that bar even if "a" page loads somewhere. This is a
  routing/deployment note for `/plan`, not just a copy detail. (Corrected
  2026-09-09: this used to reference an apex-domain-plus-path structure;
  since the canonical URL is now a subdomain root with no path, there is no
  `/compliance` path segment to mismatch on — only host/scheme/trailing-
  slash variants remain relevant here.)

### 1.5 Fine/penalty framing (if used at all on this page)

Per the PRD's hard content requirement, applies here too if invoked:
- Never present the €15M/3% ceiling as this client's own exposure.
- Must note Article 99(6) establishes SME-specific reduced caps, if fines
  are mentioned at all.
- Never show a computed "your fine is €X" figure.

**Decided by the CPO (2026-09-07):** Phase 0 copy **may** use qualitative
urgency language — e.g., "significant fines," "real enforcement risk,"
"this isn't hypothetical" — without stating or implying any number. This is
**additive permission** on top of the hard rule above, **not** a loosening
of it: no euro figures, no percentages, no "your fine could be X" framing
(computed or otherwise), and if Article 99(6) SME caps are referenced at
all, they must still be described qualitatively (e.g., "SMEs face lower
caps than large enterprises," not a specific cap figure) — consistent with
the PRD's no-numbers content rule and the still-unresolved legal
sanity-check.

Given the legal sanity-check has not concluded and there is no time in a
4-day build for a legal-copy review cycle, the operational recommendation
from the original draft still stands: keep the actual shipped copy
conservative — urgency without alarm, no numbers — rather than testing the
outer edge of what "qualitative" now allows. Any fine-adjacent copy still
needs a fast legal-copy sanity pass before it ships, which remains a
schedule risk against 11 September if marketing wants to use this
language; that risk is unchanged by this permission, only the ceiling on
what's *allowed* has moved.

### 1.6 Analytics implementation (GA4)

**Decided by the CPO (2026-09-07):** GA4 is the tracking platform for
Phase 0. This replaces the structural-only event scoping in the original
draft with concrete implementation detail. Exact tag deployment (a raw
`gtag.js` snippet vs. a Google Tag Manager container) is a `/plan`-stage
engineering choice, not a design one — the events, parameters, and consent
behavior below are the design-level requirements either implementation
must satisfy.

**Consent Mode.** Because the audience is EU-based existing clients and the
page now carries a cookie consent banner (S0.0), GA4 must be configured
with **Google Consent Mode (v2)**:
- Default state on page load, before any banner response: `analytics_storage`
  denied (and `ad_storage` denied — no ad tracking is in scope here).
- On S0.0 "Accept": update consent to `analytics_storage` granted. Full,
  cookie-based GA4 tracking (session stitching, standard UTM/campaign
  attribution) becomes active from that point forward for that visitor.
- On S0.0 "Decline," or before any response: consent stays denied. GA4
  still receives basic, cookieless "consent mode" pings for the
  `page_view`/conversion events (Google's modeled measurement), but no
  persistent tracking cookie is set and no session-level attribution is
  possible for that visitor. This is expected and acceptable — see the
  related edge case in 1.4 about GA4 undercounting relative to the backend
  email record.

**Events:**
1. **`page_view`** — GA4's default automatic page-view event, left as
   standard rather than built as a fully custom event. GA4 natively parses
   `utm_source`, `utm_medium`, `utm_campaign` (and `utm_term`/`utm_content`
   if present) from the landing URL's query string into its default
   channel-grouping/campaign dimensions — no custom event parameters need
   to be hand-built for UTM capture. This is GA4's standard behavior for
   any URL carrying those parameters, subject to the consent state above.
2. **`generate_lead`** — fired on successful email submission (S0.4), using
   GA4's own recommended event name (rather than an arbitrary custom name
   like `signup_conversion`) so it's picked up by GA4's built-in
   conversion/lead reporting without extra configuration. Suggested event
   parameter: `method: "email_capture"`, to distinguish it from other lead
   sources if the site ever grows more than one. This event must be marked
   as a **conversion** in the GA4 property's admin console — a `/plan`
   / GA4-configuration step, not a code-level design detail.
3. No other custom events are needed for Phase 0 — this is a single-page,
   single-form flow. Adding events for scroll depth, time-on-page, etc. is
   out of scope for a 4-day build and isn't needed for the PRD's Phase 0
   metrics (traffic, signups, uptime/broken-link — see PRD Success
   metrics).

**What this doesn't change:** the email address itself is still captured
via a normal form submission to the backend (or a form-handling service),
independent of GA4 entirely. GA4 measures that a conversion happened; it is
not, and must not become, the system of record for the emails themselves
(see the 1.4 edge case on GA4 undercounting).

---

## Section 2 — Phase 1: Full Interactive Checklist (fast-follow, no fixed date)

### 2.1 Purpose and constraints recap

SME owner works through Article 50 items — **4 fixed provisions, confirmed
by the CPO (2026-09-11) — see flag 5** — via a **diagnostic sub-question
engine**: rather than self-reporting a status directly, the user answers a
short set of factual yes/no/not-sure sub-questions per item, and the system
computes that item's status flag (Compliant / Not compliant / Needs-check)
from those answers (CPO decision, 2026-09-11 — see flag 1, and 2.2/S1.3
below). This is a real change from this spec's original self-report
assumption.

Per-item guidance for flagged items states the computed status and cites
the relevant Article 50 requirement only — **no "how to fix it" content**
(CPO decision, 2026-09-11 — see flag 2, and 2.4 below).

Stuck users get routed to one lightweight async "still stuck? talk to us"
contact point → agency-run free triage, not live chat, not automatic paid
routing. Completion notifies a sales/CS rep **only** when the client
actively submits that contact form — confirmed opt-in trigger for US-10
(CPO, 2026-09-11 — see flag 3, no design change from the prior draft).

No accounts, but **lightweight local-only save/resume is a confirmed
requirement** (CPO, 2026-09-11 — see flag 6 and S1.9), no live chat, no
fine calculator, no automatic fixing.

**Localization-readiness principle (CPO, 2026-09-11 — see flag 7):**
Phase 1 content and UI copy are **English-only for this build**, confirmed.
But the content structure and data model must not hardcode English in a
way that would block adding languages later — e.g., checklist items,
sub-questions, and guidance citations should be organized as content keyed
by a stable item/question ID with an implicit (not hardcoded-string-only)
locale association, so a future localization pass can add translated
content per ID rather than requiring a data-model rework. This is a
structural constraint on how content is organized, not a build requirement
to actually support more than one language now.

Throughout this section, every place the computed status is shown to a
user, copy must frame it as a self-assessment **flag**, not a legal
determination or certification ("this item is **flagged as** Not
compliant," never "you are not compliant" or "you are certified
compliant") — consistent with the PRD's explicit non-goal that this is not
a legal-advice or certification product.

### 2.2 Primary user flow

1. **Entry.** User arrives at the checklist (via the Phase 0 "notify me"
   email, a future campaign link, or direct navigation). Lands on an intro
   screen. If a local save/resume record exists from a prior visit (S1.9),
   the user is offered to resume rather than restarting at item 1.
2. **Intro screen.** Explains what the checklist covers (Article 50
   transparency obligations for AI-generated website content only — not
   general AI Act compliance), how long it takes, that no account/login is
   needed, that it works by asking a few short questions per item rather
   than asking the user to self-assess directly, and that it doesn't give
   legal certification — it flags status and points to next steps. States
   the fine-framing caveat once here if fines are referenced anywhere in
   the flow (see 2.6), so it doesn't need repeating on every item screen.
3. **Item-by-item walkthrough.** One Article 50 item at a time (4 items
   total — see S1.3). For each item:
   a. Plain-language statement of the requirement.
   b. A short set of diagnostic sub-questions about what the user has
      actually done on their site, each answered **Yes / No / Not sure**
      (the same three-way primitive as before, now applied at the
      sub-question level rather than directly to the item's status). Exact
      sub-question count and wording per item is a content-authoring
      output of the still-running legal sanity-check — not resolved here;
      this spec fixes the pattern, not the content.
   c. Once all of that item's sub-questions are answered, the system
      computes and reveals the item's status flag inline, on the same
      screen — no separate navigation step. Decision rule (pattern, not
      final content): any "Not sure" sub-answer defers the item to
      **Needs-check**; the specific Yes/No combinations that resolve to
      Compliant vs. Not compliant are a per-item content-authoring
      deliverable, pending the legal sanity-check.
   d. If the computed status is Not compliant or Needs-check, a guidance
      panel reveals inline (does not navigate away): status + citation to
      the relevant Article 50 text/requirement only — no fix-it
      instructions (see 2.4).
   e. User continues to the next item. Both the item's sub-question answers
      and its computed status are saved (see S1.9's data-shape note) — not
      just the final status, so a returning user can revise an individual
      sub-answer rather than re-answering the whole item.
4. **Results/summary screen.** Shown once every item has a computed status.
   Recaps all items and their statuses.
   - If everything is Compliant: congratulatory/no-action-needed state, no
     stuck-CTA needed (optional low-key link only — see S1.4).
   - If anything is Not compliant / Needs-check: those specific items are
     listed, and a single "Still stuck? Talk to us" CTA is offered,
     covering exactly those flagged items (satisfies US-8's "exactly the
     items I'm stuck on" via pre-population, not via per-item CTAs).
5. **Contact request (optional, user-initiated).** If the user clicks
   "Still stuck? Talk to us," they see a lightweight form: their flagged
   items are pre-listed (editable — they can deselect any they don't
   actually want help with), plus a short free-text field and submit.
6. **Submission confirmation.** Inline confirmation that a real person from
   the agency will follow up — copy must say "we'll get back to you," not
   "book a call" or promise a specific paid outcome, since triage happens
   first (see 2.5).
7. **Notification.** Submitting the contact form (step 5) is what triggers
   the sales/CS rep notification in US-10 — **confirmed** (CPO, 2026-09-11
   — see flag 3; this was already the spec's design, no change).

### 2.3 Screens and states

**S1.1 — Intro/landing screen**
- Static content screen: scope statement, time estimate, no-login
  statement, a brief note that the checklist works via short per-item
  questions rather than direct self-assessment, non-certification
  disclaimer, fine-framing caveat (if used).
- If a local save/resume record exists (S1.9), also offer a
  "resume where you left off" action alongside "Start."
- Single "Start" action (or "Resume," per above).

**S1.2 — Qualifying question — confirmed requirement (CPO, 2026-09-11 —
see flag 4)**
- "Does your website include any AI-generated content (text, images,
  chat, etc.)?" Yes / No / Not sure.
- If "No": short exit message — "You likely don't need this checklist right
  now, but here's a quick way to double-check ___" — rather than forcing a
  clearly out-of-scope visitor through the full item list.
- If "Not sure": proceed into the checklist as normal (the checklist itself
  is how they'd find out).
- This screen was originally the designer's own addition, not something
  the PRD asked for. **The CPO has now confirmed it as a firm requirement**
  (2026-09-11) — no longer optional or pending confirmation.

**S1.3 — Item screen (repeated once per Article 50 item — 4 items,
confirmed count, see flag 5)**
- Progress indicator ("Item 3 of 4") persists across all item screens.
- Requirement text (plain language).
- **Diagnostic sub-questions** for the current item, each with a Yes / No /
  Not sure control. Sub-questions for an item are grouped and shown
  together on that item's single screen — not split into their own
  one-question-per-screen steps — to avoid compounding the linear wizard
  into a wizard-within-a-wizard, regardless of how many sub-questions a
  given item ends up needing once content is authored (see Section 3,
  tradeoff 8).
- Once every sub-question on the screen is answered, the item's **status
  flag computes and displays automatically**, inline, framed as "This item
  is flagged as: [Compliant / Not compliant / Needs-check]" — this is a
  system computation, not a user selection.
- On a computed status of Not compliant or Needs-check: guidance panel
  expands inline (does not navigate away) — status + Article 50 citation
  only, see 2.4.
- "Next" advances once all of the item's sub-questions are answered (the
  status computing automatically is not itself a separate action the user
  takes). Back navigation is allowed (to review or change a prior item's
  sub-question answers, which live-recomputes that item's status) but
  skipping ahead without answering is not — the flow is linear (see
  tradeoff 3.3).

**S1.4 — Results/summary screen — all-compliant variant**
- Positive framing, recap list (all green/compliant, computed statuses).
- No fine-figure content needed here; if any fine-context copy appears at
  all in the app, this screen is a low-stakes place to reiterate the
  Article 99(6) caveat once, briefly, since it's a natural "here's your
  status" moment.
- Optional low-key "questions anyway? talk to us" link, same single contact
  point as S1.6, de-emphasized since there's nothing flagged.

**S1.5 — Results/summary screen — has-flagged-items variant**
- Recap list with per-item computed status (compliant/not compliant/
  needs-check, visually distinguished).
- Prominent "Still stuck? Talk to us" CTA, framed as low-friction and
  non-pushy per US-9 (e.g., not "Buy implementation now" — more like "Want
  a hand with any of this? We're happy to help.").

**S1.6 — Contact form**
- Pre-populated list of the flagged items (from S1.5), each with a
  checkbox so the user can narrow which ones they actually want help with.
- Short free-text field (optional context).
- Contact detail: email is already known if they came from a Phase-0
  signup or a recognized client session; if not otherwise available,
  collect it here. (Exact identity/session mechanism is an
  engineering/plan-stage question, not resolved here.)
- Submit button. Copy should set expectations: a person will follow up,
  not "you're booking a call" (per the agency-run free triage policy — see
  2.5).

**S1.7 — Contact form: submission confirmation**
- Inline confirmation, no redirect. "Thanks — [agency] will be in touch
  soon to help with [N] item(s)."

**S1.8 — Contact form: submission error**
- Same pattern as Phase 0's S0.5: visible error, preserved input, retry
  available, no silent failure. This is the single conversion-critical
  action in Phase 1 (it's what feeds US-10) — it must not fail silently.

**S1.9 — Save/resume (return-to-in-progress) state — confirmed
requirement (CPO, 2026-09-11 — see flag 6)**
- If a user leaves mid-checklist and comes back in the same browser, the
  checklist resumes where they left off rather than restarting from item 1
  — lightweight, local-only (e.g., browser storage) persistence, not an
  account system, not cross-device. This was previously a recommendation
  only; **it is now a confirmed requirement.**
- **Data-shape note (new open question surfaced by resolving this
  alongside flag 1 — flagged, not silently decided):** because status is
  now system-computed from sub-question answers rather than self-reported
  directly, persisting only a final status per item is not enough for a
  coherent resume experience — a returning user should be able to revisit
  and revise an individual sub-answer, not just see a final status or
  re-answer the whole item from scratch. What actually needs to persist
  (e.g., per-item sub-question answers plus the derived status, keyed by
  item/question ID; whole-checklist blob vs. per-item entries; whether/how
  to handle a stored answer set going stale if item content is edited
  after a user started) is a genuine open engineering/content-versioning
  question for `/plan` — not decided in this spec.

### 2.4 Guidance content rules (US-7, US-9, "needs-check") — resolved
2026-09-11 (flag 2)

**Confirmed by the CPO (2026-09-11):** guidance content is the same shape
for **both** Not compliant and Needs-check statuses, and is
**citation-only** — no "how to fix it" remediation content anywhere in
Phase 1. Concretely, the guidance panel for a flagged item states:
- The computed status ("This item is flagged as: Not compliant" /
  "...Needs-check").
- A citation to the relevant Article 50 provision text/requirement (exact
  content pending the legal sanity-check — not resolved here).

No remediation steps, no "here's what to change on your site" instructions,
for either status. This replaces the prior draft's "one guidance-content
slot does double duty" assumption (the earlier flag 2) — Not compliant and
Needs-check now share one guidance-content shape **by design**, not by
expedient assumption, since neither carries fix-it content at all.

**No per-item help CTA.** Guidance panels do not each carry their own
"still stuck" button. The single contact point lives only at the results
screen (S1.5/S1.6). This is deliberate — seeing a "need help? talk to us"
prompt after every single item would read as a repeated upsell push, which
US-9 explicitly asks to avoid.

**Consequence worth stating plainly (not a new open question — the CPO's
decision above is firm — but a real downstream effect worth surfacing
rather than quietly absorbing):** the PRD's **US-7** asks for self-serve-
capable owners to get "clear how to fix it instructions" so they can close
the gap without paying the agency. With remediation content removed
entirely, Phase 1 no longer delivers on US-7 as literally written — a
self-serve-capable owner now gets a status flag and an Article 50 citation,
the same as a needs-help owner gets. In practice this collapses much of the
functional distinction between the PRD's "self-serve-capable" and
"needs-help" target users (Target users 1 and 2): both now receive
identical per-item information and the same single path to further help
(the results-screen contact CTA). This may well be the intended effect —
it steers more flagged items toward agency triage, consistent with the
retention/upsell goal in PRD Goal 4 — but it is a direct scope narrowing of
US-7, not a small detail, and this spec is flagging it rather than letting
the two documents quietly disagree. Recommend the PM/CPO update or
formally retire US-7 in the PRD when convenient.

### 2.5 Triage / handoff policy (affects copy, not just backend)

Per the PRD's resolved reading of the escalation policy: submitting the
contact form routes to the agency's own free triage step, not straight to
a paid-engagement conversation and not a live-chat channel. This is a
copy constraint as much as a backend one — S1.6 and S1.7 copy must not
imply an immediate live response, a booked call, or a sales pitch. It
should read as "a person will look at this and get back to you," leaving
room for the agency's triage process to decide free-guidance-only vs.
proposing paid work. With per-item guidance now citation-only rather than
fix-it content (2.4), the triage conversation itself is where any actual
"here's how to fix it" explanation now has to happen — an operational
note for whoever staffs triage, not a design change.

### 2.6 Fine/penalty framing (Phase 1)

Same hard rule as Phase 0 (never state the general ceiling as personal
exposure, always note Article 99(6) SME caps if fines are mentioned, never
show a computed figure). Recommended placement: once on the intro screen
(S1.1) and, if repeated, once more on the results screen — not restated on
every single item screen, to avoid both clutter and repeated legal-copy
surface area to get wrong.

**Note on the Phase 0 qualitative-language decision (1.5):** the CPO's
2026-09-07 permission to use qualitative urgency language was scoped to
Phase 0 specifically (it was one of the six Phase-0-blocking flags). Phase
1's fine-framing approach is not addressed by that decision and remains
open — the safest assumption until confirmed is that Phase 1 follows the
same hard rule stated above without the additional qualitative-language
permission, but this should be confirmed explicitly when Phase 1 content
is scoped, not assumed to inherit the Phase 0 decision.

### 2.7 Edge cases

- **Every item compliant on first pass:** see S1.4. No stuck-CTA forced;
  US-10 notification does not fire (nothing was flagged, no contact form
  submitted).
- **User answers a sub-question "Not sure":** per the decision rule in
  2.2c, any "Not sure" sub-answer on an item defers that item's computed
  status to **Needs-check**, regardless of the item's other answers — the
  engine never forces a firm Compliant/Not-compliant call out of uncertain
  input.
- **User revisits a prior item via back-navigation and changes a
  sub-question answer:** the item's status recomputes live, and its
  guidance panel updates or disappears accordingly (e.g., a status that
  was Not compliant and is now Compliant no longer shows a guidance
  panel). No confirmation step is needed for this — it's the same
  three-way sub-question control, just revised.
- **User wants to self-mark an item resolved without re-answering its
  sub-questions:** not designed in as a distinct action (e.g., no separate
  "mark as fixed" button) — if they've actually fixed the underlying issue,
  they go back and change the relevant sub-question answer(s) (S1.3), which
  recomputes the status automatically. Sub-question answers remain the
  single source of truth for an item's status; a separate "I fixed it" flag
  that could disagree with the computed status would create two sources of
  truth for one item (see tradeoff 3.4).
- **User has zero items flagged but still wants to talk to someone
  (e.g., a question not covered by the checklist):** low-key link on S1.4
  covers this rather than blocking it entirely.
- **User submits the contact form, then keeps using the checklist /
  resubmits:** treat a second submission from the same session as a normal
  additional message, not an error — same idempotent-and-friendly principle
  as Phase 0's duplicate-email handling (S0.6).
- **Item count / list length:** confirmed small and fixed — 4 items (CPO,
  2026-09-11, see flag 5) — so the "what if the list is long" scenario
  from the prior draft no longer applies. The strictly-linear,
  one-item-at-a-time wizard pattern is confirmed appropriate without
  qualification; the single-page-checklist alternative is not worth
  revisiting.
- **Notification volume:** because notification is opt-in-triggered (2.2
  step 7, confirmed — flag 3), a self-serve owner who never asks for
  contact never generates a sales/CS notification, even if they have
  flagged items. That's intentional and now confirmed rather than merely
  designed-for.

---

## Section 3 — Explicit UX tradeoffs and why

1. **Phase 0 email form is a single field (email only), no name/company.**
   Minimizes friction toward the ~8-signup target and minimizes build
   surface for a 4-day timeline. Cost: less personalization possible in the
   eventual "checklist is ready" email. Acceptable given the target metric
   is signup count, not lead-quality depth.
2. **Phase 1's single contact point lives only at the results screen, not
   per item.** Chosen because (a) the PRD's own scope language describes
   "one lightweight... contact point," singular, and (b) repeating a
   help/upsell prompt after every item directly conflicts with US-9's
   "doesn't feel like an upsell push." Cost: a user who gets stuck on item 2
   of 4 has to keep going through the rest of the checklist before they can
   ask for help. Judged acceptable — the items are meant to be quick
   self-assessments, not blockers, and forcing completion before contact
   also keeps the "completed checklist" data (used for the sales
   notification and Phase 1 metrics) meaningful and consistent.
3. **Checklist flow is strictly linear (no skip-ahead, no all-at-once
   single-page view).** Simplest to build and matches "reached the final
   item" as a clean, unambiguous completion definition (per the PRD's own
   metric definitions). Cost: a user unsure about one item can't skip it and
   come back later within the same pass — they're expected to use "Not
   sure" (now at the sub-question level) rather than skip. **Confirmed
   appropriate, not merely provisional:** the CPO confirmed the item count
   at 4 fixed provisions (2026-09-11 — see flag 5), which is comfortably
   within range for this pattern — the single-page-checklist alternative
   flagged in the prior draft as "worth revisiting if the count is large"
   is no longer worth reconsidering.
4. **No separate "I fixed it" action distinct from changing an item's
   status.** One control (the sub-question answers) is the single source of
   truth per item, rather than layering a second "resolved" flag on top of
   it. Cost: slightly more clicks (back-navigate to change a sub-question
   answer) than a dedicated "mark fixed" shortcut would take. Chosen to
   avoid the data-integrity ambiguity of two flags that can disagree.
5. **Duplicate submissions (email in Phase 0, contact form in Phase 1) are
   always treated as success, never shown as an error.** Prioritizes not
   making a well-intentioned repeat visitor feel like they did something
   wrong, over surfacing a technically-accurate "already exists" message.
   De-duplication is pushed to the data layer instead of the UI. Confirmed
   for Phase 0 by the CPO (2026-09-07); applied consistently to Phase 1's
   analogous case by extension.
6. **No fine figures anywhere in Phase 0, and minimal repetition in Phase
   1.** The PRD's framing constraint is a hard content rule; the CPO has
   now additionally permitted qualitative urgency language in Phase 0
   (2026-09-07 — see 1.5), but the underlying tradeoff logic is unchanged:
   Phase 0's 4-day timeline leaves no room for a legal-copy review cycle,
   and repeating fine-adjacent caveat language on every screen increases
   the surface area for it to be gotten wrong once, somewhere.
   Concentrating it to one or two moments — and keeping the actual shipped
   copy conservative even though qualitative language is now technically
   allowed — reduces both legal risk and clutter.
7. **Cookie banner is a single Accept/Decline choice, not a granular
   preference center.** The CPO's 2026-09-07 decision added a cookie
   banner requirement on top of the original consent-line-only
   recommendation (see 1.1, S0.0); this spec keeps it to the simplest
   GDPR-compliant shape — one analytics-cookie decision, remembered
   locally — rather than a multi-category consent management platform, to
   fit the 4-day build. Cost: if the agency later wants finer-grained
   consent categories (e.g., separate marketing vs. analytics cookies),
   that's a rebuild of S0.0, not an extension of it — acceptable since
   Phase 0 has no marketing/ad-pixel cookies to distinguish from analytics
   in the first place.
8. **Sub-questions are grouped per item on one screen, not split into their
   own one-question-per-screen steps.** Chosen so the linear wizard doesn't
   become a wizard-within-a-wizard regardless of how many sub-questions a
   given item ends up needing once content is authored (that count is
   still unknown — a content-authoring output pending the legal
   sanity-check, see flag 1). Cost: if a given item ends up needing many
   sub-questions, that item's screen could get visually busy — worth
   revisiting at `/plan` once real sub-question counts are known.
9. **Guidance content is status + citation only, with no remediation
   instructions anywhere in Phase 1** (CPO decision, 2026-09-11 — see flag
   2 and 2.4). Cost: narrows the PRD's US-7 as literally written, and
   collapses the practical distinction between the "self-serve-capable"
   and "needs-help" target users into a single "contact us" path for any
   flagged item. Recorded here for traceability — this is a firm CPO
   decision, not this spec's own judgment call, but the tradeoff and its
   cost are real and worth tracking.
10. **Sub-question answers, not just the derived status, are the persisted
    save/resume source of truth** (interaction of flags 1 and 6). Cost: a
    larger local-storage payload and more resume-logic complexity than
    persisting a single status value per item would need. Chosen because a
    returning user should be able to revise an individual sub-answer and
    have the status recompute, not just re-answer an entire item from
    scratch or see a frozen final status they can't unpick.

---

## Section 4 — Flags for the CPO (ambiguous or under-specified in the PRD)

**Resolved 2026-09-07 (were items 1–6 in the original draft):** analytics
platform (GA4), standalone-vs-integrated page (standalone), destination URL
(`compliance.gro-better.com`, subdomain root — corrected 2026-09-09 from the
original apex+path decision, see 1.1), GDPR handling (consent line +
privacy-policy link **and** a cookie consent banner), fine-framing
permission (qualitative urgency language allowed, still no numbers), and
duplicate-email handling (confirmed as originally spec'd — treat as
success). These are now reflected as decisions in Sections 1.1, 1.3
(S0.0/S0.1/S0.6), 1.4, 1.5, 1.6, and 3 — not listed below as open questions.

**Resolved 2026-09-11 (were items 1–7 in the prior revision of this spec,
covering Phase 1):** the CPO resolved all 7 remaining Phase-1 flags in this
revision. Each is listed below with its resolution and where it's now
reflected in Section 2.

1. **Status-determination mechanism — RESOLVED: diagnostic sub-question
   engine, not self-report.** The user answers a short set of factual
   Yes/No/Not-sure sub-questions per item; the system computes the status
   flag (Compliant / Not compliant / Needs-check) from those answers,
   rather than the user directly selecting a status. This is a real scope
   change from this spec's prior self-report assumption. Reflected in 2.1,
   2.2 (step 3), S1.3, and 2.7. Kept consistent with the PRD's non-goal
   (not a legal-advice/certification product): the engine determines a
   status *flag* only, and all copy must frame it as such ("flagged as,"
   never "you are compliant" or "certified") — see 2.1's copy-framing note.
   - **New question this raises, flagged rather than silently decided:**
     how to phrase the sub-questions themselves so they read as factual
     self-assessment prompts ("did you do X on your site?") rather than
     legal-advice-adjacent questions ("is your use of AI high-risk?") is a
     real, unresolved content-authoring question. It sits downstream of
     the still-in-progress legal sanity-check and needs a content/legal-
     copy pass before Phase 1 content is finalized — not resolved by this
     spec, which specifies only the interaction pattern, not the actual
     question wording.
2. **"Needs-check" guidance content vs. "how to fix it" — RESOLVED: no
   remediation content at all**, for either Not compliant or Needs-check.
   Guidance = status + Article 50 citation only, for both statuses alike.
   Reflected in 2.4. Note: this narrows the PRD's US-7 as literally
   written — see the consequence note in 2.4 and tradeoff 9 in Section 3.
3. **US-10 notification trigger — RESOLVED (confirmed): opt-in only**,
   firing on contact-form submission (S1.6), not automatically on
   checklist completion. This was already the spec's tentative design
   (reading b); the CPO has now confirmed it rather than reading a. No
   design change — reflected in 2.2 (step 7) and 2.7.
4. **Qualifying screen S1.2 — RESOLVED: keep it, confirmed as a firm
   requirement**, not the designer's own optional addition. Reflected in
   S1.2.
5. **Article 50 item count/pattern — RESOLVED: 4 fixed provisions,
   confirmed linear wizard.** The CPO supplied the count directly (actual
   provision text/content is still pending the separate, ongoing legal
   sanity-check — don't assume specific content from the count alone). 4
   items is comfortably within range for the strictly-linear,
   one-item-at-a-time wizard pattern already spec'd; the single-page-
   checklist alternative is no longer worth reconsidering. Reflected in
   S1.3, 2.7 (the "very long item list" edge case removed as no longer
   applicable), and Section 3 tradeoff 3.
6. **Save/resume persistence — RESOLVED: yes, confirmed as a firm
   requirement** — lightweight, local-only, no-account persistence, per
   the spec's own prior S1.9 recommendation. Reflected in S1.9.
   - **New question this raises, flagged rather than silently decided:**
     the exact local-persistence data shape is now a genuinely open
     question, because status is system-computed from sub-question answers
     (flag 1 above) rather than self-reported directly — persisting only a
     final status per item isn't enough for a coherent resume experience.
     What needs to persist (per-item sub-question answers plus derived
     status, keyed how, with what staleness/versioning handling if item
     content changes after a user has started) is an engineering/content-
     versioning question for `/plan`, not decided here — see the data-shape
     note in S1.9 and tradeoff 10 in Section 3.
7. **Language scope — RESOLVED: English-only for now**, confirmed. The
   content structure and data model must not hardcode English in a way
   that blocks future localization (e.g., content should be organized so
   it could be keyed by locale later, even though only one locale exists
   today) — carried into Section 2 as a design principle (see 2.1) rather
   than a build requirement for this phase.

All 13 original flags (6 Phase 0 + 7 Phase 1) are now resolved. Two new,
narrower questions were surfaced in resolving flags 1 and 6 above
(sub-question copy framing; local-persistence data shape) — both
non-blocking for `/plan` to begin against, but worth the CPO's or content
team's attention before Phase 1 content/build is finalized.

---

## Section 5 — What was simplified or cut, and why

- **Phase 0 has exactly one form field and one page.** Anything beyond
  email capture (name, company, phone, multi-step qualification) was cut
  to protect the 4-day timeline and because the PRD explicitly scopes
  Phase 0 down to "a generic interest-capture form."
- **Phase 1's status-determination is a diagnostic sub-question engine, not
  free-form self-report** (CPO decision, 2026-09-11 — see Section 4, flag
  1) — a change from this spec's original self-report assumption. Kept
  simple by design: sub-questions are factual Yes/No/Not-sure prompts that
  compute a status *flag*, not a guided branching legal-advice tree, to
  stay aligned with the PRD's non-goal of not being a legal-advice/
  certification tool.
- **No "how to fix it" remediation content anywhere in Phase 1** (CPO
  decision, 2026-09-11 — see Section 4, flag 2) — guidance is status +
  citation only. This is a real cut against the PRD's US-7 as literally
  written, flagged rather than silently absorbed (see 2.4).
- **No per-item contact/escalation controls in Phase 1** — consolidated
  into the single results-screen contact point, both because the PRD
  describes "one" contact point and because it directly serves US-9's
  anti-upsell-pushiness goal.
- **No cross-device/account-based resume in Phase 1** — consistent with
  the PRD's broader no-accounts stance (explicit for Phase 0; now a
  confirmed requirement for Phase 1 too, local-only and no-account, per
  flag 6).
- **Cookie banner kept to a single Accept/Decline choice, no preference
  center** — the CPO's 2026-09-07 decision added the banner requirement
  itself, but the simplest GDPR-compliant shape was kept to protect the
  4-day Phase 0 timeline (see tradeoff 3.7).
</content>
