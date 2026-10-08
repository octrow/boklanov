#!/usr/bin/env bash
# Nightly prod DB backup: pg_dump → gpg (AES256) → R2 `_backups/db/`, keeping
# RETENTION_DAYS. Run by .github/workflows/backup-db.yml.
#
# The repo is public and the content bucket is publicly readable, so the dump
# (admin emails, password hashes) only ever leaves the runner encrypted.
#
# Env: DATABASE_URL, BACKUP_PASSPHRASE, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
#      R2_SECRET_ACCESS_KEY, R2_BUCKET (default boklanov-content)
#
# Restore:
#   aws s3 cp s3://boklanov-content/_backups/db/<date>.dump.gpg . \
#     --endpoint-url https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
#   gpg -d <date>.dump.gpg > db.dump      # asks for BACKUP_PASSPHRASE
#   pg_restore --clean --if-exists --no-owner -d "$TARGET_URL" db.dump
set -euo pipefail

: "${DATABASE_URL:?}" "${BACKUP_PASSPHRASE:?}" "${R2_ACCOUNT_ID:?}"
: "${R2_ACCESS_KEY_ID:?}" "${R2_SECRET_ACCESS_KEY:?}"
BUCKET="${R2_BUCKET:-boklanov-content}"
PREFIX="_backups/db"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
# Neon runs Postgres 17; pg_dump must be at least the server's major version.
PG_IMAGE="postgres:17-alpine"

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION=auto
s3() { aws s3 --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" "$@"; }

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
NAME="$(date -u +%F).dump.gpg"

docker run --rm --network host -e DATABASE_URL -v "$WORK:/b" "$PG_IMAGE" \
  sh -c 'pg_dump -Fc "$DATABASE_URL" -f /b/db.dump'
# An empty or truncated dump must fail the job, not overwrite a good backup.
docker run --rm -v "$WORK:/b" "$PG_IMAGE" pg_restore --list /b/db.dump >/dev/null

printf '%s' "$BACKUP_PASSPHRASE" | gpg --batch --yes --pinentry-mode loopback \
  --passphrase-fd 0 --symmetric --cipher-algo AES256 \
  -o "$WORK/$NAME" "$WORK/db.dump"

s3 cp --only-show-errors "$WORK/$NAME" "s3://$BUCKET/$PREFIX/$NAME"
echo "uploaded $PREFIX/$NAME ($(du -h "$WORK/$NAME" | cut -f1))"

CUTOFF=$(date -u -d "-$RETENTION_DAYS days" +%F)
s3 ls "s3://$BUCKET/$PREFIX/" | awk '{print $4}' | while read -r key; do
  # Keys are <YYYY-MM-DD>.dump.gpg, so string order is date order.
  if [[ "$key" < "$CUTOFF" ]]; then
    s3 rm --only-show-errors "s3://$BUCKET/$PREFIX/$key"
    echo "pruned $key"
  fi
done
