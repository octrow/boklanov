#!/usr/bin/env bash
# Lighthouse single-pass on Payload admin URLs, authenticated via session cookie.
# Single run per URL (admin pages are not user-facing; median-of-N is overkill).
# Mobile only would be misleading on admin — running desktop preset for accurate
# bundle/long-tasks reads.

set -u
# Lighthouse@latest requires Node 20+.
node -e 'process.exit(process.versions.node.split(".")[0] < 20 ? 1 : 0)' \
  || { echo "Node 20+ required (got $(node -v 2>/dev/null))" >&2; exit 1; }

# Production by default. For a preview deploy (Vercel Authentication is on),
# set LH_BASE=<preview url> and VERCEL_AUTOMATION_BYPASS_SECRET (the
# `lighthouse-audits` secret, Settings → Deployment Protection).
BASE="${LH_BASE:-https://boklanov.com}"
BYPASS="${VERCEL_AUTOMATION_BYPASS_SECRET:-}"
TOKEN="${PAYLOAD_TOKEN:?PAYLOAD_TOKEN env var required}"
STAMP="${LH_STAMP:-$(date +%d%m%Y_%H%M)}"
OUT=".design/boklanov-rewrite/archive"
mkdir -p "$OUT"
LOG="$OUT/lh_admin_${STAMP}.log"
echo "stamp=$STAMP base=$BASE" | tee "$LOG"

# label=path (paths preserved verbatim incl. query strings)
URLS=(
  "admin_root=/admin"
  "admin_productions_list=/admin/collections/productions?depth=1&limit=100"
  "admin_production_detail=/admin/collections/productions/5"
  "admin_global_about=/admin/globals/about"
)

# Cookie always; bypass header only when targeting a protected preview.
CURL_H=(-b "payload-token=$TOKEN")
LH_HEADERS='{"Cookie":"payload-token='"$TOKEN"'"'
if [ -n "$BYPASS" ]; then
  CURL_H+=(-H "x-vercel-protection-bypass: $BYPASS")
  LH_HEADERS+=',"x-vercel-protection-bypass":"'"$BYPASS"'"'
fi
LH_HEADERS+='}'

# Warm-up to dodge cold-start
curl -s -o /dev/null "${CURL_H[@]}" "$BASE/admin"
curl -s -o /dev/null "${CURL_H[@]}" "$BASE/admin"

# Light parallel pinger on /admin (single instance keep-warm trick)
( while :; do curl -s -o /dev/null "${CURL_H[@]}" "$BASE/admin"; sleep 4; done ) &
PING_PID=$!
trap 'kill "$PING_PID" 2>/dev/null || true' EXIT

for u in "${URLS[@]}"; do
  label="${u%%=*}"; path="${u##*=}"
  target="$BASE$path"
  out="$OUT/lh_admin_${STAMP}_${label}_desktop"
  ts=$(date +%H:%M:%S)
  echo "[$ts] $label -> $out" | tee -a "$LOG"
  npx -y lighthouse@latest "$target" \
    --extra-headers="$LH_HEADERS" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox --disable-extensions" \
    --preset=desktop \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json \
    --output-path="$out" >>"$LOG" 2>&1 \
    || echo "FAILED: $label" | tee -a "$LOG"
done

echo "done" | tee -a "$LOG"
kill "$PING_PID" 2>/dev/null || true
