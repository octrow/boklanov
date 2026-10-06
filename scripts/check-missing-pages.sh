#!/usr/bin/env bash
# Unknown URLs must return the site's 404, never 500 (openspec: missing-pages).
# Usage: scripts/check-missing-pages.sh [base-url]   (default https://boklanov.com)
set -u
BASE="${1:-https://boklanov.com}"
fail=0
check() {
  local want=$1 path=$2 got
  got=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")
  if [ "$got" = "$want" ]; then echo "ok   $got $path"; else echo "FAIL $got $path (want $want)"; fail=1; fi
}
check 404 /productions/does-not-exist
check 404 /de/productions/does-not-exist
check 404 /ru/productions/does-not-exist
check 404 /productions/VAIKENEMISEN-KIELIOPPI
check 404 /nope
check 200 /productions/vaikenemisen-kielioppi
exit $fail
