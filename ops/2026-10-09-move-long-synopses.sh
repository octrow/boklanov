#!/usr/bin/env bash
# Prod run: synopses over 300 chars (review №3, п. 2). 59 synopses in 22
# productions keep their first sentences (≤300 chars, no cut inside a
# quote); the full text moves to the body when the body is empty (46), goes
# before the existing body when that only holds Roman's participation note
# (uber-den-zaun, no-winer-way: 6), and is only trimmed when the body
# already tells the same (7). Data: scripts/data/content-fill-2026-10-09-synopses.json
# From the repo root:
#   echo y | bash ops/2026-10-09-move-long-synopses.sh
set -euo pipefail

env_val() {
  node -e "require('dotenv').config({quiet:true});process.stdout.write(process.env[process.argv[1]]||'')" "$1"
}
PROD_URL=$(env_val NEON_DATABASE_URL_UNPOOLED)
SECRET=$(env_val REVALIDATE_SECRET)
[[ $PROD_URL == *neon.tech* ]] || { echo "NEON_DATABASE_URL_UNPOOLED missing in .env"; exit 1; }
[[ -n $SECRET ]] || { echo "REVALIDATE_SECRET missing in .env"; exit 1; }
PATCH=scripts/data/content-fill-2026-10-09-synopses.json
run() { ALLOW_PROD_DB=1 DATABASE_URL="$PROD_URL" npx tsx "$@"; }

echo "== 1. backup"
DUMP="neon-prod-$(date +%F-%H%M)-pre-move-synopses.dump"
mkdir -p ~/backups/boklanov
docker run --rm --network host -v ~/backups/boklanov:/b postgres:17-alpine \
  pg_dump -Fc "$PROD_URL" -f "/b/$DUMP"
ls -lh ~/backups/boklanov/"$DUMP"

echo "== 2. dry run (expect: 111 changes, no '!')"
run scripts/fill-content.ts "$PATCH" | grep -E '^  !|change\(s\)'

read -r -p "Write to prod? [y/N] " ok
[[ $ok == y ]] || { echo "stopped, nothing written"; exit 0; }

echo "== 3. apply"
run scripts/fill-content.ts "$PATCH" --apply | tail -1

echo "== 4. check (expect: 0 changes; long-synopses lists nothing)"
run scripts/fill-content.ts "$PATCH" | tail -1
bash ops/2026-10-09-long-synopses.sh

echo "== 5. revalidate"
curl -s -X POST https://boklanov.com/api/revalidate -H 'content-type: application/json' \
  -d "{\"secret\":\"$SECRET\",\"tags\":[\"productions\"]}"
echo
