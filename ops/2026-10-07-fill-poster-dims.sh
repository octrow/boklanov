#!/usr/bin/env bash
# Prod run: store poster width/height for every production
# (scripts/fill-poster-dims.ts). Run after the deploy that adds the
# media_poster_width/height columns (vercel-build applies the migration).
# From the repo root:
#   bash ops/2026-10-07-fill-poster-dims.sh
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
[[ -n $(env_val NEXT_PUBLIC_CDN_BASE) ]] || { echo "NEXT_PUBLIC_CDN_BASE missing in .env"; exit 1; }

echo "== 1. backup"
DUMP="neon-prod-$(date +%F-%H%M)-pre-poster-dims.dump"
mkdir -p ~/backups/boklanov
docker run --rm --network host -v ~/backups/boklanov:/b postgres:17-alpine \
  pg_dump -Fc "$PROD_URL" -f "/b/$DUMP"
ls -lh ~/backups/boklanov/"$DUMP"

echo "== 2. dry run (expect ~42 '+' lines, no '!')"
ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx scripts/fill-poster-dims.ts > /tmp/poster-dims-dry.txt
grep '^  !' /tmp/poster-dims-dry.txt || true
tail -1 /tmp/poster-dims-dry.txt

read -r -p "Write to prod? [y/N] " ok
[[ $ok == y ]] || { echo "stopped, nothing written"; exit 0; }

echo "== 3. apply"
ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx scripts/fill-poster-dims.ts --apply | tail -1

echo "== 4. revalidate"
curl -s -X POST https://boklanov.com/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$SECRET\",\"tags\":[\"productions\"]}"
echo
