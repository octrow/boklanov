#!/usr/bin/env bash
# Prod run: upload the 68 gallery photos missing in R2 from the local Notion
# export (scripts/restore-gallery-from-notion.ts). Run from the repo root:
#   bash ops/2026-10-06-restore-gallery-from-notion.sh
# Reads prod DB (read-only), writes only new keys to R2 (never overwrites).
# Stops before writing and asks for confirmation.
set -euo pipefail

# Read .env with dotenv, not `source`: unquoted `&` in URLs breaks the shell.
env_val() {
  node -e "require('dotenv').config({quiet:true});process.stdout.write(process.env[process.argv[1]]||'')" "$1"
}
PROD_URL=$(env_val NEON_DATABASE_URL_UNPOOLED)
SECRET=$(env_val REVALIDATE_SECRET)
[[ $PROD_URL == *neon.tech* ]] || { echo "NEON_DATABASE_URL_UNPOOLED missing in .env"; exit 1; }
[[ -n $SECRET ]] || { echo "REVALIDATE_SECRET missing in .env"; exit 1; }
[[ -d notion-data ]] || { echo "notion-data/ missing"; exit 1; }

echo "== 1. dry run (expect ~68 '+' lines, no '!')"
ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx scripts/restore-gallery-from-notion.ts > /tmp/restore-dry.txt
echo "uploads: $(grep -c '^  +' /tmp/restore-dry.txt || true)  not found (!): $(grep -c '^  !' /tmp/restore-dry.txt || true)"
grep '^  !' /tmp/restore-dry.txt || true
tail -1 /tmp/restore-dry.txt

read -r -p "Upload to R2? [y/N] " ok
[[ $ok == y ]] || { echo "stopped, nothing written"; exit 0; }

echo "== 2. apply"
ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx scripts/restore-gallery-from-notion.ts --apply | grep -E 'failed|uploaded' || true

echo "== 3. revalidate"
curl -s -X POST https://boklanov.com/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$SECRET\",\"tags\":[\"productions\"]}"
echo
