#!/usr/bin/env bash
#
# Push a local, filled-in .env file to the server as phase-0's production
# config, over SSH (scp) — kept deliberately separate from deploy.sh so
# an ordinary code deploy can never accidentally overwrite production
# secrets, and so this step can be reviewed/run less often.
#
# The file this pushes is never the repo's committed .env.example — it
# must be a real, filled-in file that itself is never committed (see the
# repo's top-level .gitignore). Real DB credentials and (once it exists)
# a real GA_MEASUREMENT_ID live only in this file, or in whatever
# server-local copy it produces.
#
# This lands the file at DEPLOY_PATH/.env — the document root's top
# level, matching api/env.php's default lookup (dirname(__DIR__)/.env
# resolves there in the deployed, merged public+api layout). Relies on
# public/.htaccess's deny rule to keep it from being directly
# web-servable; that rule is NOT YET VERIFIED against the real lima-city
# vhost (see phase-0/README.md and .htaccess's own comments) — confirm
# it returns 403 before treating this file as safe in place.
#
# NOT YET RUN for real — no lima-city credentials exist yet.
#
# Usage:
#   DEPLOY_HOST=example.lima-city.de \
#   DEPLOY_USER=your-lima-city-user \
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
echo "web-accessible, e.g.:"
echo "  curl -I https://compliance.gro-better.com/.env    # must be 403, never 200"
