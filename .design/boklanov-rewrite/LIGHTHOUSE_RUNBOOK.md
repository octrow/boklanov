# Lighthouse runbook — boklanov.com

How to run a clean, reproducible Lighthouse audit for this project.
Pairs with [`LIGHTHOUSE_IMPROVEMENT_PLAN.md`](./LIGHTHOUSE_IMPROVEMENT_PLAN.md)
and [`PAYLOAD_IMAGE_VARIANTS_PLAN.md`](./PAYLOAD_IMAGE_VARIANTS_PLAN.md).

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

Two parameter sets cover everything we care about: **mobile** (the
default scoring target) and **desktop** (regression sanity check).

```bash
# Mobile — emulates Moto G Power (412×823, DPR 1.75, Slow 4G simulation)
npx -y lighthouse@latest \
  "https://boklanov.com/ru" \
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
  "https://boklanov.com/ru" \
  --quiet \
  --chrome-flags="--headless=new --no-sandbox --disable-extensions" \
  --preset=desktop \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output=html \
  --output-path=".design/boklanov-rewrite/archive/lighthouse_$(date +%d%m%Y_%H%M)_desktop"
```

Outputs:

- `..._mobile.report.html` — opens in a browser, full UI
- `..._mobile.report.json` — machine-readable, archived for diffs

Run takes ~30-60 s on mobile, ~15-30 s on desktop.

## URLs to test

Required matrix per re-test (script this if it gets repetitive):

| URL                                          | Why                                                       |
| -------------------------------------------- | --------------------------------------------------------- |
| `https://boklanov.com/`                      | English root / default locale                             |
| `https://boklanov.com/ru`                    | Russian home — biggest production gallery, real-world LCP |
| `https://boklanov.com/de`                    | German home — smallest Latin font payload                 |
| `https://boklanov.com/ru/productions/<slug>` | Production detail — heaviest page, gallery + poster       |
| `https://boklanov.com/ru/about`              | About — different image layout, sanity check              |

For the **feature branch preview** (`*-boklanovs-projects.vercel.app`),
Vercel Deployment Protection blocks Lighthouse — the audit lands on the
SSO login page (LCP 9.9 s, useless data). See "Branch previews" below.

## Branch previews (Vercel Deployment Protection)

Preview URLs are gated by default. Three ways to test them:

**1. Protection Bypass for Automation** (recommended for CI)

- Vercel dashboard → Project → Settings → Deployment Protection →
  Protection Bypass for Automation → generate token.
- Append to URL: `?x-vercel-protection-bypass=<token>&x-vercel-set-bypass-cookie=samesitenone`
  or send header `x-vercel-protection-bypass: <token>`.

**2. Disable Deployment Protection temporarily** — fastest for a one-off
manual run, but exposes every preview URL until re-enabled.

**3. Test locally instead**:

```bash
npm run build && npm run start &
# Wait for "Ready on http://localhost:3000"
npx -y lighthouse@latest "http://localhost:3000/ru" \
  --chrome-flags="--headless=new --no-sandbox --disable-extensions" \
  --form-factor=mobile --screenEmulation.mobile=true \
  --output=html --output-path=/tmp/lh_local
```

Caveat: local doesn't simulate Vercel edge latency. Use only for code
changes whose impact is JS- or image-side (most of ours).

## Whole-site audits — `unlighthouse`

For broader regression checks (every route, not a hand-picked five),
`@unlighthouse/cli` crawls and runs Lighthouse against each discovered
route. Use the **`unlighthouse-ci`** binary for headless static output —
the bare `unlighthouse` command opens the interactive UI and `--build-static`
is a CI-binary flag:

```bash
npx -y @unlighthouse/cli@latest \
  --site https://boklanov.com \
  --build-static \
  --output-path .design/boklanov-rewrite/archive/unlighthouse_$(date +%d%m%Y_%H%M)
```

(Invoke as `unlighthouse-ci` if installed globally: `npm i -g @unlighthouse/cli`.)
Slow (3-5 min for our route count), but produces a sortable per-route
dashboard at `<output-path>/client/`. Run before milestone gates, not on
every iteration.

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

const url = 'https://boklanov.com/ru';
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

| Symptom                                  | Cause                               | Fix                                                                              |
| ---------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `runWarnings` mentions Chrome extensions | Headless flag missing               | Add `--chrome-flags="--headless=new --disable-extensions"`                       |
| `finalDisplayedUrl` is a Vercel login    | Deployment Protection on preview    | Use bypass token (see above)                                                     |
| LCP wildly different across runs         | Cold ISR cache + Slow-4G simulation | Pre-warm with a `curl <URL>` once, then re-run                                   |
| `npx lighthouse@latest` install slow     | `npx` cache miss                    | First run installs to `~/.npm/_npx`; subsequent runs reuse                       |
| "Unable to launch Chrome"                | No Chromium on host                 | Install `google-chrome` system package, or use `npx puppeteer-chromium-resolver` |
| Score swings 5+ points run-to-run        | Simulated throttling variance       | Run 3× and take the median by hand, or use the median-run snippet below          |

## Tools index

- `npx lighthouse@latest` — single-URL audit, mobile/desktop presets, our default
- `lighthouse/core/lib/median-run.js` — median-of-N helper for stable scoring
- `npx @unlighthouse/cli@latest` (binary: `unlighthouse-ci`) — whole-site crawler, dashboard view
- `@lhci/cli` (Lighthouse CI) — multi-run + assertions; not yet adopted
- `pagespeed.web.dev` — manual PSI in a browser, quota-limited for scripted use
- `treosh/lighthouse-ci-action` — GitHub Actions integration (not yet adopted)
