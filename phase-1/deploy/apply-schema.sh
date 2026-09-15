#!/usr/bin/env bash
#
# Apply db/schema.sql to the remote MySQL/MariaDB database over SSH, by
# piping it into the mysql client running ON the server — Phase 1's own
# copy of Phase 0's apply-schema.sh (/plan Section 1).
#
# Deliberately a separate, manually-run step from deploy.sh: schema
# changes should be reviewed and run on purpose, not on every code push.
# Idempotent by construction — schema.sql uses `CREATE TABLE IF NOT
# EXISTS`, so re-running this against an already-provisioned DB is safe.
#
# NOT YET RUN for real — Phase 1's real subdomain/deploy target doesn't
# exist yet (see deploy.sh's header comment).
#
# Usage:
#   DEPLOY_HOST=example.lima-city.de \
#   DEPLOY_USER=your-account-user \
#   [DEPLOY_SSH_PORT=22] \
#   [DEPLOY_SSH_KEY=~/.ssh/id_ed25519] \
#   REMOTE_DB_HOST=localhost \
#   REMOTE_DB_NAME=... \
#   REMOTE_DB_USER=... \
#   REMOTE_DB_PASSWORD=... \
#     ./apply-schema.sh
#
# REMOTE_DB_* should match whatever DB_* values are set in the server's
# .env (see push-env.sh) — this script does not read that file for you,
# on purpose, so it's obvious exactly which credentials are being used
# for a schema change.

set -euo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST}"
: "${DEPLOY_USER:?Set DEPLOY_USER}"
: "${REMOTE_DB_HOST:?Set REMOTE_DB_HOST, often localhost from the servers own perspective}"
: "${REMOTE_DB_NAME:?Set REMOTE_DB_NAME}"
: "${REMOTE_DB_USER:?Set REMOTE_DB_USER}"
: "${REMOTE_DB_PASSWORD:?Set REMOTE_DB_PASSWORD}"

DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PHASE1_DIR="$(dirname "$SCRIPT_DIR")"
SCHEMA_FILE="${PHASE1_DIR}/db/schema.sql"

SSH_OPTS=(-p "$DEPLOY_SSH_PORT")
if [[ -n "${DEPLOY_SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$DEPLOY_SSH_KEY")
fi

echo "Applying ${SCHEMA_FILE} to ${REMOTE_DB_NAME}@${REMOTE_DB_HOST} via ${DEPLOY_USER}@${DEPLOY_HOST}"

# Password passed via MYSQL_PWD in the remote command's environment
# rather than as a `mysql -p...` CLI arg, so it never appears in the
# remote shell's process list (`ps`) or its command history — same
# approach as Phase 0's apply-schema.sh. Each value is shell-escaped
# independently with printf %q before being assembled into the single
# remote command string ssh expects.
q_pwd="$(printf '%q' "$REMOTE_DB_PASSWORD")"
q_host="$(printf '%q' "$REMOTE_DB_HOST")"
q_user="$(printf '%q' "$REMOTE_DB_USER")"
q_name="$(printf '%q' "$REMOTE_DB_NAME")"
remote_cmd="MYSQL_PWD=${q_pwd} mysql -h ${q_host} -u ${q_user} ${q_name}"

ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "$remote_cmd" < "$SCHEMA_FILE"

echo "Schema applied (or already up to date — CREATE TABLE IF NOT EXISTS is idempotent)."
