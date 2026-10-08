#!/usr/bin/env bash
# Prod run: fill the empty About sections — timeline (14), lineage (3),
# margin notes (4) in RU/EN/DE — from scripts/data/about-2026-10-09.json
# (sources listed in its "_sources"). Only empty sections are written.
# From the repo root:
#   echo y | bash ops/2026-10-09-fill-about.sh
set -euo pipefail

env_val() {
  node -e "require('dotenv').config({quiet:true});process.stdout.write(process.env[process.argv[1]]||'')" "$1"
}
PROD_URL=$(env_val NEON_DATABASE_URL_UNPOOLED)
SECRET=$(env_val REVALIDATE_SECRET)
[[ $PROD_URL == *neon.tech* ]] || { echo "NEON_DATABASE_URL_UNPOOLED missing in .env"; exit 1; }
[[ -n $SECRET ]] || { echo "REVALIDATE_SECRET missing in .env"; exit 1; }
PATCH=scripts/data/about-2026-10-09.json
run() { ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx "$@"; }

echo "== 1. backup"
DUMP="neon-prod-$(date +%F-%H%M)-pre-fill-about.dump"
mkdir -p ~/backups/boklanov
docker run --rm --network host -v ~/backups/boklanov:/b postgres:17-alpine \
  pg_dump -Fc "$PROD_URL" -f "/b/$DUMP"
ls -lh ~/backups/boklanov/"$DUMP"

echo "== 2. dry run (expect: milestones 14, lineage 3, marginalia 4; no 'kept')"
run scripts/fill-about.ts "$PATCH" | grep -E '^■|kept|dry run'

read -r -p "Write to prod? [y/N] " ok
[[ $ok == y ]] || { echo "stopped, nothing written"; exit 0; }

echo "== 3. apply"
run scripts/fill-about.ts "$PATCH" --apply | tail -1

echo "== 4. check (expect: three 'kept', 0 sections)"
run scripts/fill-about.ts "$PATCH" | grep -E 'kept|section'

echo "== 5. revalidate"
curl -s -X POST https://boklanov.com/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$SECRET\",\"tags\":[\"about\"]}"
echo
