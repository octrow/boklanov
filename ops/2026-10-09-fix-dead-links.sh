#!/usr/bin/env bash
# Prod run: dead external links (404 / dead domain on the 2026-10-09 check)
# swapped for their Wayback Machine snapshots — actor pages theatres removed
# and press articles that went offline. Only links with a snapshot that
# answers 200 are in the map; the rest stay as they are.
# Data: scripts/data/dead-links-2026-10-09.tsv
# From the repo root:
#   bash ops/2026-10-09-fix-dead-links.sh
set -euo pipefail

env_val() {
  node -e "require('dotenv').config({quiet:true});process.stdout.write(process.env[process.argv[1]]||'')" "$1"
}
PROD_URL=$(env_val NEON_DATABASE_URL_UNPOOLED)
SECRET=$(env_val REVALIDATE_SECRET)
[[ $PROD_URL == *neon.tech* ]] || { echo "NEON_DATABASE_URL_UNPOOLED missing in .env"; exit 1; }
[[ -n $SECRET ]] || { echo "REVALIDATE_SECRET missing in .env"; exit 1; }
MAP=scripts/data/dead-links-2026-10-09.tsv
run() { ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx "$@"; }

echo "== 1. backup"
DUMP="neon-prod-$(date +%F-%H%M)-pre-dead-links.dump"
mkdir -p ~/backups/boklanov
docker run --rm --network host -v ~/backups/boklanov:/b postgres:17-alpine \
  pg_dump -Fc "$PROD_URL" -f "/b/$DUMP"
ls -lh ~/backups/boklanov/"$DUMP"

echo "== 2. dry run (expect: no '! no match')"
run scripts/fix-dead-links.ts "$MAP"

read -r -p "Write to prod? [y/N] " ok
[[ $ok == y ]] || { echo "stopped, nothing written"; exit 0; }

echo "== 3. apply"
run scripts/fix-dead-links.ts "$MAP" --apply | tail -1

echo "== 4. check (expect: 0 changes)"
run scripts/fix-dead-links.ts "$MAP" | tail -1

echo "== 5. revalidate"
curl -s -X POST https://boklanov.com/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$SECRET\",\"tags\":[\"productions\"]}"
echo
