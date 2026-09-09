#!/usr/bin/env bash
#
# Deploy phase-0's application code (public/ + api/) to lima-city-style
# managed hosting via rsync over SSH.
#
# Per the approved /plan: this kind of managed hosting deploys via plain
# git/SSH, not by running phase-0/Dockerfile's container — that image is
# local-dev-parity and future-self-hosted-migration tooling only. rsync
# over SSH is the concrete mechanism chosen here because it is:
#   - idempotent (safe to re-run; only changed files transfer),
#   - standard on virtually every shared/managed PHP host that offers SSH
#     at all (unlike a git post-receive hook, which most budget managed
#     hosts — lima-city's plan/tier is UNCONFIRMED here — do not run),
#   - parameterized purely by host/path/user, so pointing this at a
#     future self-hosted box is a config change, not a rewrite.
#
# This script does NOT:
#   - touch .env on the server (see push-env.sh — kept separate so an
#     ordinary code deploy can never accidentally clobber production
#     secrets),
#   - apply db/schema.sql (see apply-schema.sh — schema changes are
#     deliberate, reviewed steps, not bundled into every code push),
#   - run automatically. It must be invoked by a human, with real
#     lima-city SSH details, which do not exist yet as of this writing.
#
# NOT YET RUN for real. There is no lima-city account/credentials to
# target. This is deploy-ready plumbing, not a verified deploy.
#
# Usage:
#   DEPLOY_HOST=example.lima-city.de \
#   DEPLOY_USER=your-lima-city-user \
#   DEPLOY_PATH=/path/to/document-root \
#   [DEPLOY_SSH_PORT=22] \
#   [DEPLOY_SSH_KEY=~/.ssh/id_ed25519] \
#   [DRY_RUN=1] \
#     ./deploy.sh
#
# DEPLOY_PATH is the remote document root that
# https://compliance.gro-better.com/ resolves to — i.e. where public/ and
# api/'s contents should both end up merged together at the top level
# (see public/.htaccess and public/assets/form.js's comments on this
# assumption; confirm it still holds for the real lima-city account
# before the first real run). Updated 2026-09-09: this used to be
# gro-better.com/compliance (apex + path); the canonical URL moved to a
# dedicated subdomain's root.

set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST (e.g. example.lima-city.de)}"
: "${DEPLOY_USER:?Set DEPLOY_USER (lima-city SSH/account user)}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH (remote document root, e.g. /www/htdocs/xxxx/compliance.gro-better.com)}"

DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHASE0_DIR="$(dirname "$SCRIPT_DIR")"

SSH_OPTS=(-p "$DEPLOY_SSH_PORT")
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$DEPLOY_SSH_KEY")
fi

RSYNC_FLAGS=(-avz --delete-after)
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  RSYNC_FLAGS+=(--dry-run)
  echo "== DRY RUN (no files will actually be transferred) =="
fi

echo "Deploying phase-0 to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

# public/ contents go to the document root's top level (index.html,
# assets/, config.php, .htaccess — including dotfiles, hence the
# trailing slash on the source and --exclude list below rather than a
# glob, which would silently skip .htaccess).
#
# --exclude ".env" is load-bearing, not cosmetic: with --delete-after,
# rsync deletes anything present at the destination root that isn't
# present in the source (public/). .env lives directly at the document
# root (pushed separately by push-env.sh — see below) and is NOT part of
# public/, so without this exclude, every ordinary code deploy silently
# wipes production secrets — discovered the hard way on 2026-09-09, when
# a real re-run of this exact command deleted the live .env and broke
# api/subscribe.php (500s) until push-env.sh was re-run to restore it.
# --exclude "api" avoids the same --delete-after deleting and recreating
# the api/ directory on every run (harmless — it's fully repopulated by
# the second rsync below regardless — but pointless churn now that the
# root cause above is understood).
rsync "${RSYNC_FLAGS[@]}" \
  --exclude ".DS_Store" \
  --exclude ".env" \
  --exclude "api" \
  -e "ssh ${SSH_OPTS[*]}" \
  "${PHASE0_DIR}/public/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

# api/ goes to an api/ subdirectory of the same document root, matching
# the local Docker layout (see Dockerfile) and the absolute /api/... path
# the frontend calls (see public/assets/form.js).
rsync "${RSYNC_FLAGS[@]}" \
  --exclude ".DS_Store" \
  -e "ssh ${SSH_OPTS[*]}" \
  "${PHASE0_DIR}/api/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/api/"

echo
echo "Code sync complete. Remember:"
echo "  1. .env is NOT touched by this script — see push-env.sh for that,"
echo "     and confirm public/.htaccess's deny rule actually blocks"
echo "     direct requests to it before trusting that separation."
echo "  2. db/schema.sql is NOT applied by this script — see"
echo "     apply-schema.sh, and only run it deliberately."
echo "  3. Verify the canonical URL and cookie banner/consent flow in a"
echo "     real browser against the real domain after this — none of"
echo "     that is verified by this script."
