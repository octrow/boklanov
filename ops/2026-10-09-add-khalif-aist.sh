#!/usr/bin/env bash
# Prod run: create «Халиф-аист» (scripts/add-production.ts with
# scripts/data/khalif-aist.json) — poster from afisha.uz to R2 with AVIF
# variants, then the production in ru/en/de — and apply what was added to
# the content patch since the last run (Total Fest III Austria, About
# countries).
# From the repo root:
#   bash ops/2026-10-09-add-khalif-aist.sh
# Stops before writing and asks for confirmation.
set -euo pipefail

env_val() {
  node -e "require('dotenv').config({quiet:true});process.stdout.write(process.env[process.argv[1]]||'')" "$1"
}
PROD_URL=$(env_val NEON_DATABASE_URL_UNPOOLED)
SECRET=$(env_val REVALIDATE_SECRET)
[[ $PROD_URL == *neon.tech* ]] || { echo "NEON_DATABASE_URL_UNPOOLED missing in .env"; exit 1; }
[[ -n $SECRET ]] || { echo "REVALIDATE_SECRET missing in .env"; exit 1; }
PATCH=scripts/data/content-fill-2026-10-08.json
run() { ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx "$@"; }

echo "== 1. backup"
DUMP="neon-prod-$(date +%F-%H%M)-pre-khalif-aist.dump"
mkdir -p ~/backups/boklanov
docker run --rm --network host -v ~/backups/boklanov:/b postgres:17-alpine \
  pg_dump -Fc "$PROD_URL" -f "/b/$DUMP"
ls -lh ~/backups/boklanov/"$DUMP"

echo "== 2. dry run (expect: poster 1200×1697, create khalif-aist; ~6 content changes, no '!')"
run scripts/add-production.ts scripts/data/khalif-aist.json
run scripts/fill-content.ts "$PATCH" | grep -E '^  !|change\(s\)'

read -r -p "Write to prod and R2? [y/N] " ok
[[ $ok == y ]] || { echo "stopped, nothing written"; exit 0; }

echo "== 3. apply"
run scripts/add-production.ts scripts/data/khalif-aist.json --apply
run scripts/fill-content.ts "$PATCH" --apply | tail -1

echo "== 4. revalidate"
curl -s -X POST https://boklanov.com/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$SECRET\",\"tags\":[\"productions\",\"about\"]}"
echo
