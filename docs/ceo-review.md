# CEO Review

## Raw idea (as given)

> webpage with a checklist for SMEs to follow to be compliant with EU AI ACT Article 50 if they have AI-generated content on their website. Our company is a digital services agency that builds websites, tech infrastructure and ensures compliance for SME clients

**Reframed by CPO to fit required shape** (idea for user within the context of domain):

> A stand-alone compliance checklist, for SME customers of our digital agency, designed for the business owner, non-technical, to make sure their website is compliant with the EU AI Act.

## Session log

### Q1 — What problem does this actually solve, and for whom, specifically?
**Answer:** A time-poor SME business owner knows compliance deadlines are looming at year-end but doesn't have time to read the EU AI Act, understand requirements, or implement them.

**Follow-up:** Is broad deadline-awareness already true across the client base, or does this product depend on creating that awareness?
**Answer (resolved later, see below):** Passive tool; awareness is being driven separately by a marketing campaign the team is already planning around looming compliance deadlines.

### Q2 — What happens if we simply don't pursue this — who loses, and how much?
**Answer:** Clients would likely delay, then panic near year-end and go to another provider to implement compliance. Non-compliance carries large fines, so there's real urgency/enforcement risk, not just reputational risk.

### Q3 — What's the realistic size of the opportunity, and is this the best use of the team's time right now?
**Answer:** ~80% of the current client book has AI-generated website content and would be in scope. If clients hire the agency to implement compliance, it slots in easily alongside existing revenue/budget priorities. As a side benefit, the checklist would also help identify which clients can self-serve versus which need paid implementation help.

### Q4 — Who's the realistic competitor or alternative, and why would this beat it?
**Answer:** The tool is free and designed to lead to paid engagements. It competes against generic legal-tech/SaaS compliance tools, law firms, and free content pieces — winning on being faster, simpler, and requiring less reading, and cheaper than a law firm or SaaS tool.

### Q5 — Is this genuinely differentiated, or is it table stakes?
**Answer:** The checklist content itself is not the moat (easily copied). The real differentiation is the ability to execute the fix immediately afterward, since the agency already builds and runs the client's site/infrastructure — something a law firm or SaaS tool can't offer. The agency also has a pre-selected, warm audience in its existing client book rather than needing to win cold traffic.

### Q6 — Does this reinforce or dilute the product's overall strategic position?
**Answer:** It reinforces the core business — it points into the agency's existing compliance offering and strengthens positioning as a one-stop shop, rather than narrowing the agency into a standalone "AI Act compliance" identity.

### Q7 — What would tell us in 90 days that pursuing this was a mistake?
**Answer:** If completed checklists convert to paid implementation engagements at less than a 10% rate after 90 days, pull it.

### Follow-up — Passive tool vs. active awareness campaign
**Answer:** The checklist itself is passive (published, not actively pushed), but the marketing team is already planning a campaign around looming compliance deadlines to drive traffic to it. The 10% conversion trip-wire should be read as measuring checklist-to-engagement conversion, contingent on that campaign actually running and driving completions in the first place.

## Verdict: Pursue with caveats

### Reasoning

The case is genuinely strong on the fundamentals that matter most: a specific, believable user problem (non-technical SME owner, real deadline, real fine exposure), a warm and sizeable addressable base (~80% of an existing client book, no cold-audience problem), a real cost of inaction (clients churning to competitors at the exact moment of highest need), and — most importantly — an actual structural moat rather than a borrowed one. The checklist content is trivially copyable by anyone; what isn't copyable is the agency's ability to execute the fix immediately because it already owns the client's infrastructure. That's a legitimate reason this beats a law firm, a SaaS compliance tool, or a competitor's content piece, and it's coherent with the agency's core identity rather than diluting it — it strengthens the "one-stop shop" position rather than repositioning the company as a compliance/legal specialist it isn't built to sustain.

The caveats that should travel forward into `/kickoff` and `/prd`:

1. **The funnel has two halves, and only one is in scope here.** The checklist's success (and the 10% conversion trip-wire) is entirely dependent on the marketing team's awareness campaign actually landing and driving traffic. Product and marketing timelines need to be coordinated explicitly — a checklist with no visitors can't fail on conversion, it just never gets tested. This dependency should be named, not assumed.
2. **"10% of filled-in checklists convert to paid engagement" should be defined precisely before build** — what counts as "filled in" (started vs. completed), what counts as "conversion" (a sales call booked vs. a signed engagement), and over what window the 90 days is measured from (publish date, or campaign launch date). As stated, it's directionally useful but not yet precise enough to be a clean trip-wire.
3. **The self-serve segment needs a real answer, not just a byproduct.** The CPO noted the checklist would incidentally reveal which clients can self-serve versus which need help — but no plan yet exists for what a self-serving client experiences (do they just get a checklist with no support, and if they get stuck, does that create support burden or ill will toward the agency?). This should be addressed at `/prd`, not left implicit.
4. **Legal exposure of giving compliance guidance for free should be sanity-checked.** A checklist that's wrong or incomplete, given to non-technical owners who may act on it without a lawyer, carries some liability/reputational risk for the agency itself. Worth a lightweight legal sanity check before publish, not necessarily a blocker to starting product work.

None of these are reasons to stop — they're scoping and sequencing issues to resolve during opportunity framing and PRD work, not signs the underlying bet is wrong. Recommend proceeding to `/kickoff`.
