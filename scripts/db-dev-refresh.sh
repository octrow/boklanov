#!/usr/bin/env bash
# Refresh the local dev DB (docker compose `db`) from production Neon.
# Reads prod only (pg_dump); the dump is kept in ~/backups/boklanov as a backup.
# pg_dump must match the server major (17), hence the docker image.
set -euo pipefail
cd "$(dirname "$0")/.."

src="${NEON_DATABASE_URL_UNPOOLED:-$(grep -m1 '^NEON_DATABASE_URL_UNPOOLED=' .env | cut -d= -f2- | tr -d "\"'")}"
[ -n "$src" ] || { echo "NEON_DATABASE_URL_UNPOOLED is not set (.env)" >&2; exit 1; }

dir="$HOME/backups/boklanov"
file="neon-$(date +%F-%H%M)-dev-refresh.dump"
mkdir -p "$dir"
docker compose up -d --wait db

docker run --rm --network host -e SRC="$src" -v "$dir:/backup" postgres:17-alpine sh -c "
  pg_dump -Fc --no-owner --no-privileges -f /backup/$file \"\$SRC\" &&
  pg_restore --clean --if-exists --no-owner --no-privileges \
    -d postgresql://postgres:dev@localhost:5433/boklanov /backup/$file"
echo "local db refreshed from $dir/$file"
