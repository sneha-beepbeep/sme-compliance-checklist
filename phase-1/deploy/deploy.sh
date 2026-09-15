#!/usr/bin/env bash
#
# Deploy Phase 1's application code (public/ + api/) to managed hosting
# via rsync over SSH — Phase 1's own copy of Phase 0's deploy.sh (/plan
# Section 1: new copies under phase-1/deploy/, not shared scripts, so
# Phase 0 and Phase 1 stay independently deployable/rollback-able from
# each other).
#
# Per the approved /plan (reused here): this class of managed hosting
# deploys via plain git/SSH, not by running phase-1/Dockerfile's
# container — that image is local-dev-parity and future-self-hosted-
# migration tooling only. rsync over SSH is the concrete mechanism, same
# reasoning as Phase 0's deploy.sh.
#
# This script does NOT:
#   - touch .env on the server (see push-env.sh),
#   - apply db/schema.sql (see apply-schema.sh),
#   - run automatically. It must be invoked by a human, with real
#     hosting SSH details.
#
# NOT YET RUN for real. Phase 1's canonical subdomain is not yet decided
# (/plan Open Question 2 / /build default #2), so there is no real
# DEPLOY_PATH to target yet even though the same lima-city account used
# by Phase 0 is expected to host this too.
#
# Usage:
#   DEPLOY_HOST=example.lima-city.de \
#   DEPLOY_USER=your-account-user \
#   DEPLOY_PATH=/path/to/document-root \
#   [DEPLOY_SSH_PORT=22] \
#   [DEPLOY_SSH_KEY=~/.ssh/id_ed25519] \
#   [DRY_RUN=1] \
#     ./deploy.sh
#
# DEPLOY_PATH is the remote document root that Phase 1's real subdomain
# will resolve to — i.e. where public/ and api/'s contents should both
# end up merged together at the top level.

set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST (e.g. example.lima-city.de)}"
: "${DEPLOY_USER:?Set DEPLOY_USER}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH (remote document root for Phase 1s subdomain)}"

DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHASE1_DIR="$(dirname "$SCRIPT_DIR")"

SSH_OPTS=(-p "$DEPLOY_SSH_PORT")
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$DEPLOY_SSH_KEY")
fi

RSYNC_FLAGS=(-avz --delete-after)
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  RSYNC_FLAGS+=(--dry-run)
  echo "== DRY RUN (no files will actually be transferred) =="
fi

echo "Deploying phase-1 to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

# --exclude ".env" and --exclude "api" carry forward the exact lesson
# Phase 0 learned the hard way in production on 2026-09-09: with
# --delete-after, rsync deletes anything present at the destination root
# that isn't present in the source (public/). .env lives directly at the
# document root (pushed separately by push-env.sh) and is NOT part of
# public/, so without this exclude, every ordinary code deploy would
# silently wipe production secrets and 500 the contact endpoint until
# push-env.sh was re-run. Applied here from Day 1 rather than
# rediscovered on a real Phase 1 incident.
rsync "${RSYNC_FLAGS[@]}" \
  --exclude ".DS_Store" \
  --exclude ".env" \
  --exclude "api" \
  -e "ssh ${SSH_OPTS[*]}" \
  "${PHASE1_DIR}/public/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

# api/ goes to an api/ subdirectory of the same document root, matching
# the local Docker layout (see Dockerfile) and the absolute /api/... path
# the frontend calls (see public/assets/checklist.js's CONTACT_API_URL).
rsync "${RSYNC_FLAGS[@]}" \
  --exclude ".DS_Store" \
  -e "ssh ${SSH_OPTS[*]}" \
  "${PHASE1_DIR}/api/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/api/"

echo
echo "Code sync complete. Remember:"
echo "  1. .env is NOT touched by this script — see push-env.sh for that,"
echo "     and confirm public/.htaccess's deny rule actually blocks"
echo "     direct requests to it before trusting that separation."
echo "  2. db/schema.sql is NOT applied by this script — see"
echo "     apply-schema.sh, and only run it deliberately."
echo "  3. Verify the canonical URL, cookie banner/consent flow, the"
echo "     full wizard, and the contact form's mail() notification in a"
echo "     real browser against the real domain after this — none of"
echo "     that is verified by this script."
