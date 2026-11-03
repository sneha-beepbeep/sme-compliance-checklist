#!/usr/bin/env bash
#
# Deploy the agency homepage (agency-site/public/) to its own directory on
# the lima-city webspace via rsync over SSH.
#
# DEPLOY_PATH must be a directory used ONLY by this site (e.g.
# ~/gro-better-home) — never the compliance site's docroot
# (default-website/). --delete-after removes anything in DEPLOY_PATH that
# isn't in public/, so pointing it at the wrong directory would delete
# the live compliance page. The guard below refuses that path outright.
#
# Usage:
#   DEPLOY_HOST=... DEPLOY_USER=... DEPLOY_PATH=gro-better-home \
#   [DEPLOY_SSH_KEY=~/.ssh/lima_city_gro_deploy] [DRY_RUN=1] ./deploy.sh

set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST}"
: "${DEPLOY_USER:?Set DEPLOY_USER}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH (a directory used only by this site)}"

case "${DEPLOY_PATH%/}" in
  ""|"."|"~"|*default-website*)
    echo "Refusing DEPLOY_PATH='${DEPLOY_PATH}': must be this site's own directory, not the compliance docroot or home." >&2
    exit 1 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSH_OPTS=(-p "${DEPLOY_SSH_PORT:-22}")
[[ -n "${DEPLOY_SSH_KEY:-}" ]] && SSH_OPTS+=(-i "$DEPLOY_SSH_KEY")

RSYNC_FLAGS=(-avz --delete-after)
[[ "${DRY_RUN:-0}" == "1" ]] && RSYNC_FLAGS+=(--dry-run) && echo "== DRY RUN =="

ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${DEPLOY_PATH}'"
rsync "${RSYNC_FLAGS[@]}" -e "ssh ${SSH_OPTS[*]}" \
  "$SCRIPT_DIR/public/" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH%/}/"

echo "Done. Now point gro-better.com at '${DEPLOY_PATH}' in lima-city:"
echo "  Webseite bearbeiten -> 'ein vorhandenes Verzeichnis auf dem Webspace auswählen'"
