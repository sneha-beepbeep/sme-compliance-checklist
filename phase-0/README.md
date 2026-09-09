# Phase 0 — placeholder page

Single-page email-capture placeholder for the 11 Sept 2026 campaign
(`docs/design-spec.md` Section 1). See the root `CLAUDE.md` decision log for
the current stage/status and the plan this was built against.

## Local development

```
cd phase-0
cp .env.example .env      # defaults already work for local Docker
docker compose up --build
```

Then open `http://localhost:8080`.

This container is dev-parity only — see `Dockerfile`'s header comment.
The actual lima-city deploy (Day 2, pending credentials) is via git/SSH
to managed hosting, not by running this image.

## Layout

- `public/` — everything served to the browser: `index.html`, `assets/`
  (JS/CSS), `config.php` (env-driven frontend config — currently just
  `GA_MEASUREMENT_ID`; see its own header comment), and `.htaccess`
  (canonical-URL rules, plus a deny rule for `.env`/`.sql` files).
- `api/` — `subscribe.php` (POST endpoint), `db.php` (connection helper),
  and `env.php` (a `.env`-file loader that bridges real env vars onto
  hosts that don't support setting them directly — see its header
  comment). All config is read via `getenv()`; nothing is hardcoded.
- `db/schema.sql` — portable `CREATE TABLE` for the `signups` table,
  applied automatically to the local MariaDB container on first start.
- `deploy/` — git/SSH deploy runbook and scripts for lima-city-style
  managed hosting (`deploy.sh`, `push-env.sh`, `apply-schema.sh`) — see
  `deploy/README.md`. **Not yet run for real** — no lima-city credentials
  exist yet; this is prep, not a verified deploy.

In both local Docker and the intended production layout, `public/` and
`api/` are merged at the same web root (see `Dockerfile` and
`public/.htaccess`) — the frontend calls `/api/subscribe.php` as a
domain-root-absolute path, not a relative one. See the comment at the top
of `public/assets/form.js` for why.

## Canonical URL

The canonical URL is `https://compliance.gro-better.com/` (https,
non-www, subdomain root). This supersedes the original design-spec.md
1.1/1.4 decision (`gro-better.com/compliance`, apex + path) — the CPO
moved the site to a dedicated subdomain on 2026-09-09, after Day 2's
first real deploy had already made both forms serve identical content.
`public/.htaccess` now redirects the old `/compliance` path to the
subdomain root rather than serving it as a second live URL.

To be re-confirmed against the real lima-city vhost after this change is
redeployed:

1. `mod_rewrite` is enabled and `AllowOverride` permits `.htaccess` to
   take effect at all.
2. `compliance.gro-better.com`'s document root is dedicated to this app
   (nothing else lives at the subdomain root — `assets/` and `api/` are
   top-level paths).
3. lima-city's own control panel doesn't inject a conflicting https/www
   redirect that loops against these rules.

See `deploy/README.md`'s verification checklist for the exact commands
re-run against the live subdomain after this change.

## What's verified locally vs. not

Verified against a local PHP + MariaDB stack, most recently re-run after
adding `api/env.php` and `public/config.php` against a merged docroot
that mirrors the actual deployed layout (public/ + api/ merged, `.env`
at the top level, matching `Dockerfile`'s `COPY` layout — not just the
repo's `public/`/`api/` source layout): form validation (empty /
invalid / valid), successful insert, duplicate-email idempotency (same
success response, single row), the server-error path (bad DB
credentials -> generic visible error, real cause in server logs), and
`/config.php` correctly emitting `null` with `GA_MEASUREMENT_ID` unset
and the real value once set. This second pass caught and fixed a real
path bug in `config.php` (it required `api/env.php` via a path that only
worked in the repo's source layout, not the merged deployed one).

Not verified locally (needs Day 2 real deploy — real browser, real
lima-city account, real GA4 property):
- The cookie banner and Consent Mode wiring in an actual browser.
- The `.htaccess` rewrite/canonical-URL rules **and** its new `.env`/
  `.sql` deny rule against a real Apache vhost — PHP's built-in dev
  server ignores `.htaccess` entirely, so `curl`ing `/.env` locally
  returns 200 regardless of the deny rule; that rule is unexercised
  until a real Apache server is in front of this.
- Whether lima-city's PHP setup supports real process-level env vars, or
  needs `api/env.php`'s `.env`-file fallback (both are wired and locally
  tested, but which one actually applies on lima-city is unconfirmed).
- Whether lima-city's SSH shell has a `mysql` client available, needed
  by `deploy/apply-schema.sh`.
- GA4 `page_view`/`generate_lead` events actually reaching a real GA4
  property — no property exists yet; `analytics.js` deliberately skips
  loading `gtag.js` at all while `GA_MEASUREMENT_ID` is unset, rather
  than pointing at a placeholder ID.

See `deploy/README.md` for the full Day 2 runbook and its verification
checklist.
