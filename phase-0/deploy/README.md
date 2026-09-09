# Phase 0 deploy runbook — lima-city (git/SSH managed hosting)

Status as of this writing: **prep only, not run for real.** There are no
real lima-city credentials yet (expected EOD 2026-09-07 per the plan;
still pending). Nothing in this directory has touched a real server.
This is everything that can be made ready without one.

Per the approved `/plan`, this class of managed hosting (Strato/
lima-city-style) is reached via plain git/SSH, not by running
`phase-0/Dockerfile`'s container — that image is local-dev-parity and
future-self-hosted-migration tooling only (see the Dockerfile's own
header comment). Concretely here, "git/SSH" means: your working copy is
this git repo, and code reaches the server via **rsync over SSH** (see
below for why rsync specifically, rather than a git push/hook).

## One-time setup (once real credentials exist)

1. Confirm with lima-city / the account's control panel:
   - SSH access is enabled, and the SSH port/host/user.
   - The document root path for `compliance.gro-better.com` (this is
     `DEPLOY_PATH` below).
   - Whether the account exposes a `mysql` CLI over SSH (needed for
     `apply-schema.sh`) and what the DB host looks like from the
     server's own perspective (often `localhost`, but confirm).
   - Whether the account lets you set real process-level environment
     variables for PHP at all (many shared-hosting PHP setups don't —
     see `api/env.php`'s header comment). If it does, prefer that over
     the `.env`-file fallback below.
2. Create a real, filled-in `.env` file **locally** (never commit it —
   see the repo's top-level `.gitignore`), based on
   `phase-0/.env.example`, with real `DB_*` values for the lima-city
   database. Leave `GA_MEASUREMENT_ID` blank until a real GA4 property
   exists (see `public/config.php`'s comment on why that's safe to leave
   unset).
3. Push it to the server:
   ```
   DEPLOY_HOST=... DEPLOY_USER=... DEPLOY_PATH=... \
     ./push-env.sh /path/to/your/local/filled-in/.env
   ```
4. Apply the schema once:
   ```
   DEPLOY_HOST=... DEPLOY_USER=... \
   REMOTE_DB_HOST=... REMOTE_DB_NAME=... REMOTE_DB_USER=... REMOTE_DB_PASSWORD=... \
     ./apply-schema.sh
   ```
5. Deploy the code:
   ```
   DEPLOY_HOST=... DEPLOY_USER=... DEPLOY_PATH=... \
     ./deploy.sh
   ```
6. Verify against the real domain (none of this is verifiable without a
   real server — see the checklist at the bottom).

## Ongoing deploys

Just step 5 (`deploy.sh`) — it's idempotent (rsync, safe to re-run) and
deliberately never touches `.env` or the DB schema. Re-run `push-env.sh`
only when a config value actually changes (e.g. once a real
`GA_MEASUREMENT_ID` exists); re-run `apply-schema.sh` only for deliberate
schema changes.

## Why rsync-over-SSH, not a git push

Platform-as-a-service style `git push` deploys rely on the remote
running a post-receive hook (or an equivalent buildpack step) to check
out the pushed commit into the served directory. Budget shared/managed
hosts like lima-city's advertised tier are typically plain SSH + a
document root you manage yourself, with no such hook — "git" in the
plan's "plain git/SSH" phrasing is read here as *your local workflow
uses git*, not that the host runs git deploy machinery. **This is a
judgment call, not confirmed against the real lima-city account** — if
the real account does turn out to support a git-push deploy flow, that
would be a strictly simpler replacement for `deploy.sh`'s rsync step
alone (config-file/schema handling above stays the same either way).

## Why the `.env` push and schema apply are separate from code deploy

- `push-env.sh` is separate so an ordinary code deploy (`deploy.sh`) can
  never accidentally overwrite production secrets — it's a distinct,
  rarer, more deliberate action.
- `apply-schema.sh` is separate so schema changes are always a conscious
  step, not something silently bundled into a routine code push.

## Portability toward a future self-hosted move

All three scripts are parameterized purely by `DEPLOY_HOST` /
`DEPLOY_USER` / `DEPLOY_PATH` / DB connection values — pointing them at a
future self-hosted box (e.g. the Proxmox move discussed in `/plan`) is a
different set of env var values for these same scripts, not a rewrite.
What does **not** carry over automatically, per the plan's own framing:
OS hardening, firewall rules, backups, and TLS termination all have to be
built for real at that point — these scripts only move code/config/
schema, they don't stand up a server.

## Verification checklist for whoever runs the real Day 2 deploy

None of the following can be verified without real credentials — this
list is what "done" means once they exist, carried over from
`phase-0/README.md` and the code's own comments:

- [ ] `curl -I https://compliance.gro-better.com/.env` returns `403`, not
      `200` — confirms `public/.htaccess`'s deny rule actually took
      effect on the real Apache config (`AllowOverride`/`mod_rewrite`
      assumptions are unverified until now).
- [ ] `http://`, `https://www.compliance.gro-better.com`, and the old
      `/compliance` and `/compliance/` paths all redirect to
      `https://compliance.gro-better.com/` — the canonical-URL "zero
      broken link" bar from `docs/design-spec.md` 1.1, updated 2026-09-09
      when the canonical URL moved from the original apex+path form
      (`gro-better.com/compliance`) to this dedicated subdomain's root.
- [ ] The signup form's POST actually reaches `api/subscribe.php` at
      `/api/subscribe.php` (absolute path assumption — see
      `public/assets/form.js`'s header comment) and inserts into the
      real `signups` table.
- [ ] The cookie banner appears on first visit, persists Accept/Decline
      across a reload, and `window.setAnalyticsConsent` actually flips
      Consent Mode state — none of this has been exercised in a real
      browser yet, only read through as code.
- [ ] Once a real GA4 property exists: `GA_MEASUREMENT_ID` is set,
      `page_view` and `generate_lead` events actually arrive in GA4, and
      `generate_lead` is marked as a conversion in the GA4 admin console
      — remembering the design spec's own flagged risk that GA4 can
      undercount signups submitted before the cookie banner is answered,
      so the `signups` table stays the actual source of truth for the
      ~8-signup (10%) target, not the GA4 dashboard.
