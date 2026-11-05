#!/usr/bin/env bash
# docs/logic-map.md names real modules: a rename that forgets the map fails here.
# Module paths start at the repo root, without extension (a directory also counts).
set -euo pipefail
cd "$(dirname "$0")/.."
MAP="${MAP:-docs/logic-map.md}"
refs=$(grep '^Module:' "$MAP" | grep -o '`[^`]*`' | tr -d '`' || true)
[ -n "$refs" ] || { echo "no Module: lines in $MAP"; exit 1; }
missing=0
for ref in $refs; do
  found=0
  [ -d "$ref" ] && found=1
  for ext in ts tsx mts mjs js sh; do
    [ -f "$ref.$ext" ] && found=1
  done
  if [ "$found" -eq 0 ]; then echo "missing module: $ref"; missing=1; fi
done
exit $missing
