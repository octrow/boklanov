#!/usr/bin/env bash
# Prod, read-only: productions whose synopsis is longer than 300 characters
# (review №3, п. 2). Those texts belong in the body; move them in the admin.
# From the repo root:
#   bash ops/2026-10-09-long-synopses.sh
set -euo pipefail

env_val() {
  node -e "require('dotenv').config({quiet:true});process.stdout.write(process.env[process.argv[1]]||'')" "$1"
}
PROD_URL=$(env_val NEON_DATABASE_URL_UNPOOLED)
[[ $PROD_URL == *neon.tech* ]] || { echo "NEON_DATABASE_URL_UNPOOLED missing in .env"; exit 1; }

docker run --rm --network host postgres:17-alpine psql "$PROD_URL" -v ON_ERROR_STOP=1 -c "
  SELECT p.id, p.slug, l._locale AS lang, length(s.txt) AS chars
  FROM productions_locales l
  JOIN productions p ON p.id = l._parent_id
  CROSS JOIN LATERAL (
    SELECT coalesce(string_agg(t #>> '{}', ''), '') AS txt
    FROM jsonb_path_query(l.identity_synopsis, 'strict \$.**.text') t
  ) s
  WHERE length(s.txt) > 300
  ORDER BY chars DESC;"
