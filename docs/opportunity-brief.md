# Opportunity Brief: EU AI Act Compliance Checklist for SME Clients

**Source:** `docs/ceo-review.md` — Verdict: Pursue with caveats.

## The problem

Time-poor, non-technical SME business owners who use AI-generated content on their
websites need to comply with EU AI Act Article 50 transparency obligations, but
don't have the time, legal literacy, or inclination to read the regulation and
translate it into action. Without an easy path to compliance, they delay, then
panic near a deadline — at which point they are as likely to go to a competitor
for implementation help as to come to us.

## Who has it

Our own client book: SME owners who are customers of the agency's website/tech
infrastructure services. ~80% of the current client base has AI-generated
website content and is estimated to be in scope. This is a warm, pre-identified
audience, not a cold market we need to win.

## Evidence it's real

- **Legal deadline confirmed, not speculative.** Article 50 became enforceable
  on **2 August 2026**, with a grace period for marking pre-existing
  AI-generated content running to **December 2026**. As of this brief
  (September 2026), that grace period has roughly three months left — this is
  no longer a "future" deadline, it is active and closing. [Sources:
  [artificialintelligenceact.eu](https://artificialintelligenceact.eu/transparency-rules-article-50/),
  [digital-strategy.ec.europa.eu](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act)]
- **Real enforcement teeth, but the figure must be caveated in the product
  itself.** Non-compliance can attract fines up to €15M or 3% of worldwide
  annual turnover — this is genuine fine exposure, not a reputational
  nice-to-have. However, SME-specific reduced penalty caps under the Act have
  **not been verified** in this pass. This is now a firm constraint carried
  forward (see caveat 4 below), not just an open question: the checklist's own
  risk framing at `/design` and `/build` must not cite the €15M/3% ceiling as
  if it applies uniformly to SMEs without pairing it with an explicit caveat
  that reduced caps may apply and remain unconfirmed — otherwise we overstate
  fine exposure to clients.
- **Internal signal, not yet external validation.** The 80% client-book figure
  and the "clients would churn to a competitor at the moment of panic" claim
  both come from the CEO review session, not from independent research or
  client interviews. Treat as a working assumption, not confirmed evidence,
  until tested.

## Why now

The compliance deadline is not hypothetical or distant — enforcement started
August 2026 and the marking grace period closes this December. Clients who
haven't acted will need to act within months, not quarters. This urgency is
now sharpened by a hard external date: the awareness **marketing campaign is
committed to launch Friday 11 September 2026** — days away, not an unscheduled
dependency. That commitment resolves the prior scheduling uncertainty, but it
also creates a real timeline constraint the product must meet: the checklist
needs to be ready to capture and convert campaign traffic starting **11
September 2026**, not on some later date decided after the fact. This is a
hard flag forward for `/prd`: whatever scope is defined there must be
deliverable ahead of that date, or the campaign will be driving people to
something that doesn't exist yet.

*(Date correction, 2026-09-07: the campaign launch moved from Monday 7
September 2026 to Friday 11 September 2026. All date references in this brief
have been updated accordingly; no scope or phasing changed.)*

## Rough size of prize

~80% of the existing client book is in scope. This is not a new-customer
acquisition play — it's a retention-and-upsell play against a class of client
who might otherwise churn at the point of highest need. Revenue upside is
existing implementation/compliance work pulled forward and defended against
loss to competitors, not a new product line. No independent market-sizing was
done for this brief; the "size" here is best read as "share of an already-owned
client base we might otherwise lose," not TAM in the conventional sense.

## Caveats carried forward from the CEO review (do not lose these)

1. **Marketing-campaign dependency — now a hard date, not an open scheduling
   risk.** The awareness campaign is committed to launch **Friday 11 September
   2026**. The checklist's success remains contingent on this campaign
   running and driving traffic; what's changed is that the prior "coordinate
   timelines" concern is now a concrete build deadline. `/prd` must treat 11
   September 2026 as a fixed external constraint, not a target to negotiate.
2. **Conversion metric needs a precise definition before build.** "10% of
   filled-in checklists convert to paid engagement" is directional, not yet
   operational — "filled in" (started vs. completed), "conversion" (call
   booked vs. signed engagement), and the measurement window's start date
   (publish vs. campaign launch) all need to be pinned down at `/prd`.
3. **Self-serve segment needs a real plan, not a byproduct.** The checklist
   will reveal which clients could self-serve — but what a self-serving client
   actually experiences (support or none, and the support-burden/goodwill risk
   if they get stuck) is undefined and must be addressed at `/prd`.
4. **Fine-exposure framing must not overstate risk to clients.** SME-specific
   reduced penalty caps under the Act have not been confirmed. This is now a
   firm constraint on the checklist's content, not an open question: `/design`
   and `/build` must not present the general €15M/3% ceiling as the client's
   own exposure without an explicit caveat that reduced SME caps may apply and
   are unconfirmed. Getting this wrong is a credibility and liability risk, not
   just an accuracy nitpick.
5. **Legal sanity-check — now scheduled to run in parallel, not deferred.**
   Giving compliance advice for free to non-technical owners who may act on it
   unsupervised carries liability/reputational risk for the agency if the
   checklist is wrong or incomplete. This check now starts immediately, in
   parallel with `/prd` and `/design`, and should be grounded in the EU AI
   Act's public documentation (the same sources cited above for the Article 50
   deadline) rather than requiring a formal outside legal engagement at this
   stage. A more formal legal review may still be warranted before publish,
   but the sanity-check itself must not wait until then.
