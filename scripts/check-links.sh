#!/usr/bin/env bash
# Dead-link check for the live site: every sitemap page must answer 200, and
# every external link on those pages must not be gone (404/410/5xx or no
# answer, twice, 5 minutes apart — one slow theatre site is not a dead link).
# 429/403 count as alive: rate limits and bot walls, not removed pages.
# Prints one "<code> <url>" per dead link; exit 1 when there are any.
# Run by .github/workflows/check-links.yml; fix flow: scripts/fix-dead-links.ts.
#   bash scripts/check-links.sh [base-url]
set -uo pipefail

BASE="${1:-https://boklanov.com}"
RECHECK_DELAY="${RECHECK_DELAY:-300}"
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
# Social networks answer scripted requests with 400/login walls.
SKIP='facebook\.com|instagram\.com|vk\.com|t\.me'
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

status() {
  printf '%s %s\n' "$(curl -s -o /dev/null -L --max-time 30 -A "$UA" -w '%{http_code}' "$1")" "$1"
}
export -f status
export UA

curl -sf "$BASE/sitemap.xml" | grep -o '<loc>[^<]*' | sed 's/<loc>//' > "$WORK/pages"
[ -s "$WORK/pages" ] || { echo "000 $BASE/sitemap.xml"; exit 1; }

# Own pages: anything but 200 is a finding.
# One file per page (name = hash of the URL), so parallel fetches don't clash.
# shellcheck disable=SC2016 # expanded by the inner bash
xargs -P 8 -I{} bash -c 'curl -s -o "$2/p_$(printf %s "$1" | md5sum | cut -c1-12)" \
  -w "%{http_code} $1\n" "$1"' _ {} "$WORK" < "$WORK/pages" \
  | grep -v '^200 ' > "$WORK/dead-pages"
cat "$WORK"/p_* | grep -oE 'href="https?://[^"]+"' | sed 's/^href="//;s/"$//' \
  | grep -vE "${BASE#https://}|r2\.dev|web\.archive\.org|$SKIP" | sort -u > "$WORK/links"

dead() { grep -E '^(000|404|410|5[0-9][0-9]) '; }
# shellcheck disable=SC2016
xargs -P 6 -I{} bash -c 'status "$1"' _ {} < "$WORK/links" | dead | cut -d' ' -f2 > "$WORK/suspect"
if [ -s "$WORK/suspect" ]; then
  sleep "$RECHECK_DELAY"
  while read -r u; do status "$u"; sleep 2; done < "$WORK/suspect" | dead > "$WORK/dead-links"
fi

cat "$WORK/dead-pages" "$WORK/dead-links" 2>/dev/null | sort -u > "$WORK/report"
cat "$WORK/report"
[ ! -s "$WORK/report" ]
