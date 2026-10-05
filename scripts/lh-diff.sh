#!/usr/bin/env bash
# lh-diff.sh — local Lighthouse diff between two branches.
#
# Builds + serves each branch's prod bundle on :3000, runs headless mobile
# Lighthouse, then prints a side-by-side metrics table (FCP/LCP/TBT/CLS/SI +
# the four category scores). Reports are kept under
# .design/boklanov-rewrite/archive/lh-diff_<DDMMYYYY_HHMM>/ for inspection.
#
# This is the right tool for "did my feature branch make things faster or
# slower?" — prod boklanov.com is on `main` with a different CMS and is NOT a
# valid baseline for feature/payloadcms (see LIGHTHOUSE_RUNBOOK.md → "Why
# boklanov.com is not your baseline on this branch").
#
# Usage:
#   scripts/lh-diff.sh                       # main  vs current branch, /ru
#   scripts/lh-diff.sh main feature/payloadcms /ru
#   scripts/lh-diff.sh main HEAD /ru/productions/some-slug
#
# Requires: pnpm (or npm), node 20+, jq, curl, a clean working tree.

set -euo pipefail

BASE_BRANCH="${1:-main}"
HEAD_BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"
PATHNAME="${3:-/ru}"
PORT="${PORT:-3000}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "error: working tree is dirty — commit or stash first" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required (sudo apt install jq)" >&2
  exit 1
fi

START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
STAMP="$(date +%d%m%Y_%H%M)"
OUT_DIR=".design/boklanov-rewrite/archive/lh-diff_${STAMP}"
mkdir -p "$OUT_DIR"

PKG_MGR="pnpm"
command -v pnpm >/dev/null 2>&1 || PKG_MGR="npm"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  # Restore the user's branch even on failure.
  if [[ "$(git rev-parse --abbrev-ref HEAD)" != "$START_BRANCH" ]]; then
    git checkout --quiet "$START_BRANCH" || true
  fi
}
trap cleanup EXIT INT TERM

run_branch() {
  local branch="$1" label="$2"
  echo
  echo "=== $label: $branch ==="
  git checkout --quiet "$branch"
  echo "[$label] installing deps"
  "$PKG_MGR" install --silent
  echo "[$label] building"
  "$PKG_MGR" run build >"$OUT_DIR/${label}_build.log" 2>&1

  echo "[$label] starting server on :$PORT"
  "$PKG_MGR" run start -- -p "$PORT" >"$OUT_DIR/${label}_server.log" 2>&1 &
  SERVER_PID=$!

  # Poll until /ru responds with 200, up to 60 s.
  for _ in $(seq 1 60); do
    if curl -sf -o /dev/null "http://localhost:$PORT$PATHNAME"; then break; fi
    sleep 1
  done

  echo "[$label] running mobile lighthouse against $PATHNAME"
  npx -y lighthouse@latest "http://localhost:$PORT$PATHNAME" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox --disable-extensions" \
    --form-factor=mobile \
    --screenEmulation.mobile=true \
    --screenEmulation.width=412 \
    --screenEmulation.height=823 \
    --screenEmulation.deviceScaleFactor=1.75 \
    --throttling-method=simulate \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output=html \
    --output-path="$OUT_DIR/${label}" >/dev/null

  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  SERVER_PID=""
}

run_branch "$BASE_BRANCH" base
run_branch "$HEAD_BRANCH" head

echo
echo "=== diff (base = $BASE_BRANCH, head = $HEAD_BRANCH, path = $PATHNAME) ==="
python3 - "$OUT_DIR/base.report.json" "$OUT_DIR/head.report.json" <<'PY'
import json, sys, os

base = json.load(open(sys.argv[1]))
head = json.load(open(sys.argv[2]))

def cats(d):
    return {k: round(v['score'] * 100) for k, v in d['categories'].items()}

def metric(d, k):
    a = d['audits'].get(k, {})
    return a.get('numericValue'), a.get('displayValue', '')

print(f"{'':30}  {'base':>10}  {'head':>10}  {'Δ':>8}")
print('-' * 64)
bc, hc = cats(base), cats(head)
for k in ('performance', 'accessibility', 'best-practices', 'seo'):
    if k in bc and k in hc:
        delta = hc[k] - bc[k]
        arrow = '▲' if delta > 0 else ('▼' if delta < 0 else ' ')
        print(f"  {k:28}  {bc[k]:>10}  {hc[k]:>10}  {arrow}{abs(delta):>7}")

print()
for k, lab in (
    ('first-contentful-paint', 'FCP'),
    ('largest-contentful-paint', 'LCP'),
    ('total-blocking-time', 'TBT'),
    ('cumulative-layout-shift', 'CLS'),
    ('speed-index', 'SI'),
    ('interactive', 'TTI'),
):
    bn, bd = metric(base, k)
    hn, hd = metric(head, k)
    if bn is None or hn is None:
        continue
    delta = hn - bn
    unit = '' if k == 'cumulative-layout-shift' else ' ms'
    arrow = '▼' if delta < 0 else ('▲' if delta > 0 else ' ')
    # For metrics, lower is better → ▼ is good.
    print(f"  {lab:6} {bd:>10}  →  {hd:>10}  {arrow}{abs(delta):>8.0f}{unit}")

print()
print(f"reports: {os.path.dirname(sys.argv[1])}/")
PY
