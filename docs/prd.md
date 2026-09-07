# PRD: SME EU AI Act Compliance Checklist

**Source:** `docs/opportunity-brief.md` (approved). This PRD resolves the five
carried-forward caveats into firm scope decisions. On 2026-09-04, the CPO also
answered this PRD's original three open questions; those resolutions are
folded in below, inline, at the sections they affect — each one flagged
clearly as either a verbatim CPO statement or an inferred reading of a short
answer, so the CPO can spot and correct anything read wrong before `/design`.

*(Date correction, 2026-09-07: the marketing campaign launch date moved from
Monday 7 September 2026 to Friday 11 September 2026. All date references
below — the Phase 0 ship date, the "days out" framing, and the Phase 0
metrics clock start — have been updated accordingly. Nothing else in this
PRD — scope, phasing, the two-phase structure, or the CPO's confirmed answers
on audience/escalation/target — has changed.)*

## The scoping call this PRD has to make

Today is **7 September 2026**. The marketing campaign launches **Friday 11
September 2026** — four days out. A full interactive checklist (content
mapped from Article 50, compliance-status logic, self-serve guidance,
paid-engagement handoff, and a legal sanity-check on the content) cannot
responsibly clear `/design`, `/plan`, `/build`, and `/test` gates in four
days. Treating that as still "in scope for launch day" would be wishful, not
scoped.

So this PRD splits the product into two committed phases, not a "happy path
plus a vague contingency":

- **Phase 0 — Placeholder page. Ships 11 September 2026.** This is not a
  fallback to reach for if things go wrong; it is the actual, sole launch-day
  deliverable. It is small enough to realistically clear all pipeline gates
  in four days.
- **Phase 1 — Full checklist. Fast-follow, no fixed date yet.** Bounded only
  by "comfortably before the Article 50 marking grace period closes in
  December 2026" (see brief). Its actual ship date is an output of `/design`
  and `/plan`, not an input fixed here.

Everything below scopes each phase explicitly rather than leaving Phase 1's
existence implicit.

## Goals

1. Do not let the 11 September campaign launch point at a broken or
   nonexistent page (Phase 0).
2. Capture and hold campaign-driven interest until the full checklist exists,
   so traffic isn't wasted (Phase 0).
3. Give non-technical SME owners in our client book a plain-language way to
   determine their Article 50 compliance status for AI-generated website
   content, without reading the regulation themselves (Phase 1).
4. Convert checklist completions into either confirmed self-serve resolution
   or a paid implementation engagement, defending against clients churning to
   a competitor at the point of panic (Phase 1).
5. Frame legal/fine risk honestly — accurate enough to motivate action,
   caveated enough not to overstate the agency's own certainty (both phases,
   wherever fines are mentioned).

## Non-goals

- This is not a general EU AI Act compliance product. It covers Article 50
  transparency obligations for AI-generated website content only — not
  high-risk AI system classification, GPAI provider obligations, or any other
  part of the Act.
- This is not a legal-advice product and will not claim to make a client
  "compliant" or "certified" — it flags status and routes to help.
- This is not a new-customer acquisition funnel. Per the brief, this is a
  retention/upsell play against the existing client book; broad public
  audience growth is marketing's remit, not this product's.
- This is not an implementation tool. It flags what's wrong; it does not fix
  websites itself. Fixing is the existing paid engagement, delivered by
  humans, that this product hands off into.

## Target users

1. **Primary — self-serve-capable SME owner.** Existing client, non-technical,
   has AI-generated website content, comfortable making small website changes
   themselves (or has someone who is) if told exactly what to do.
2. **Primary — needs-help SME owner.** Same profile, but not comfortable or
   able to make the change themselves; the checklist's job for this user is
   to convert into a paid engagement, not to teach them to self-serve.
3. **Secondary — agency sales/CS rep.** Needs to know when an existing client
   has completed the checklist and been flagged as needing help, so they can
   follow up before the client shops elsewhere. (Caveat 3 makes this
   explicit rather than incidental — see Phase 1 user stories.)

**Resolved — campaign audience scope: client list only.** The 11 September
campaign targets the existing client list, not broader public/prospect
traffic. **Flag for the CPO:** the answer to this PRD's original either/or
question ("is the campaign targeted only at the existing client list, or
broader public/prospect traffic?") was a bare "Yes," which doesn't literally
resolve an either/or choice — this reading is an inference, not a verbatim
statement. It's taken as client-list-only because that's the only reading
consistent with the non-goal above ("not a new-customer acquisition funnel";
"broad public audience growth is marketing's remit, not this product's") and
with the CPO's Phase 0 target-setting answer (see Success metrics below),
which sizes the target against a named ~80-client count rather than open
public traffic. If this reading is wrong, correct it before `/design` — it
drives Phase 0's page copy (client-addressed, not general-public) and rules
out sizing Phase 1's self-serve support-risk for unknown non-client visitors.

## Core user stories

### Phase 0 — Placeholder (ships 11 September 2026)

- **US-1:** As a campaign visitor, I want to land on a working page that
  explains what's coming and why it matters to my business, so the campaign
  doesn't send me to a dead or confusing page.
- **US-2:** As a campaign visitor, I want to leave my email so I'm notified
  when the checklist is ready, so I don't have to remember to come back on my
  own.
- **US-3:** As the marketing team, I want the placeholder page to carry the
  same UTM/analytics tracking as the rest of the campaign, so campaign
  traffic is measurable even before the full checklist exists.
- **US-4:** As a placeholder visitor, if the page mentions fines or penalties
  at all, I want that framing to be accurate and caveated, not a single
  scary number, so I trust the agency's messaging from the first touch.

### Phase 1 — Full checklist (fast-follow)

- **US-5:** As a non-technical SME owner, I want a plain-language checklist
  of what Article 50 requires for AI-generated content on my website, so I
  know what applies to me without reading the regulation myself.
- **US-6:** As that owner, I want each item marked compliant, not compliant,
  or needs-check, so I know where I stand without guessing.
- **US-7:** As a self-serve-capable owner, I want items I can likely fix
  myself to come with clear "how to fix it" instructions, so I can close the
  gap without paying the agency.
- **US-8:** As an owner who can't or doesn't want to self-serve, I want a
  clear, specific path to request paid help for exactly the items I'm stuck
  on, so I'm not starting a vague new conversation from scratch.
- **US-9:** As a self-serve owner who gets stuck despite the guidance, I want
  a low-friction way to ask for help that doesn't feel like an upsell push,
  so I don't lose goodwill toward the agency at the moment I need it most.
  *(This is the explicit answer to caveat 3 — see Scope Boundaries below for
  what "low-friction help" actually is in v1.)*
- **US-10:** As a sales/CS rep, I want to be notified when an existing client
  completes the checklist and is flagged as needing help, so I can follow up
  proactively instead of waiting for them to reach out.
- **US-11:** As any owner reading fine/penalty framing in the checklist
  results, I want honesty about uncertainty in my actual exposure, so I'm not
  misled into either complacency or panic.

## Success metrics

Per caveat 2, "10% of filled-in checklists convert to paid engagement" is not
yet operational. This PRD pins down definitions and — because Phase 0 and
Phase 1 ship on different, currently-unrelated dates — **splits the
measurement into two separate clocks.**

### Phase 0 metrics (clock starts 2026-09-11, campaign launch)

- **Traffic captured:** sessions landing on the placeholder page via campaign
  UTM parameters, measured from 2026-09-11 00:00 CET.
- **Interest signups:** unique email captures ÷ unique sessions. **Target
  (CPO-stated):** 10% — the CPO's exact words were "We do [set the target].
  let's say 10 out of 80 clients, so 10% as stated." That's roughly 8 email
  captures against the ~80 in-scope clients in the client book (per the
  brief's client-book sizing), not measured against open public traffic —
  consistent with, and reinforcing, the client-list-only campaign scope
  resolved above. Ownership of this number sits with the CPO/agency.
- **Quality bar, not a growth metric:** zero broken-link or downtime
  incidents against the campaign's linked URL during the campaign window.
  This is the literal "don't break the campaign's traffic" requirement from
  the CPO's fallback decision, made measurable.

### Phase 1 metrics (clock starts on full-checklist launch date — a later,
distinct date from Phase 0, to be set at `/plan`)

- **"Started"** = opened the checklist and answered at least one item.
- **"Filled in" / "completed"** (the operative term for the conversion
  metric) = reached the final item and viewed or submitted a results
  summary. Started and completed are tracked separately; completed is the
  denominator below.
- **"Conversion" (primary, product-owned, near-term signal):** a completed
  checklist that results in a booked scoping/discovery call within 14 days
  of completion. This is what the product can directly measure and is
  responsible for driving.
- **"Conversion" (secondary, lagging, jointly owned with sales):** of those
  booked calls, how many become signed paid engagements. Tracked, but not
  used as the 90-day trip-wire metric, since signing timelines depend on
  sales-cycle length outside the product's visibility window.
- **90-day trip-wire (per CEO review Q7):** clock starts on the full
  checklist's own launch date, not 11 September and not this PRD's publish
  date. If completed-checklist-to-booked-call conversion is below 10% at day
  90 from that date, revisit per the CEO review's original kill criterion.
- **Self-serve completion rate:** % of completed checklists where every item
  was self-serve-resolved with no help request. This is a leading indicator
  that tests the brief's "80% of client book in scope" and self-serve-share
  assumptions, which are currently unvalidated working assumptions, not
  confirmed evidence.

## Scope boundaries — explicitly out of scope

### Out of scope for Phase 0 (placeholder, by 11 September 2026)

- Any interactive checklist logic or content.
- Any compliance-status determination for a specific visitor.
- Self-serve fix guidance.
- A paid-engagement booking flow beyond a generic interest-capture form.
- Any account, login, or saved progress.
- Any fine-amount calculator or client-specific risk estimate.

### Out of scope for Phase 1 (full checklist), pending future re-scoping

- Anything beyond Article 50 transparency obligations for AI-generated
  content (no high-risk system classification, no GPAI provider obligations,
  no general AI Act coverage).
- Formal legal advice, compliance certification, or any "this makes you
  compliant" guarantee language.
- A dedicated live-chat or real-time support channel for self-serve users.
  **This is the concrete answer to caveat 3's support-burden question:** in
  v1, a stuck self-serve user gets one lightweight, asynchronous "still
  stuck? talk to us" contact point that routes into the same intake used for
  paid-help requests (US-8/US-9) — not a separate, unbounded support queue.

  **Resolved — escalation policy: agency-run free triage, not straight to
  paid.** The CPO's exact words on who owns this call were "Our company
  does." Read together as: (a) the agency owns and runs this decision
  internally, not something left to per-client negotiation, and (b) because
  the answer affirmed *doing* something rather than picking "straight to
  paid," it's read as the agency staffing its own triage step on these
  requests — a free triage touch — before any paid-engagement conversation
  starts, rather than auto-routing straight into the paid funnel. **Flag for
  the CPO:** this is an inference from a short answer, not a verbatim policy
  statement — if the intent was actually "route straight to paid," correct
  this before `/design`, since it changes whether triage capacity needs to be
  staffed and planned for.
- CRM or dashboard tooling for sales beyond the single completion
  notification in US-10.
- Multi-language support (English assumed unless client base data says
  otherwise — flagged as unconfirmed).
- Automatic implementation of fixes. The checklist flags; a separately
  scoped, human-delivered, paid engagement implements.
- Any general public-marketing or audience-acquisition mechanic — that
  remains marketing's responsibility, not this product's.

## Content requirement: fine/penalty framing (caveat 4)

Any user-facing copy in either phase that references fines or penalties must:

- **Never** state the general €15M / 3% (or higher-tier equivalents)
  ceiling as if it is the individual client's own exposure.
- Explicitly note that Article 99(6) of the Act establishes SME/small
  mid-cap-specific caps (the lower, not the higher, of the percentage or
  fixed-amount figures) — a real statutory provision, confirmed to exist by
  desk research during this PRD (see below), but not yet confirmed as fully
  mapped to this client base's specific exposure.
- **Never** present a single computed "your potential fine is €X" figure.
  This is an explicit non-goal for both phases, not just a style note.

This constraint applies to the placeholder page too, if it mentions fines at
all, not only to the eventual checklist's results content.

## Parallel workstream: legal sanity-check (caveat 5)

Per the brief, a lightweight legal sanity-check — grounded in the EU AI Act's
public documentation, not a formal outside legal engagement — starts now, in
parallel with `/prd` and `/design`, rather than waiting for pre-ship.

As a starting input for that check, desk research done during this PRD found
that **Article 99(6) of the AI Act does establish a distinct SME/start-up fine
cap** (the lower, rather than higher, of the percentage-of-turnover or
fixed-amount figures for each tier) — corroborating that reduced caps exist
in principle. This is a useful lead, **not** a substitute for the sanity-check
itself: it hasn't been verified how this interacts with Article 50
specifically, how "SME" is defined for cap purposes, or whether our client
book's turnover profile changes which tier applies. The sanity-check owner
should treat this as a starting pointer, not a conclusion.

**Sources referenced in this pass:** [artificialintelligenceact.eu — Article
99](https://artificialintelligenceact.eu/article/99/),
[digital-strategy.ec.europa.eu — Article 50
FAQ](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act).
Secondary summarizer sites turned up in the same search were not treated as
authoritative and are not cited here.
