# Phase 1 deploy runbook

Status as of this writing: **prep only, not run for real.** Phase 1's
canonical subdomain has not been decided (/plan Open Question 2 /
`/build`'s default #2), so there is no real `DEPLOY_PATH` to target yet,
even though the same lima-city hosting account used by Phase 0 is
expected to host this too (per /plan Section 1: same account, new
sibling app, independently deployable).

This directory is Phase 1's own copy of Phase 0's `deploy/` scripts and
runbook, adapted rather than shared (/plan Section 1) so Phase 0 and
Phase 1 stay independently deployable/rollback-able from each other.
Everything below mirrors `phase-0/deploy/README.md`'s reasoning; only the
Phase-1-specific facts differ.

## One-time setup (once a real subdomain + credentials exist)

1. Decide and provision Phase 1's real subdomain (e.g.
   `checklist.gro-better.com`, the plan's own placeholder — not a
   commitment) and bind it to a document root in the hosting control
   panel, the same KIS-style step Phase 0 needed for
   `compliance.gro-better.com`.
2. Confirm with the host / its control panel:
   - SSH access, and the SSH port/host/user (likely already known from
     Phase 0's account, but the document root will be new).
   - The document root path for the new subdomain (this is `DEPLOY_PATH`
     below).
   - Whether the account exposes a `mysql` CLI over SSH (needed for
     `apply-schema.sh`).
   - Whether PHP's `mail()` actually sends from this account/host — this
     is the concrete way to resolve the NOTIFY_EMAIL deliverability
     caveat (see `phase-1/README.md` and `.env.example`).
3. Create a real, filled-in `.env` file **locally** (never commit it —
   see the repo's top-level `.gitignore`), based on
   `phase-1/.env.example`, with real `DB_*` values for a **new**
   database/schema (Phase 1's `contact_requests` table is a different
   table from Phase 0's `signups`, and per /plan Section 1 this should be
   its own DB credential set, not reused from Phase 0, for the same
   independent-rollback reasoning). Leave `GA_MEASUREMENT_ID` and
   `NOTIFY_EMAIL` blank until a real GA4 property / notification
   recipient exists.
4. Push it to the server:
   ```
   DEPLOY_HOST=... DEPLOY_USER=... DEPLOY_PATH=... \
     ./push-env.sh /path/to/your/local/filled-in/.env
   ```
5. Apply the schema once:
   ```
   DEPLOY_HOST=... DEPLOY_USER=... \
   REMOTE_DB_HOST=... REMOTE_DB_NAME=... REMOTE_DB_USER=... REMOTE_DB_PASSWORD=... \
     ./apply-schema.sh
   ```
6. Deploy the code:
   ```
   DEPLOY_HOST=... DEPLOY_USER=... DEPLOY_PATH=... \
     ./deploy.sh
   ```
7. Verify against the real domain (see the checklist below).

## Ongoing deploys

Just step 6 (`deploy.sh`) — idempotent (rsync, safe to re-run), never
touches `.env` or the DB schema. Re-run `push-env.sh` only when a config
value actually changes; re-run `apply-schema.sh` only for deliberate
schema changes.

## Why the same patterns as Phase 0

See `phase-0/deploy/README.md`'s "Why rsync-over-SSH, not a git push" and
"Why the `.env` push and schema apply are separate from code deploy"
sections — the reasoning is identical here and isn't repeated, per /plan
Section 1's instruction to reuse proven patterns rather than reinvent
them.

## Portability toward a future self-hosted move

Same as Phase 0: all three scripts are parameterized purely by
`DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_PATH` / DB connection values.
What does **not** carry over automatically: OS hardening, firewall rules,
backups, and TLS termination — those return as real work at that point,
same caveat Phase 0's plan already documented.

## Verification checklist for whoever runs the real Phase 1 deploy

None of the following can be verified without a real subdomain + real
credentials — this list is what "done" means once they exist:

- [ ] `curl -I https://<phase-1-subdomain>/.env` returns `403`, not `200`.
- [ ] `curl -I https://<phase-1-subdomain>/api/` and `/assets/` return
      `403` (directory listing closed) — applied from the start here
      rather than found by `/test` the way Phase 0's was.
- [ ] `http://`, `https://www.<phase-1-subdomain>` both redirect to the
      canonical `https://<phase-1-subdomain>/` form.
- [ ] The full wizard flow works end-to-end in a real browser: intro →
      qualifying question → all 4 items (including back-navigation
      live-recomputing a changed item's status) → both results variants
      → contact form → confirmation.
- [ ] Save/resume actually survives a real browser reload/close-reopen,
      not just the local Node-level simulation in `phase-1/README.md`'s
      verification section.
- [ ] The contact form's POST reaches `/api/contact.php` for real and
      inserts into the real `contact_requests` table.
- [ ] Once `NOTIFY_EMAIL` is set: confirm a real email actually arrives
      — PHP `mail()` deliverability on this host is UNVERIFIED until
      this step (see `phase-1/README.md`). If it doesn't arrive,
      `contact_requests.notified_at IS NULL` is the fallback way to find
      requests that still need manual follow-up.
- [ ] The cookie banner appears on first visit (this is a new origin —
      a visitor who already accepted on Phase 0's domain is re-prompted
      here, by design — see `/plan` Section 2) and persists
      Accept/Decline across a reload.
- [ ] Once a real GA4 property/ID exists: `checklist_started`,
      `checklist_completed`, and `checklist_contact_submitted` all
      actually arrive in GA4 DebugView, under both Accept and Decline
      consent states.
