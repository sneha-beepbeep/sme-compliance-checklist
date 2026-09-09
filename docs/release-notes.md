# Release Notes — Phase 0: Compliance Checklist Interest Page

**Release date:** Friday 11 September 2026 (campaign send date)
**Prepared:** 2026-09-09
**Audience:** internal — CPO, sales/CS, and engineering. This is the internal
record of what shipped, to whom, and what's known about it. It is not the
copy sent to clients (that's the campaign email and the page itself,
`https://compliance.gro-better.com/`) and it is not the end-user-facing
README (see the repo root `README.md` for that).

---

## What shipped

**Phase 0 of the EU AI Act compliance checklist project: a single-page,
email-capture "coming soon" placeholder**, live at
**https://compliance.gro-better.com/**, hosted on lima-city (PHP +
MySQL/MariaDB backend, real production database).

This is *not* the checklist itself. It's a holding page that:

- explains, in plain language, why Article 50 of the EU AI Act matters for a
  business's AI-generated website content,
- tells the visitor a free checklist is coming,
- captures an email address so we can notify them the moment it's ready,
- carries campaign UTM tracking and GA4 (Consent Mode v2) so traffic is
  measurable,
- links to a Privacy Policy and shows a cookie-consent banner (Accept/
  Decline) before any analytics cookie is set.

The full interactive checklist (Phase 1) is **not** part of this release —
see "What's not shipping" below.

## Who this goes to, and when

- **Audience:** our existing client list only (~80 clients) — this is not a
  public launch and the page is not being promoted to non-clients.
- **Send date:** Friday 11 September 2026. The Phase 0 success-metrics clock
  (see PRD) starts at 2026-09-11 00:00 CET.
- **Target:** roughly 8 of the ~80 clients (10%) leave an email address.
  **The `signups` table in the production database is the source of truth
  for this number — not the GA4 dashboard.** GA4's `generate_lead` event can
  under-count real signups made before a visitor has answered the cookie
  banner (a measurement limitation flagged back at `/design` and unchanged
  at ship time), so GA4 should be read as directional traffic/engagement
  data, not as the number this launch is judged against.
- The `signups` table was confirmed at a clean 0 rows as of the final QA
  pass on 2026-09-09, ahead of the 9/11 clock.

## Known limitations and accepted risks

Everything below was found during QA (`docs/test-report.md`, final pass
2026-09-09) and was either fixed before this release or knowingly accepted.
Nothing here is being swept under the rug.

### 1. Cookie banner can visually block the signup form on a specific band of shorter phones (accepted risk — CPO decision)

On a **first-time visit, before the visitor has tapped Accept or Decline**,
the cookie-consent banner overlaps and blocks taps on the email field and
"Notify me" button on a defined band of shorter-viewport phones:

- **Affected:** iPhone 6/6s/7/8 and iPhone SE (2020/2022) at 375×667, plus a
  range of smaller/older Android phones around 360×640–710px logical
  height. This is a real, still-in-use device band, not a hypothetical one.
- **Not affected:** the original iPhone SE (1st gen, 320×568) — the form
  sits below the fold there rather than under the banner — and all
  current-generation phones (iPhone X/11 Pro/12 mini and newer, 390×844+).
- **There is a working escape hatch:** tapping either banner button, or
  simply scrolling, immediately resolves the overlap and the form works
  normally from then on. It is not a dead end for an affected visitor, but
  it does mean their very first impression of the page can look like it has
  no visible signup form.
- QA's recommendation was fix-before-launch, given this is a direct,
  confirmed violation of the design spec's explicit requirement that the
  banner must never obscure the signup form, and it lands at the exact
  moment (first touch, pre-consent) the 10% target is decided.
- **The CPO reviewed this evidence and made the explicit call to ship
  anyway**, accepting the risk given the working escape hatch and the
  defined, partial nature of the affected device slice, against QA's
  recommendation.
- **Follow-up:** treat as a fast-follow fix candidate, not closed. Owner:
  engineering. Monitor signup conversion for early signs it's suppressing
  signups on affected devices (see Monitoring in the rollout checklist) —
  if the signal looks bad, prioritize the fix mid-campaign rather than
  waiting for a natural next cycle.

### 2. Privacy Policy is live but is explicitly a placeholder pending real legal review (accepted, needs follow-up)

`https://compliance.gro-better.com/privacy-policy` is live, linked from both
the signup consent line and the cookie banner, and is free of the
mechanical issues (unfilled placeholder text, an incorrect data-collection
claim, an unverified external link) found in an earlier draft. However, by
design — not oversight — it still has real GDPR-completeness gaps:

- No data-controller legal entity/address beyond a contact email
  (`info@gro-better.com`).
- No stated legal basis for processing.
- No stated retention period.
- No explicit list of data-subject rights (access, rectification, erasure,
  objection, portability, right to complain to a supervisory authority).

This is flagged directly in an HTML comment in the page's own source
(visible to whoever edits the page, not to visitors). **Action item: get a
real legal review of this page before or shortly after the 9/11 launch.**
This is the legal sanity-check caveat carried all the way from the original
CEO review — it should be treated as a genuinely open item, not something
this release quietly closes.

### 3. Minor, lower-priority accepted items

- `http://www.compliance.gro-better.com/` reaches the canonical URL via two
  redirect hops instead of one. Cosmetic; no broken links.
- lima-city's own hosting platform sets an undisclosed `_lcp` cookie
  unconditionally, independent of our own cookie-consent logic. Worth
  folding into the pending legal/privacy-policy review above rather than
  treating as a separate item.
- No `favicon.ico` is served. Cosmetic only.

## What's not shipping

**Phase 1 — the full interactive checklist — is not part of this release.**
It remains directional only: no build has started, and per the PRD it has
no fixed date beyond "well before December 2026" (ahead of the Article 50
marking grace period closing). Nothing about this Phase 0 release commits
to a specific Phase 1 date; that will be a separate `/plan` and `/build`
effort with its own scope.

## Reference

- Requirements this shipped against: `docs/prd.md`, `docs/design-spec.md`
  (Phase 0 sections/states).
- Full QA evidence and methodology: `docs/test-report.md` (final,
  independent re-verification pass, 2026-09-09).
- Rollout steps, monitoring plan, and rollback procedure: see
  `docs/rollout-rollback-checklist.md`.
