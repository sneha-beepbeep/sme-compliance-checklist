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
  (JS/CSS), and `.htaccess` (canonical-URL rules).
- `api/` — `subscribe.php` (POST endpoint) and `db.php` (connection
  helper, config entirely via env vars).
- `db/schema.sql` — portable `CREATE TABLE` for the `signups` table,
  applied automatically to the local MariaDB container on first start.

In both local Docker and the intended production layout, `public/` and
`api/` are merged at the same web root (see `Dockerfile` and
`public/.htaccess`) — the frontend calls `/api/subscribe.php` as a
domain-root-absolute path, not a relative one. See the comment at the top
of `public/assets/form.js` for why.

## Canonical URL — deployment note (unresolved until Day 2)

The decided canonical URL is `https://gro-better.com/compliance` (no
`www`, no trailing slash). `public/.htaccess` implements the redirect/
rewrite rules for this, but they're written against assumptions about the
real lima-city vhost that can't be verified until credentials arrive:

1. `mod_rewrite` is enabled and `AllowOverride` permits `.htaccess` to
   take effect at all.
2. `gro-better.com`'s document root is dedicated to this app (nothing
   else needs to live at the domain root — `assets/` and `api/` are
   expected to be top-level paths).
3. lima-city's own control panel doesn't already inject a conflicting
   https/www redirect that loops against these rules.

Whoever does the Day 2 deploy needs to confirm all three against the real
account before trusting the "zero broken-link" quality bar
(`docs/design-spec.md` 1.1) against the live URL.

## What's verified locally vs. not

Verified against a local PHP + MariaDB stack: form validation (empty /
invalid / valid), successful insert, duplicate-email idempotency (same
success response, single row), and the server-error path. See the
engineer's `/build` report for the exact commands run.

Not verified locally (needs Day 2 / a real browser + real GA4 property):
the cookie banner and consent-mode wiring in an actual browser, the
`.htaccess` rewrite rules against a real Apache vhost, and the GA4
`page_view`/`generate_lead` events actually reaching a real GA4 property
(analytics.js currently points at a placeholder Measurement ID).
