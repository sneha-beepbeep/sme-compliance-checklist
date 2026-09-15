#!/usr/bin/env bash
#
# Push a local, filled-in .env file to the server as Phase 1's production
# config, over SSH (scp) — Phase 1's own copy of Phase 0's push-env.sh
# (/plan Section 1). Kept deliberately separate from deploy.sh so an
# ordinary code deploy can never accidentally overwrite production
# secrets.
#
# The file this pushes is never the repo's committed .env.example — it
# must be a real, filled-in file that itself is never committed (see the
# repo's top-level .gitignore). Real DB credentials, NOTIFY_EMAIL, and
# (once it exists) a real GA_MEASUREMENT_ID live only in this file.
#
# This lands the file at DEPLOY_PATH/.env — the document root's top
# level, matching api/env.php's default lookup. Relies on
# public/.htaccess's deny rule to keep it from being directly
# web-servable; NOT YET VERIFIED against a real vhost for Phase 1
# (same category of open item Phase 0 carried before its own real
# deploy).
#
# NOT YET RUN for real — Phase 1's real subdomain/deploy target doesn't
# exist yet (see deploy.sh's header comment).
#
# Usage:
#   DEPLOY_HOST=example.lima-city.de \
#   DEPLOY_USER=your-account-user \
#   DEPLOY_PATH=/path/to/document-root \
#   [DEPLOY_SSH_PORT=22] \
#   [DEPLOY_SSH_KEY=~/.ssh/id_ed25519] \
#     ./push-env.sh /path/to/your/local/filled-in/.env

set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST}"
: "${DEPLOY_USER:?Set DEPLOY_USER}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH}"

LOCAL_ENV_FILE="${1:?Usage: ./push-env.sh /path/to/your/local/filled-in/.env}"

if [[ ! -f "$LOCAL_ENV_FILE" ]]; then
  echo "No such file: $LOCAL_ENV_FILE" >&2
  exit 1
fi

DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
SCP_OPTS=(-P "$DEPLOY_SSH_PORT")
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SCP_OPTS+=(-i "$DEPLOY_SSH_KEY")
fi

echo "Pushing ${LOCAL_ENV_FILE} to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/.env"
scp "${SCP_OPTS[@]}" "$LOCAL_ENV_FILE" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/.env"

echo
echo "Done. Verify from outside the server that this file is NOT"
echo "web-accessible, e.g. (once a real domain exists):"
echo "  curl -I https://<phase-1-subdomain>/.env    # must be 403, never 200"
