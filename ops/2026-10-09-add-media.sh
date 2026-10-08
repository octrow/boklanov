#!/usr/bin/env bash
# Prod run: posters, gallery photos and videos for 16 productions
# (scripts/add-media.ts with scripts/data/media-2026-10-09.json: images to R2
# with AVIF variants, only where the production has none yet), then the
# content patch additions (credits, synopses, age, duration, theatre links).
# From the repo root:
#   echo y | bash ops/2026-10-09-add-media.sh
set -euo pipefail

env_val() {
  node -e "require('dotenv').config({quiet:true});process.stdout.write(process.env[process.argv[1]]||'')" "$1"
}
PROD_URL=$(env_val NEON_DATABASE_URL_UNPOOLED)
SECRET=$(env_val REVALIDATE_SECRET)
[[ $PROD_URL == *neon.tech* ]] || { echo "NEON_DATABASE_URL_UNPOOLED missing in .env"; exit 1; }
[[ -n $SECRET ]] || { echo "REVALIDATE_SECRET missing in .env"; exit 1; }
PATCH=scripts/data/content-fill-2026-10-08.json
MEDIA=scripts/data/media-2026-10-09.json
run() { ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx "$@"; }

echo "== 1. backup"
DUMP="neon-prod-$(date +%F-%H%M)-pre-add-media.dump"
mkdir -p ~/backups/boklanov
docker run --rm --network host -v ~/backups/boklanov:/b postgres:17-alpine \
  pg_dump -Fc "$PROD_URL" -f "/b/$DUMP"
ls -lh ~/backups/boklanov/"$DUMP"

echo "== 2. dry run (expect: 16 productions, no 'kept'/'!'; ~40 content changes)"
run scripts/add-media.ts "$MEDIA" | grep -E '^■|kept|!|write'
run scripts/fill-content.ts "$PATCH" | grep -E '^  !|change\(s\)'

read -r -p "Write to prod and R2? [y/N] " ok
[[ $ok == y ]] || { echo "stopped, nothing written"; exit 0; }

echo "== 3. apply"
run scripts/add-media.ts "$MEDIA" --apply | tail -1
run scripts/fill-content.ts "$PATCH" --apply | tail -1

echo "== 4. check (expect: nothing to add, 0 changes)"
run scripts/add-media.ts "$MEDIA" | grep -cE 'nothing to add' || true
run scripts/fill-content.ts "$PATCH" | tail -1

echo "== 5. revalidate"
curl -s -X POST https://boklanov.com/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$SECRET\",\"tags\":[\"productions\"]}"
echo
