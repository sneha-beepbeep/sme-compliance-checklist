# Rollout / Rollback Checklist — Phase 0 Launch (2026-09-11)

Companion to `docs/release-notes.md`. This is an operational checklist, not
a narrative — use it on launch day and in the days immediately after.

**Live URL:** `https://compliance.gro-better.com/`
**Hosting:** lima-city (PHP + MySQL/MariaDB), deployed via
`phase-0/deploy/deploy.sh` (rsync over SSH) from this git repo.
**Rollout shape:** all at once, to the full ~80-client list, on 9/11. There
is no staged/flagged rollout — the audience is small, known, and the
artifact is a static-feeling single page, so a staged rollout would add
process without reducing real risk. (This is a judgment call specific to
this release's small, non-public audience — it is not a general policy.)

---

## 1. Pre-launch verification (status as of 2026-09-09)

Everything below was verified live against production by QA's final,
independent pass (`docs/test-report.md`, 2026-09-09). Re-confirming all of
it again immediately before send is cheap insurance, not busywork, since
~2 days will have passed:

- [ ] `https://compliance.gro-better.com/` loads (200), no visible
      placeholder text, correct eyebrow ("gro digital agency").
- [ ] Signup form: valid email → success message, row appears in `signups`
      table (verify via SSH + `mysql`, not just the UI).
- [ ] Duplicate email → identical success message, no second row.
- [ ] Empty / malformed email → inline validation error, no request sent.
- [ ] Cookie banner appears on a fresh (no stored consent) visit; Accept and
      Decline both work and persist across reload.
- [ ] `/privacy-policy` loads and is linked correctly from both the signup
      consent line and the cookie banner.
- [ ] `curl -I https://compliance.gro-better.com/.env` → 403 (not 200).
- [ ] `curl -I https://compliance.gro-better.com/api/` and `/assets/` → 403
      (directory listing closed).
- [ ] `http://`, `https://www.`, and the old `/compliance` path all
      redirect to the canonical `https://compliance.gro-better.com/`.
- [ ] **`signups` table is at a clean 0 rows** (confirmed 0 as of the final
      QA pass on 2026-09-09 — re-check immediately before send in case
      anything landed in between, and delete any stray test rows before
      the metrics clock starts).
- [ ] GA4: confirm whether a real `GA_MEASUREMENT_ID` has been set yet. If
      not, this is expected (per design, `analytics.js` skips loading
      `gtag.js` entirely rather than pointing at a placeholder) — not a
      bug to fix on launch day, but worth knowing before reading any GA4
      numbers post-launch.

No code changes are expected between now and send. If any of the above
fails on re-check, treat it as a launch-blocking regression and fix before
sending the campaign, not after.

## 2. Go-live steps

The technical artifact is already live and has been for several days
(deployed iteratively during `/build` and `/test`). There is no separate
"flip the switch" deploy step for launch day. What actually happens on
9/11:

- [ ] Marketing sends the campaign email to the ~80-client list (outside
      this repo's scope — coordinate timing with marketing directly).
- [ ] Immediately after send: re-run the `curl` checks in section 1 once
      more, quickly, to catch anything that broke between pre-launch
      verification and the actual send.
- [ ] Note the exact send time — this is the real start of the metrics
      clock (spec says 2026-09-11 00:00 CET; use the actual send timestamp
      as the practical reference point for monitoring windows below).

## 3. Monitoring — what to watch, and when

### First 2–4 hours after send (highest attention)

- **Signup endpoint health:** watch for any spike in 500s or a flatline
  (zero signups at all) on `/api/subscribe.php`. Either is a strong signal
  something is broken, not just "traffic hasn't converted yet" — see
  rollback triggers below.
- **`signups` table growth:** check via SSH + `mysql` (`SELECT COUNT(*)
  FROM signups;`) a few times through the first day. This is the real
  number — do not substitute GA4 for this, per the release notes'
  measurement caveat.
- **Server/application errors:** check PHP/Apache error logs on lima-city
  for anything unexpected (DB connection failures, PHP fatals).

### First 3–5 days (conversion-rate signal)

- **Running signup rate vs. the 10% (~8-of-80) target.** This won't be
  statistically clean with a list this small, but a rate near zero after
  a few days, when open/click data from the campaign email shows people
  are actually visiting the page, is a real signal worth investigating —
  including checking whether the known cookie-banner overlap (accepted
  risk #1 in the release notes) is suppressing signups on mobile. If
  practical, cross-reference signup timestamps against user-agent strings
  in the server logs to see whether signups are disproportionately absent
  from the affected phone band.
- **Any client replies/complaints** about the page looking broken or the
  form being unusable on their phone — treat this as direct evidence on
  the accepted mobile risk, not just an anecdote, and feed it back into
  the fast-follow decision on Finding #1.

### Throughout the campaign window

- **Zero broken-link / zero-downtime bar** (this is the PRD's explicit
  Phase 0 quality bar, not just good practice): spot-check the canonical
  URL and redirects periodically, not only on day one.
- **Privacy Policy page reachability**, given it's linked from the
  required consent copy on every signup.

## 4. Rollback — concrete triggers and procedure

### What warrants a rollback (vs. a fast-follow fix)

**Roll back if:**
- The signup endpoint is failing for all or nearly all visitors (e.g.
  sustained 500s, or `signups` isn't growing at all despite confirmed
  traffic) — visitors can no longer do the one thing this page exists for.
- The page is fully inaccessible (DNS/hosting failure, persistent 5xx on
  the page itself, TLS failure).
- A security exposure is found post-launch (e.g. `.env` or DB credentials
  become reachable, an injection vector is found) — roll back immediately
  and treat as an incident, not a normal bug.
- Something the deploy introduces actively damages data (e.g. a schema
  change starts rejecting valid inserts, duplicate-handling breaks and
  starts creating multiple rows per real person).

**Do NOT roll back for:**
- The known, CPO-accepted cookie-banner overlap on shorter phones (release
  notes, item 1) — this was knowingly shipped with a working escape hatch.
  It's a fast-follow fix candidate, not a rollback trigger.
- The Privacy Policy's known legal-completeness gaps (release notes, item
  2) — also knowingly shipped, addressed via legal review, not a rollback.
- The minor/cosmetic items (two-hop redirect, `_lcp` cookie, missing
  favicon) — none of these warrant taking the page down.
- Low signup numbers alone, absent evidence of a technical failure — a
  slow conversion rate against the 10% target is a marketing/product
  question to work through, not a rollback trigger by itself.

### Who executes a rollback, and what they need

This is a two-person-or-fewer team action, not a formal release-engineering
process:

- **Access needed:** SSH access to the lima-city account, using the
  dedicated deploy key generated for this project
  (`~/.ssh/lima_city_gro_deploy` on the machine that has it, or wherever
  it's been placed for whoever holds it) — the account does not offer
  password auth. Whoever executes a rollback needs this key and the
  `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_PATH` values (see
  `phase-0/deploy/README.md` and `phase-0/.env.example` for what these
  look like; do not commit real values anywhere).
- **A local checkout of this git repo**, since `deploy.sh` deploys from
  the working copy, not from a remote artifact store.

### Rollback procedure (code)

1. Identify the target commit. As of this release, the known-good, fully
   tested code state is commit **`0890db9`** ("`/test`: QA report (no-ship
   as-is) + `/build` fix-and-reverify pass") — this is the last commit
   that changed `phase-0/` code, and it is the exact code that QA's final
   report (`docs/test-report.md`, re-verified at commit `edbb42f`, no code
   changes since) confirms is live and passing. Confirm with `git log
   phase-0/` that no newer commit has touched application code before
   assuming this is still current.
2. Check out that commit (or, if a bad change was made *after* this
   release and needs undoing, the last commit *before* that bad change —
   check `git log --oneline phase-0/` to confirm the right target):
   ```
   git checkout 0890db9 -- phase-0/
   ```
   (Prefer checking out just the `phase-0/` path into the current working
   tree over a full branch checkout, so you don't lose uncommitted
   in-progress work elsewhere in the repo.)
3. Re-run the deploy:
   ```
   DEPLOY_HOST=<lima-city host> \
   DEPLOY_USER=<lima-city user> \
   DEPLOY_PATH=<document root> \
   DEPLOY_SSH_KEY=~/.ssh/lima_city_gro_deploy \
     ./phase-0/deploy/deploy.sh
   ```
   `deploy.sh` is idempotent and rsync-based — safe to re-run. It
   deliberately never touches `.env` or the database schema (see below),
   so this step alone cannot lose configuration or signup data.
4. Re-run the section-1 verification checklist against production to
   confirm the rollback actually took effect (don't assume the script
   exiting cleanly means the site is correct — re-check the live URL).

### What a rollback must NOT do

- **Must not delete or lose real signup data.** From 2026-09-11 onward,
  the `signups` table holds real client email addresses. `deploy.sh`
  never touches the database, and the schema (`phase-0/db/schema.sql`) is
  additive-only (`CREATE TABLE IF NOT EXISTS`) — there is no destructive
  migration to "roll back" in the first place. A code rollback is
  DB-safe by construction; don't improvise a manual `DROP`/`TRUNCATE` for
  any reason during a rollback.
- **`.env` should not need to change** for a code rollback. `push-env.sh`
  is a separate, deliberate step (see `phase-0/deploy/README.md`) — only
  run it if the rollback specifically requires a config change (e.g.
  reverting a bad `GA_MEASUREMENT_ID`), not as a routine part of rolling
  back code.
- **Do not re-run `apply-schema.sh`** as part of a rollback unless the
  triggering issue is itself a schema problem — it's a separate,
  deliberate step for a reason.

### If the page needs to come down entirely (worst case)

If the trigger is a live security exposure and simply redeploying older
code isn't sufficient to stop it (e.g. the exposure is in a still-affected
older commit too), the fastest safe option on this stack is to rename or
remove `public/index.html` and `api/` on the server via the same SSH
access (leaving `.env` and the database untouched) so the domain serves a
plain 404 rather than a broken or exposed page, while a proper fix is
prepared. This is a deliberate manual step, not scripted — there is no
"maintenance mode" toggle in this codebase today.

## 5. Post-rollback

- [ ] Confirm via `git log` and a live `curl`/browser check that the
      rolled-back version is actually what's serving.
- [ ] Re-check `signups` table row count is unchanged by the rollback
      itself (it should only ever grow from real traffic, never shrink
      because of a deploy).
- [ ] Document what triggered the rollback and the fix plan before
      redeploying forward again — don't re-deploy the same bad commit by
      accident during a rushed fix cycle.
