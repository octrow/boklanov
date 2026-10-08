#!/usr/bin/env bash
# Median-of-3 Lighthouse sweep across default-locale (English) routes on the
# production site (or LH_BASE), with a parallel keep-alive pinger to
# prevent Fluid Compute cold-starts from contaminating the median.
# See .design/boklanov-rewrite/LIGHTHOUSE_RUNBOOK.md §"When median-of-3 lies".

set -u  # don't -e: a single LH failure shouldn't abort the whole sweep
# Lighthouse@latest requires Node 20+.
node -e 'process.exit(process.versions.node.split(".")[0] < 20 ? 1 : 0)' \
  || { echo "Node 20+ required (got $(node -v 2>/dev/null))" >&2; exit 1; }

# Production by default. For a preview deploy (Vercel Authentication is on),
# set LH_BASE=<preview url> and VERCEL_AUTOMATION_BYPASS_SECRET (the
# `lighthouse-audits` secret, Settings → Deployment Protection).
BASE="${LH_BASE:-https://boklanov.com}"
BYPASS="${VERCEL_AUTOMATION_BYPASS_SECRET:-}"
STAMP="${LH_STAMP:-$(date +%d%m%Y_%H%M)}"
OUT=".design/boklanov-rewrite/archive"
mkdir -p "$OUT"
LOG="$OUT/lh_med3_${STAMP}_sweep.log"
echo "stamp=$STAMP base=$BASE" | tee "$LOG"

# Cells: <label>=<path>. Label is used in output filenames.
CELLS=(
  "root=/"
  "productions=/productions"
  "about=/about"
  "awards=/awards"
  "press=/press"
  "contact=/contact"
  "archive=/archive"
)

# Warm-up: two cold curls so the first audit isn't a guaranteed cold-start.
echo "warm-up …" | tee -a "$LOG"
CURL_H=(); LH_HEADERS=()
if [ -n "$BYPASS" ]; then
  CURL_H=(-H "x-vercel-protection-bypass: $BYPASS")
  LH_HEADERS=(--extra-headers="{\"x-vercel-protection-bypass\":\"$BYPASS\"}")
fi
curl -s -o /dev/null "${CURL_H[@]}" "$BASE/" && curl -s -o /dev/null "${CURL_H[@]}" "$BASE/"

# Background keep-alive pinger (single URL, per runbook).
( while :; do curl -s -o /dev/null "${CURL_H[@]}" "$BASE/"; sleep 4; done ) &
PING_PID=$!
trap 'kill "$PING_PID" 2>/dev/null || true' EXIT
echo "pinger pid=$PING_PID" | tee -a "$LOG"

# Form factor flags.
MOBILE_FLAGS=(
  --form-factor=mobile
  --screenEmulation.mobile=true
  --screenEmulation.width=412
  --screenEmulation.height=823
  --screenEmulation.deviceScaleFactor=1.75
  --throttling-method=simulate
)
DESKTOP_FLAGS=( --preset=desktop )

run_lh () {
  local target="$1" form="$2" outpath="$3"
  local flags=()
  if [ "$form" = "mobile" ]; then flags=("${MOBILE_FLAGS[@]}"); else flags=("${DESKTOP_FLAGS[@]}"); fi
  npx -y lighthouse@latest "$target" \
    "${LH_HEADERS[@]}" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox --disable-extensions" \
    "${flags[@]}" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json \
    --output-path="$outpath"
}

START_TS=$(date +%s)
for cell in "${CELLS[@]}"; do
  label="${cell%%=*}"
  path="${cell##*=}"
  target="$BASE$path"
  for form in mobile desktop; do
    for run in 1 2 3; do
      out="$OUT/lh_med3_${STAMP}_${label}_${form}_run${run}"
      ts=$(date +%H:%M:%S)
      echo "[$ts] $label $form run$run -> $out" | tee -a "$LOG"
      run_lh "$target" "$form" "$out" >>"$LOG" 2>&1 \
        || echo "FAILED: $label $form run$run" | tee -a "$LOG"
    done
  done
done
END_TS=$(date +%s)
echo "done in $((END_TS - START_TS))s" | tee -a "$LOG"
kill "$PING_PID" 2>/dev/null || true
