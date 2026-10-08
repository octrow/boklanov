#!/usr/bin/env bash
# Prod run: translation fixes + researched facts for productions
# (scripts/fill-content.ts with scripts/data/content-fill-2026-10-08.json):
# DE/EN award names and press titles, Latin names in EN/DE credits, rebuilt
# EN credits for holiday-recipe / typisch-bar, years, premiere dates,
# theatres, cities and RU/EN/DE synopses for ~30 productions.
# From the repo root:
#   bash ops/2026-10-08-fill-content.sh
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
PATCH=scripts/data/content-fill-2026-10-08.json

echo "== 1. backup"
DUMP="neon-prod-$(date +%F-%H%M)-pre-content-fill.dump"
mkdir -p ~/backups/boklanov
docker run --rm --network host -v ~/backups/boklanov:/b postgres:17-alpine \
  pg_dump -Fc "$PROD_URL" -f "/b/$DUMP"
ls -lh ~/backups/boklanov/"$DUMP"

echo "== 2. dry run (expect only the changes added since the last run; no '!' lines)"
ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx scripts/fill-content.ts "$PATCH" > /tmp/content-fill-dry.txt
grep '^  !' /tmp/content-fill-dry.txt || true
tail -1 /tmp/content-fill-dry.txt
echo "   full list: /tmp/content-fill-dry.txt"

read -r -p "Write to prod? [y/N] " ok
[[ $ok == y ]] || { echo "stopped, nothing written"; exit 0; }

echo "== 3. apply"
ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx scripts/fill-content.ts "$PATCH" --apply | tail -1

echo "== 4. check (expect 0 changes)"
ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx scripts/fill-content.ts "$PATCH" | tail -1

echo "== 5. revalidate"
curl -s -X POST https://boklanov.com/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$SECRET\",\"tags\":[\"productions\",\"about\"]}"
echo
