# Lighthouse runbook — boklanov.com

How to run a clean, reproducible Lighthouse audit for this project.
Pairs with [`LIGHTHOUSE_IMPROVEMENT_PLAN.md`](./LIGHTHOUSE_IMPROVEMENT_PLAN.md)
and [`PAYLOAD_IMAGE_VARIANTS_PLAN.md`](./PAYLOAD_IMAGE_VARIANTS_PLAN.md).

## ⚠ Why `boklanov.com` is not your baseline on this branch

Prod `boklanov.com` runs `main`, which is the Keystatic CMS build.
`feature/payloadcms` is a different CMS (Payload) on top of a different
data pipeline. Auditing prod tells you nothing about whether this branch
got faster or slower — you're measuring two different sites.

Two valid test surfaces for `feature/payloadcms`, each good for
different things:

| Surface        | URL                                                               | Trust it for                                                                                   | Don't trust it for                                                                                                                      |
| -------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Local prod     | `http://localhost:3000` (after `pnpm build && pnpm start`)        | TBT/CLS/JS bundle size; "did my deps bloat?" diffs                                             | **LCP and image opportunities** — `next/image` runs cold-sharp at request time against R2, inflating LCP by 5+ s vs what real users see |
| Vercel preview | `boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app` | LCP, TTFB, real-user-equivalent perf score; image pipeline serves baked AVIFs from R2 directly | First-cold TTFB is noisier (Fluid Compute cold start, 400-700 ms); always warm the URL with 2 `curl`s before the audit                  |

Do **not** use `pnpm dev` (= `next dev`) for perf — unminified, HMR
overhead, dev React warnings; scores run 20–40 points worse than prod.
The opportunities it reports are not real.

**LCP regressions are only diagnosable on the preview, never locally.**
A local-only LCP delta (e.g. 5.2 s → 8.9 s) almost always means a
warm-vs-cold sharp/transcode difference in `/_next/image`, not a real
regression. Confirm on the preview before acting on it.

The right "did this branch regress?" comparison is `main` (local prod)
vs `feature/payloadcms` (local prod), same machine, same network — but
**only for non-LCP metrics**. See `scripts/lh-diff.sh` (below,
"Branch-vs-branch diff").

## First response to a suspected regression

Before reaching for Lighthouse, look at the bundle. Most regressions on
this branch will be Payload admin deps leaking into the public bundle —
that shows up here instantly without needing a network round-trip:

```bash
pnpm analyze   # alias for `cross-env ANALYZE=true next build`
# Then open .next/analyze/client.html in a browser.
```

Sort by size; flag anything `payload/*`, `@payloadcms/*`, `lexical`, or
`slate-*` in the **client** bundle (server bundle is fine — those should
only ship to the admin route).

If the bundle is clean, move on to `scripts/lh-diff.sh` for an
end-to-end perf delta, then to a targeted Lighthouse run on whichever
URL the diff points at.

## Why not the browser Lighthouse panel

The DevTools panel runs Lighthouse inside your real Chrome profile.
Installed extensions inject content scripts into every page load and show
up as "Unused JavaScript" / long tasks / third parties in the report.
On the 2026-05-14 mobile run, two extensions alone added **564 ms TBT**
and **2,250 KiB "unused JS"** — none of it ours. Lighthouse warned about
it (`runWarnings`), but the score still dropped from a real 87 to a
reported 85.

Use a headless run. Always.

## Why not PageSpeed Insights either

PSI public endpoint (`https://www.googleapis.com/pagespeedonline/v5/runPagespeed`)
works without an API key but is **rate-limited to ~25 requests/day per
shared IP**. We hit the quota during normal iteration on 2026-05-14.

If you do want PSI for a single sanity check, the URL form is:

```
https://pagespeed.web.dev/analysis?url=<URL>&form_factor=mobile
```

(opens in a browser). Don't rely on it for scripted runs.

## Standard run — `npx lighthouse@latest`, headless

Pick a target. Local prod uses one `BASE_URL`; preview uses a `HOST + path`
split because a bypass query string can't live on `BASE_URL` (it would
collide with `$BASE_URL/ru`):

```bash
# A) Local prod build (default — fast dev loop)
pnpm build && pnpm start &
SERVER_PID=$!
# Wait until http://localhost:3000/ru returns 200, then:
export BASE_URL="http://localhost:3000"
LH_TARGET="$BASE_URL/ru"

# B) Vercel preview, Deployment Protection ON (use header-based bypass)
PREVIEW_HOST="https://boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app"
LH_TARGET="$PREVIEW_HOST/ru"
LH_EXTRA_HEADERS="--extra-headers={\"x-vercel-protection-bypass\":\"$VERCEL_BYPASS\"}"
# Do NOT include x-vercel-set-bypass-cookie: it triggers a 307→200 dance that
# costs ~1 s on LCP. Header-only bypass works because Lighthouse re-sends the
# header on every sub-resource request. See "Vercel preview gotchas" below.

# C) Vercel preview, Deployment Protection OFF (most representative)
PREVIEW_HOST="https://boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app"
LH_TARGET="$PREVIEW_HOST/ru"
LH_EXTRA_HEADERS=""
# Warm the deployment first (Fluid Compute cold start = 400-700 ms TTFB):
curl -s -o /dev/null "$PREVIEW_HOST/ru" && curl -s -o /dev/null "$PREVIEW_HOST/ru"
```

Two parameter sets cover everything we care about: **mobile** (the
default scoring target) and **desktop** (regression sanity check).

```bash
# Mobile — emulates Moto G Power (412×823, DPR 1.75, Slow 4G simulation)
npx -y lighthouse@latest \
  "$LH_TARGET" \
  $LH_EXTRA_HEADERS \
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
  --output-path=".design/boklanov-rewrite/archive/lighthouse_$(date +%d%m%Y_%H%M)_mobile"
```

```bash
# Desktop — emulates 1350×940, DPR 1, no throttling
npx -y lighthouse@latest \
  "$LH_TARGET" \
  $LH_EXTRA_HEADERS \
  --quiet \
  --chrome-flags="--headless=new --no-sandbox --disable-extensions" \
  --preset=desktop \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output=html \
  --output-path=".design/boklanov-rewrite/archive/lighthouse_$(date +%d%m%Y_%H%M)_desktop"
```

For local prod, leave `LH_EXTRA_HEADERS=""` (unset is fine — bash will
expand the unquoted `$LH_EXTRA_HEADERS` to nothing). The `$LH_TARGET`
already carries the path, so no `/ru` suffix on the command line.

Outputs:

- `..._mobile.report.html` — opens in a browser, full UI
- `..._mobile.report.json` — machine-readable, archived for diffs

Run takes ~30-60 s on mobile, ~15-30 s on desktop.

When the local server is finished: `kill $SERVER_PID`.

## URLs to test

Required matrix per re-test (script this if it gets repetitive). All
paths are appended to `$BASE_URL`:

| Path                     | Why                                                       |
| ------------------------ | --------------------------------------------------------- |
| `/`                      | English root / default locale                             |
| `/ru`                    | Russian home — biggest production gallery, real-world LCP |
| `/de`                    | German home — smallest Latin font payload                 |
| `/ru/productions/<slug>` | Production detail — heaviest page, gallery + poster       |
| `/ru/about`              | About — different image layout, sanity check              |

If `BASE_URL` is the Vercel preview and the audit lands on a Vercel SSO
login page (`finalDisplayedUrl` contains `vercel.com`, LCP ~9-10 s), the
bypass cookie didn't stick — re-export `BASE_URL` with both
`x-vercel-protection-bypass=$VERCEL_BYPASS` **and**
`x-vercel-set-bypass-cookie=samesitenone` in the query string.

## Branch-vs-branch diff — `scripts/lh-diff.sh`

The right comparison for "did this branch regress vs `main`?" is two
local prod builds on the same machine. The helper script does the
checkout dance for you, builds + serves + Lighthouses each branch, then
prints a side-by-side metrics table:

```bash
scripts/lh-diff.sh                                  # main vs HEAD, /ru
scripts/lh-diff.sh main feature/payloadcms /ru
scripts/lh-diff.sh main HEAD /ru/productions/iliad
```

Requires a clean working tree (will refuse otherwise). Reports land in
`.design/boklanov-rewrite/archive/lh-diff_<stamp>/` (`base.report.html`,
`head.report.html`, build + server logs alongside). Takes ~3-5 min total
for the four-step build × 2 sequence.

## Vercel preview — one-time bypass setup

Preview URLs (`*-boklanovs-projects.vercel.app`) are auth-gated by
Deployment Protection. Without bypass, headless Lighthouse audits land
on the Vercel SSO login page (LCP 9.9 s, useless data). The browser
works because your Chrome session carries the SSO cookie — headless
Chrome does not, so it needs a token instead.

**Setup (~2 min, one time per developer):**

1. Vercel dashboard → `boklanovv2` project → Settings → **Deployment
   Protection** → scroll to **Protection Bypass for Automation** →
   **Add Secret** (label: e.g. `lighthouse-audits`).
2. Copy the generated secret.
3. **Redeploy the feature branch** — Vercel only injects the secret
   into builds made _after_ the secret was created.
4. Persist it in your shell:

   ```bash
   echo 'export VERCEL_BYPASS="<paste-secret-here>"' >> ~/.zshrc
   source ~/.zshrc
   ```

5. Sanity check (expect HTTP 200, not 401):

   ```bash
   PREVIEW="https://boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app"
   curl -sI -H "x-vercel-protection-bypass: $VERCEL_BYPASS" "$PREVIEW" | head -3
   ```

After that, Option B in the standard-run recipe works as-is.

## Vercel preview gotchas — which bypass costs what

Three bypass modes, in order of LCP-tax:

| Mode                                                                                          | Network-panel result                           | LCP overhead | When to use                                                |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------ | ---------------------------------------------------------- |
| `?x-vercel-protection-bypass=…&x-vercel-set-bypass-cookie=samesitenone` (query string)        | 307 → 200 (cookie-set redirect)                | **~1.2 s**   | Avoid for perf audits. Fine for sanity checks              |
| `--extra-headers '{"x-vercel-set-bypass-cookie":"samesitenone", ...}'` (header w/ set-cookie) | 307 → 200 (same dance)                         | **~1.2 s**   | Same problem — `set-bypass-cookie` is what triggers it     |
| `--extra-headers '{"x-vercel-protection-bypass":"…"}'` (header only, no set-cookie)           | 307 → 200 (Vercel auth handshake on cold path) | **~1.0 s**   | Best with protection ON. Cleaner than the cookie redirects |
| **Deployment Protection disabled** (toggle in dashboard)                                      | 200 direct                                     | **0 s**      | Most representative numbers. Re-enable after the audit     |

**The unintuitive part:** even header-only bypass still costs ~1 s. The
edge cache is keyed by `vary: RSC, Next-Router-State-Tree, …` headers,
so `curl` (no RSC headers) hits a cached 200 while Lighthouse (real
RSC navigation) misses cache, runs middleware + protection
handshake, and eats a 307. **The bypass tax is structural**, not
something we can flag-tune away.

**Recommended workflow for representative numbers:** flip Deployment
Protection off, run the audit, flip it back on. The exposure window is
~2 min and the preview URL hash is non-guessable; risk is minimal for a
non-production project. Don't leave it off.

## Reading a preview report — what the redirect numbers actually mean

The `redirects` audit on a protected preview almost always reports
500-1500 ms wasted. Subtract that from LCP to get a real-user-equivalent
number. Cross-check by looking at the first two `network-requests`
items — if they're `/ru` → 307, `/ru` → 200 (same URL), it's the bypass
handshake, not an application redirect. Only worry if the redirect is
between _different_ URLs (e.g. `/` → `/ru`, or `/ru` → `/ru/` trailing-
slash) — that's application-level and fixable.

`document-latency-insight` rolls up redirect + TTFB + compression; on a
protected preview it inherits the bypass-handshake ms and inflates
accordingly. Trust `server-response-time` (raw TTFB) over
`document-latency-insight` when protection is on.

## Whole-site audits — `unlighthouse`

For broader regression checks (every route, not a hand-picked five),
`@unlighthouse/cli` crawls and runs Lighthouse against each discovered
route. Use the **`unlighthouse-ci`** binary for headless static output —
the bare `unlighthouse` command opens the interactive UI and `--build-static`
is a CI-binary flag:

```bash
# Use the same $BASE_URL idiom as the standard run (omit the path segment).
# For the Vercel preview, include the bypass query string.
npx -y @unlighthouse/cli@latest \
  --site "$BASE_URL" \
  --build-static \
  --output-path ".design/boklanov-rewrite/archive/unlighthouse_$(date +%d%m%Y_%H%M)"
```

(Invoke as `unlighthouse-ci` if installed globally: `npm i -g @unlighthouse/cli`.)
Slow (3-5 min for our route count), but produces a sortable per-route
dashboard at `<output-path>/client/`. Run before milestone gates, not on
every iteration.

## Re-baking AVIF variants before a run

Default `npm run bake-variants` uses `AVIF_EFFORT=4` — ~2× faster than effort 6
at a ~10–15 % size penalty. That's the right trade for catalog work, but for
a **Lighthouse capture that gates a quality decision**, re-bake at effort 6
first so byte savings show up in the report:

```bash
AVIF_EFFORT=6 npm run bake-variants -- --force   # ~5 min, saturates ~11 cores
```

The script's progress bar reports `built / skip / miss / fail` live; investigate
any non-zero `fail` count (full structured log at `/tmp/bake-errors.log`)
before trusting the post-bake Lighthouse numbers. `miss=68` is a known
catalog-side data issue (Payload references with no R2 source), not a bake bug.

## Reading a report — what to check first

In the JSON (or via the script below):

1. **`runWarnings`** — empty array means clean run. If it mentions
   extensions, the run is invalid; re-run with `--disable-extensions`.
2. **`finalDisplayedUrl`** — confirm it matches the URL you asked for.
   If it shows a Vercel SSO login page, you hit Deployment Protection.
3. **`configSettings.formFactor`** — mobile vs desktop, must match
   intent.
4. **Top opportunities by `metricSavings.LCP`** — sorted descending,
   tells you the highest-impact fixes. Don't optimize audits with 0 ms
   `LCP` savings; they don't move the score.
5. **`long-tasks` items** — first column is the URL. Filter out
   `chrome-extension://` (shouldn't appear in headless runs) and
   anything `Unattributable`. What's left is yours.
6. **`network-requests`** sorted by `transferSize` — top 10 tells you
   what's bandwidth-heavy. For us, that's almost always images.

Quick summary script (copy-paste; assumes `python3` available):

```bash
python3 - <<'PY'
import json, sys, glob, os
path = sorted(glob.glob('.design/boklanov-rewrite/archive/lighthouse_*.json'))[-1]
d = json.load(open(path))
print(f"=== {os.path.basename(path)} ===")
print(f"URL: {d['finalDisplayedUrl']}")
print(f"form: {d['configSettings']['formFactor']}  warnings: {d.get('runWarnings') or 'none'}")
print()
for k,v in d['categories'].items():
    print(f"  {v['title']:18} {round(v['score']*100)}")
a = d['audits']
print("\nMetrics:")
for k,l in [('first-contentful-paint','FCP'),('largest-contentful-paint','LCP'),
            ('total-blocking-time','TBT'),('cumulative-layout-shift','CLS'),
            ('speed-index','SI'),('interactive','TTI')]:
    x = a.get(k,{}); print(f"  {l:6} {x.get('displayValue','')}  (score {x.get('score')})")
print("\nTop LCP opportunities:")
opps = [(((v.get('metricSavings') or {}).get('LCP',0)), k, v.get('displayValue',''))
        for k,v in a.items() if v.get('scoreDisplayMode')=='metricSavings']
for ms,k,dv in sorted(opps, key=lambda x:-x[0])[:8]:
    if ms: print(f"  LCP -{ms:>4}ms  {k:38} {dv}")
PY
```

## Median of N runs

Lighthouse CLI has **no `--runs` flag**. When scores swing run-to-run
(simulated-throttling variance), run it N times and pick the median.
Quickest path uses the bundled `computeMedianRun` utility:

```bash
node - <<'JS'
const {spawnSync} = require('child_process');
const cli = require.resolve('lighthouse/cli');
const {computeMedianRun} = require('lighthouse/core/lib/median-run.js');

const url = process.env.BASE_URL ? `${process.env.BASE_URL}/ru` : 'http://localhost:3000/ru';
const runs = [];
for (let i = 0; i < 3; i++) {
  const {status, stdout} = spawnSync('node', [cli, url,
    '--quiet', '--output=json', '--form-factor=mobile',
    '--chrome-flags=--headless=new --disable-extensions',
  ]);
  if (status === 0) runs.push(JSON.parse(stdout));
}
const median = computeMedianRun(runs);
console.log('Perf:', Math.round(median.categories.performance.score * 100));
JS
```

For multi-URL CI-style aggregation, switch to **Lighthouse CI**
(`@lhci/cli`) — its `numberOfRuns` config key plus assertions are the
right tool. We haven't adopted it yet (see "CI integration" below).

### When median-of-3 lies — the zero-traffic preview trap

Median-of-3 only works when the system under test stays in the **same
state** across all 3 runs. On a Vercel preview with zero organic traffic,
that assumption breaks: Fluid Compute spins idle instances down between
runs (~30-60 s of inactivity is enough), so each Lighthouse run cold-starts
unless it happens fast enough to ride the previous run's warm window.

Symptom: per-run Perf scores cluster bimodally, e.g. `[55, 56, 91]` —
two cold-starts and one warm run. **Median picks `56`** — the middle of
the cold-starts. The data looks catastrophic when the application is
actually fine. We hit this on 2026-05-17 0425 across all 10 cells (see
`LIGHTHOUSE_IMPROVEMENT_PLAN.md` Round 2 "First median-of-3 attempt").

**Fix: parallel keep-alive ping during the audit window.** A background
loop hitting one representative URL every 4 s is enough to keep an
instance warm for the whole audit batch:

```bash
PREVIEW="https://boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app"
( while :; do curl -s -o /dev/null "$PREVIEW/ru"; sleep 4; done ) &
PING_PID=$!
trap 'kill "$PING_PID" 2>/dev/null' EXIT

# ... your sequential Lighthouse runs here ...

kill "$PING_PID"
```

Notes:

- Use a **single** URL the pinger hits. Cross-URL pings don't share a
  warm instance under Fluid Compute (different route handlers).
- 4 s is conservative; 8 s also works in practice. Cold-start threshold
  on this project is somewhere around 15-30 s of inactivity.
- The pings DON'T affect Lighthouse's own measurements — Lighthouse uses
  its own Chrome instance with its own connection pool; the preview just
  has a hot Function instance ready when Chrome navigates.
- Running this against `boklanov.com` (real production) is unnecessary —
  organic traffic keeps it warm.
- If you DO get bimodal results despite the pinger, your sleep is too
  long or the cells you're testing route through different handlers
  (e.g. `/api/og/...` vs `/ru/...`). Extend the ping to cover them all,
  staggered.

### Median vs best — when each is right

| You're measuring …                                      | Use …                                   | Why                                                                                                   |
| ------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Variance from simulated-throttling on a warm Function   | **median-of-3**                         | Filters the natural simulation jitter (±3-5 Perf points) without overweighting any single noisy run.  |
| Cold-start bimodal distribution on zero-traffic preview | **best-of-N** (with pinger if possible) | Median is contaminated by cold-starts; best-of-N approximates the warm-Function state real users see. |
| Production with real traffic                            | **median-of-3** (any N actually)        | Functions stay warm — pure jitter only.                                                               |

Default to median-of-3 with a parallel pinger. Switch to best-of-N only
when you can confirm 1-2 cold-start outliers per cell after the fact.

## Archive convention

- Path: `.design/boklanov-rewrite/archive/lighthouse_<DDMMYYYY>_<HHMM>[_<label>].json`
- Label is optional but encouraged: `_mobile`, `_desktop`, `_preview`,
  `_after-q62`, `_after-variants`, etc.
- Commit the `.json` (not the `.html` — too large; it can be regenerated
  from the JSON with `lighthouse --output html --report <path.json>`).
- Update `STATUS.md` (or the relevant plan doc) with the score row when
  a run validates a fix.

## CI integration (future)

Not wired yet. If we add it: GitHub Action runs the mobile preset
against `boklanov.com` (or the preview with bypass token) on every PR,
posts a comment with the diff vs `main`. Reference setup:
`treosh/lighthouse-ci-action` — supports a budget JSON, fails the build
on regression. Worth doing once Plan B (variant baking) lands and the
scores stop oscillating.

## Troubleshooting

| Symptom                                                              | Cause                                                                                                                                                                                                                       | Fix                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runWarnings` mentions Chrome extensions                             | Headless flag missing                                                                                                                                                                                                       | Add `--chrome-flags="--headless=new --disable-extensions"`                                                                                                                                                                                                            |
| `finalDisplayedUrl` is a Vercel login                                | Deployment Protection on preview                                                                                                                                                                                            | Use bypass token (see above)                                                                                                                                                                                                                                          |
| LCP wildly different across runs                                     | Cold ISR cache + Slow-4G simulation                                                                                                                                                                                         | Pre-warm with a `curl <URL>` once, then re-run                                                                                                                                                                                                                        |
| `npx lighthouse@latest` install slow                                 | `npx` cache miss                                                                                                                                                                                                            | First run installs to `~/.npm/_npx`; subsequent runs reuse                                                                                                                                                                                                            |
| "Unable to launch Chrome"                                            | No Chromium on host                                                                                                                                                                                                         | Install `google-chrome` system package, or use `npx puppeteer-chromium-resolver`                                                                                                                                                                                      |
| Score swings 5+ points run-to-run                                    | Simulated throttling variance                                                                                                                                                                                               | Run 3× and take the median by hand, or use the median-run snippet below                                                                                                                                                                                               |
| `redirects` audit flags `/ru` → `/ru` (same URL) on a Vercel preview | Vercel's rewrite-caching layer (`x-vercel-enable-rewrite-caching: 1` in response headers) issues a one-time 307 on cold headless navigations. RSC-keyed edge cache: curl with cache-bust still HITs, headless Chrome MISSES | Not avoidable from app code. Cost is ~1.0-1.2 s LCP on Lighthouse, ~0 s on real users (their navigations warm the cache). Subtract from LCP to get real-user-equivalent number. The localeDetection fix was tried (`380f0f0` → reverted in `d7b30be`) and didn't help |
| Local LCP 5+ s worse than preview LCP                                | `<Image>` cold-sharp transcodes through `/_next/image` on each request; preview serves baked AVIF variants direct from R2                                                                                                   | Don't diagnose LCP locally. Trust the preview number. See `PAYLOAD_IMAGE_VARIANTS_PLAN.md`                                                                                                                                                                            |
| CLS spikes 0.3+ in a single audit, then disappears on rerun          | Cold LCP-image fetch from R2: warm-up curls fetch HTML, not the image. Late-arriving image pushes layout down measurably on that one run                                                                                    | Either warm the LCP image URL explicitly (`curl -o /dev/null https://<r2>/.../poster.720.avif`) before the audit, or always median-of-3 and drop any single outlier run                                                                                               |
| `LCP element: ?` in extractor output                                 | `largest-contentful-paint-element` audit was removed in Lighthouse 13; replaced by `lcp-breakdown-insight` + `lcp-discovery-insight` (both score 1 = pass)                                                                  | Read the insight audits instead. The LCP element is properly classified — your extractor is looking for a key that no longer exists                                                                                                                                   |
| Single run shows perf 50-60 in an otherwise 80-90 range              | Vercel Fluid Compute cold function start (FCP 6+ s, TTI 11+ s) — the function instance was idle, took 5+ s to spin up                                                                                                       | Always median-of-3 with a **parallel keep-alive pinger** (see "When median-of-3 lies" below). Without the pinger on a zero-traffic preview, 2/3 runs cold-start and the median picks one of them — looks catastrophic when the app is fine.                           |
| Median-of-3 returns Perf 50-60 across every cell, baseline was 80-90 | Sequential audits on a zero-traffic preview — Fluid Compute spins down between runs; 2/3 are cold-starts; median picks a cold-start                                                                                         | Re-run with a background keep-alive pinger (`while :; do curl -s -o /dev/null "$URL"; sleep 4; done &`). For one-off reads, take best-of-3 instead of median.                                                                                                         |

## Tools index

- `pnpm analyze` (`ANALYZE=true next build`) — bundle treemap at `.next/analyze/client.html`; **first stop** for a suspected regression
- `scripts/lh-diff.sh` — `main` vs branch local prod-build diff, side-by-side metrics
- `npx lighthouse@latest` — single-URL audit, mobile/desktop presets, our default
- `lighthouse/core/lib/median-run.js` — median-of-N helper for stable scoring
- `npx @unlighthouse/cli@latest` (binary: `unlighthouse-ci`) — whole-site crawler, dashboard view
- `@lhci/cli` (Lighthouse CI) — multi-run + assertions; not yet adopted
- `pagespeed.web.dev` — manual PSI in a browser, quota-limited for scripted use
- `treosh/lighthouse-ci-action` — GitHub Actions integration (not yet adopted)
