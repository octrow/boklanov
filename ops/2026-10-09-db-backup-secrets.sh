#!/usr/bin/env bash
# One-time: GitHub secrets for .github/workflows/backup-db.yml.
#   - NEON_DATABASE_URL_UNPOOLED from .env (pg_dump needs the direct host)
#   - BACKUP_PASSPHRASE, freshly generated
# The passphrase is the only key to the backups. It is saved to
# ~/backups/boklanov/BACKUP_PASSPHRASE.txt (0600); copy it into your
# password manager too. Re-running reuses that file; delete it to rotate
# (older backups keep needing the old passphrase).
# From the repo root:
#   bash ops/2026-10-09-db-backup-secrets.sh
set -euo pipefail

env_val() {
  node -e "require('dotenv').config({quiet:true});process.stdout.write(process.env[process.argv[1]]||'')" "$1"
}
PROD_URL=$(env_val NEON_DATABASE_URL_UNPOOLED)
[ -n "$PROD_URL" ] || { echo "NEON_DATABASE_URL_UNPOOLED missing in .env" >&2; exit 1; }

PASS_FILE=~/backups/boklanov/BACKUP_PASSPHRASE.txt
mkdir -p "$(dirname "$PASS_FILE")"
if [ -s "$PASS_FILE" ]; then
  echo "reusing existing $PASS_FILE"
else
  (umask 077; openssl rand -base64 32 | tr -d '\n' > "$PASS_FILE")
fi

printf '%s' "$PROD_URL" | gh secret set NEON_DATABASE_URL_UNPOOLED
tr -d '\n' < "$PASS_FILE" | gh secret set BACKUP_PASSPHRASE
gh secret list | grep -E 'NEON_DATABASE_URL_UNPOOLED|BACKUP_PASSPHRASE'
echo "passphrase: $PASS_FILE — save it to your password manager"
