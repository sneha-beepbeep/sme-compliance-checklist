# Design Spec: SME EU AI Act Compliance Checklist

**Source:** `docs/prd.md` (approved).

This spec covers two independent builds, per the PRD's phase split. **Phase 0**
and **Phase 1** are designed, documented, and should be planned/built as two
separate efforts — do not let Phase 1's structure leak into Phase 0's 4-day
build, and do not let Phase 0's throwaway simplicity leak into Phase 1's
quality bar.

A consolidated list of open questions for the CPO is in **Section 4**. The
original 13 flags have been narrowed to 7: the CPO resolved flags 1–6 (all
Phase-0-blocking) on 2026-09-07, and those decisions are now reflected as
settled design throughout Sections 1, 1.5, 1.6, and 3, rather than listed as
open questions. The remaining flags affect Phase 1, which has no fixed date,
but are still worth resolving early since they shape the checklist's core
interaction model.

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

SME owner works through Article 50 items, each self-marked compliant / not
compliant / needs-check. Self-serve-capable users get "how to fix it"
guidance per item. Stuck users (self-serve or not) get routed to one
lightweight async "still stuck? talk to us" contact point → agency-run free
triage, not live chat, not automatic paid routing. Completion notifies a
sales/CS rep when a client is flagged as needing help (US-10). No accounts,
no live chat, no fine calculator, no automatic fixing.

### 2.2 Primary user flow

1. **Entry.** User arrives at the checklist (via the Phase 0 "notify me"
   email, a future campaign link, or direct navigation). Lands on an intro
   screen.
2. **Intro screen.** Explains what the checklist covers (Article 50
   transparency obligations for AI-generated website content only — not
   general AI Act compliance), how long it takes, that no account/login is
   needed, and that it doesn't give legal certification — it flags status
   and points to next steps. States the fine-framing caveat once here if
   fines are referenced anywhere in the flow (see 2.6), so it doesn't need
   repeating on every item screen.
3. **Item-by-item walkthrough.** One Article 50 item at a time (see S1.3).
   For each item:
   a. Plain-language statement of the requirement.
   b. User selects: **Compliant** / **Not compliant** / **Not sure**.
   c. If Not compliant or Not sure: guidance content reveals inline (see
      2.4 for what "guidance" means per status).
   d. User continues to the next item. Status is saved for that item;
      nothing else happens per-item (no per-item contact CTA — see
      tradeoff 3.2).
4. **Results/summary screen.** Shown once every item has a status. Recaps
   all items and their statuses.
   - If everything is Compliant: congratulatory/no-action-needed state, no
     stuck-CTA needed (optional low-key link only — see S1.5).
   - If anything is Not compliant / Not sure: those specific items are
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
   the sales/CS rep notification in US-10 (design decision — flagged for
   confirmation in 4.3).

### 2.3 Screens and states

**S1.1 — Intro/landing screen**
- Static content screen: scope statement, time estimate, no-login
  statement, non-certification disclaimer, fine-framing caveat (if used).
- Single "Start" action.

**S1.2 — (Recommended addition, not a PRD requirement) Qualifying
question**
- "Does your website include any AI-generated content (text, images,
  chat, etc.)?" Yes / No / Not sure.
- If "No": short exit message — "You likely don't need this checklist right
  now, but here's a quick way to double-check ___" — rather than forcing a
  clearly out-of-scope visitor through the full item list.
- If "Not sure": proceed into the checklist as normal (the checklist itself
  is how they'd find out).
- This screen is my addition, not something the PRD asks for. Flagged in
  4.4 for the CPO to confirm it's wanted before it's built.

**S1.3 — Item screen (repeated once per Article 50 item — count TBD, see
flag 4.5)**
- Progress indicator ("Item 3 of N") persists across all item screens.
- Requirement text (plain language).
- Three-way status control: Compliant / Not compliant / Not sure.
- On Not compliant or Not sure: guidance panel expands inline (does not
  navigate away) — see 2.4 for content rules.
- "Next" advances once a status is selected. Back navigation is allowed
  (to review/change a prior answer) but skipping ahead without answering
  is not — the flow is linear (see tradeoff 3.3).

**S1.4 — Results/summary screen — all-compliant variant**
- Positive framing, recap list (all green/compliant).
- No fine-figure content needed here; if any fine-context copy appears at
  all in the app, this screen is a low-stakes place to reiterate the
  Article 99(6) caveat once, briefly, since it's a natural "here's your
  status" moment.
- Optional low-key "questions anyway? talk to us" link, same single contact
  point as S1.6, de-emphasized since there's nothing flagged.

**S1.5 — Results/summary screen — has-flagged-items variant**
- Recap list with per-item status (compliant/not compliant/not sure,
  visually distinguished).
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

**S1.9 — Abandonment / return-to-in-progress state**
- If a user leaves mid-checklist and comes back in the same browser
  session, the checklist should resume where they left off rather than
  restarting from item 1. Recommended as lightweight, local-only (e.g.,
  browser storage) persistence — not an account system, not cross-device.
  Flagged as underspecified in the PRD in 4.6; this is my recommended
  default, not a confirmed requirement.

**S1.10 — Sales/CS rep notification (system event, not a client-facing
screen)**
- Triggered by S1.6 submission (see 2.7 for why this trigger point, not
  checklist completion itself).
- Content needed for the rep: client identity (if known), which items were
  flagged, any free-text context, timestamp. Exact delivery channel (email?
  Slack? existing CRM?) is a `/plan`-stage decision, not a design one — not
  specified in the PRD.

### 2.4 Guidance content rules (US-7, US-9, "needs-check")

- **Not compliant items:** guidance = "how to fix it" — concrete,
  plain-language steps the self-serve-capable user can act on.
- **Needs-check items:** the PRD doesn't specify separate content for this
  status distinct from "how to fix it" (see flag 4.2). Design assumes the
  same guidance panel serves double duty — phrased to help the user
  determine their status ("here's what to look for") and, if it turns out
  they're not compliant, the same content doubles as the fix. This avoids
  building and maintaining two parallel content tracks per item without a
  PRD instruction to do so. If legal/content review later determines
  "how to check" and "how to fix" genuinely need to diverge per item, that's
  a content scope change to raise before Phase 1 content is finalized.
- **No per-item help CTA.** Guidance panels do not each carry their own
  "still stuck" button. The single contact point lives only at the results
  screen (S1.5/S1.6). This is deliberate — seeing a "need help? talk to us"
  prompt after every single item would read as a repeated upsell push,
  which US-9 explicitly asks to avoid.

### 2.5 Triage / handoff policy (affects copy, not just backend)

Per the PRD's resolved reading of the escalation policy: submitting the
contact form routes to the agency's own free triage step, not straight to
a paid-engagement conversation and not a live-chat channel. This is a
copy constraint as much as a backend one — S1.6 and S1.7 copy must not
imply an immediate live response, a booked call, or a sales pitch. It
should read as "a person will look at this and get back to you," leaving
room for the agency's triage process to decide free-guidance-only vs.
proposing paid work.

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
- **User marks an item "Not compliant," reads guidance, and wants to
  self-mark it resolved without re-answering:** not designed in as a
  distinct action (e.g., no "mark as fixed" button mid-flow) — if they've
  actually fixed it, they should just go back and change that item's
  status to Compliant via the existing back-navigation (S1.3). Adding a
  separate "I fixed it" state that doesn't change the underlying status
  would create two sources of truth for one item; kept to one control per
  item deliberately (see tradeoff 3.4).
- **User has zero items flagged but still wants to talk to someone
  (e.g., a question not covered by the checklist):** low-key link on S1.4
  covers this rather than blocking it entirely.
- **User submits the contact form, then keeps using the checklist /
  resubmits:** treat a second submission from the same session as a normal
  additional message, not an error — same idempotent-and-friendly principle
  as Phase 0's duplicate-email handling (S0.6).
- **Very long item list:** if Article 50 content mapping (pending legal
  sanity-check) produces a long list, the linear one-item-at-a-time
  pattern plus the return-to-in-progress state (S1.9) is the mitigation.
  Actual item count isn't known yet (flag 4.5) — if it turns out to be
  long, `/plan` should revisit whether a single-page checklist (all items
  visible, no forced linear stepping) is a better fit than this
  wizard-style flow.
- **Notification volume:** because notification is opt-in-triggered (2.7's
  chosen design), a self-serve owner who successfully resolves everything
  via guidance alone never generates a sales/CS notification. That's
  intentional — see 4.3 for why this is flagged as needing explicit CPO
  sign-off rather than assumed.

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
   of N has to keep going through the rest of the checklist before they can
   ask for help. Judged acceptable — the items are meant to be quick
   self-assessments, not blockers, and forcing completion before contact
   also keeps the "completed checklist" data (used for the sales
   notification and Phase 1 metrics) meaningful and consistent.
3. **Checklist flow is strictly linear (no skip-ahead, no all-at-once
   single-page view).** Simplest to build and matches "reached the final
   item" as a clean, unambiguous completion definition (per the PRD's own
   metric definitions). Cost: a user unsure about one item can't skip it and
   come back later within the same pass — they're expected to use "Not
   sure" rather than skip. Flagged in 4.5 as worth revisiting if the real
   item count turns out to be large.
4. **No separate "I fixed it" action distinct from changing an item's
   status.** One control (the three-way status) is the single source of
   truth per item, rather than layering a second "resolved" flag on top of
   it. Cost: slightly more clicks (back-navigate to change status) than a
   dedicated "mark fixed" shortcut would take. Chosen to avoid the data-
   integrity ambiguity of two flags that can disagree.
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

The remaining flags affect Phase 1, which has no fixed date, but are still
worth resolving early since they shape the checklist's core interaction
model.

1. **Mechanism for determining per-item status ("compliant / not compliant
   / needs-check") — self-report vs. a diagnostic sub-question engine.**
   US-6 just says the user wants "each item marked," without saying how the
   determination happens. This spec assumes straight self-report (user
   directly selects their own status per item, per the literal wording),
   not a system of guided sub-questions that infers status. That's the
   simpler flow and matches the PRD's Non-goals (not a legal-advice or
   certification product). Flagged in case a diagnostic approach was
   intended.
2. **What "needs-check" guidance content actually is**, distinct from "how
   to fix it" content for "not compliant" items. Not specified. This spec
   assumes one shared guidance-content slot per item does double duty (see
   2.4). Flagged because it affects the Phase 1 content-authoring workload,
   which is downstream of the still-in-progress legal sanity-check.
3. **The trigger for the US-10 sales/CS rep notification is ambiguous
   between two readings:** (a) automatic, passive — fires whenever a
   completed checklist has any non-compliant item, regardless of whether
   the client asked for help; or (b) opt-in, active — fires only when the
   client actively submits the "still stuck? talk to us" contact form. This
   spec designs for (b), because it better matches US-9's "doesn't feel
   like an upsell push" and the "agency triages first, doesn't auto-route"
   escalation policy — notifying sales about a client who never asked for
   contact would sit oddly next to that policy. But this is a genuine
   ambiguity in the PRD's own phrasing ("flagged as needing help" could
   mean either "the checklist flagged them" or "they flagged themselves"),
   and it changes how many notifications sales actually receives. Needs
   explicit confirmation before `/plan`.
4. **The qualifying "do you even have AI-generated content?" screen
   (S1.2) is my addition, not a PRD requirement.** Flagged so it isn't
   mistaken for something the PRD asked for — confirm whether it's wanted
   before it's built, since it does add a screen/decision point the PRD
   never mentions.
5. **Article 50 item count and content are not yet known** — they're an
   output of the still-running legal sanity-check, not this PRD. This
   spec deliberately specifies structure (wizard pattern, progress
   indicator, guidance-panel pattern) without assuming a specific count.
   If the real count turns out to be large, revisit the "strictly linear,
   one item at a time" pattern (tradeoff 3.3) against a single-page
   checklist alternative at `/plan`.
6. **Save/resume (session persistence) for Phase 1 is not addressed in the
   PRD's Phase 1 scope boundaries** — only Phase 0 explicitly rules out
   accounts/saved progress. Whether Phase 1 needs any persistence at all,
   and if so how much (session-only vs. something more durable), is
   genuinely open. This spec recommends a lightweight, local-only,
   no-account fallback (S1.9) as a minimum, but this is a recommendation
   to confirm, not a resolved requirement.
7. **Language scope (English-only)** carried forward from the PRD's own
   flag as unconfirmed — not a new issue raised here, just noted as still
   open and relevant to Phase 1 content authoring.

---

## Section 5 — What was simplified or cut, and why

- **Phase 0 has exactly one form field and one page.** Anything beyond
  email capture (name, company, phone, multi-step qualification) was cut
  to protect the 4-day timeline and because the PRD explicitly scopes
  Phase 0 down to "a generic interest-capture form."
- **Phase 1's status-determination is self-report only**, not a guided
  diagnostic tree, to keep the product aligned with the PRD's non-goal of
  not being a legal-advice/certification tool, and to avoid inventing
  compliance-logic complexity the PRD never asked for.
- **No per-item contact/escalation controls in Phase 1** — consolidated
  into the single results-screen contact point, both because the PRD
  describes "one" contact point and because it directly serves US-9's
  anti-upsell-pushiness goal.
- **No cross-device/account-based resume in Phase 1** — consistent with
  the PRD's broader no-accounts stance (explicit for Phase 0, inferred as
  the simplest consistent choice for Phase 1 too, per flag 4.6).
- **Cookie banner kept to a single Accept/Decline choice, no preference
  center** — the CPO's 2026-09-07 decision added the banner requirement
  itself, but the simplest GDPR-compliant shape was kept to protect the
  4-day Phase 0 timeline (see tradeoff 3.7).
</content>
</invoke>
