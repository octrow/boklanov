# Lighthouse runbook — boklanov.com

How to run a clean, reproducible Lighthouse audit for this project.
Pairs with [`LIGHTHOUSE_IMPROVEMENT_PLAN.md`](./LIGHTHOUSE_IMPROVEMENT_PLAN.md)
and [`PAYLOAD_IMAGE_VARIANTS_PLAN.md`](./PAYLOAD_IMAGE_VARIANTS_PLAN.md).

## ⚠ Why `boklanov.com` is not your baseline on this branch

Prod `boklanov.com` runs `main`, which is the Keystatic CMS build.
`feature/payloadcms` is a different CMS (Payload) on top of a different
data pipeline. Auditing prod tells you nothing about whether this branch
got faster or slower — you're measuring two different sites.

Two valid test surfaces for `feature/payloadcms`:

| Surface        | URL                                                               | Use it for                                                |
| -------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Local prod     | `http://localhost:3000` (after `pnpm build && pnpm start`)        | Dev loop. Fast, deterministic, same Next bundle as Vercel |
| Vercel preview | `boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app` | Pre-merge gate. Real edge, ISR, R2, Image Optimization    |

Do **not** use `pnpm dev` (= `next dev`) for perf — unminified, HMR
overhead, dev React warnings; scores run 20–40 points worse than prod.
The opportunities it reports are not real.

The right "did this branch regress?" comparison is `main` (local prod)
vs `feature/payloadcms` (local prod), same machine, same network. See
`scripts/lh-diff.sh` (below, "Branch-vs-branch diff").

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

Pick a target by exporting `BASE_URL` first. The two recipes below are
identical regardless of target — the URL is the only thing that changes:

```bash
# A) Local prod build (default — fast dev loop)
pnpm build && pnpm start &
SERVER_PID=$!
# Wait until http://localhost:3000/ru returns 200, then:
export BASE_URL="http://localhost:3000"

# B) Vercel preview (pre-merge sanity check; one-time bypass setup below)
export BASE_URL="https://boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app?x-vercel-protection-bypass=$VERCEL_BYPASS&x-vercel-set-bypass-cookie=samesitenone"
# (Bypass query string survives navigation to sub-resources because of the
#  set-bypass-cookie redirect — see "Vercel preview — one-time bypass setup".)
```

Two parameter sets cover everything we care about: **mobile** (the
default scoring target) and **desktop** (regression sanity check).

```bash
# Mobile — emulates Moto G Power (412×823, DPR 1.75, Slow 4G simulation)
npx -y lighthouse@latest \
  "$BASE_URL/ru" \
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
  "$BASE_URL/ru" \
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

After that, the `BASE_URL` line in the standard-run recipe (Option B)
works as-is. The trick is `x-vercel-set-bypass-cookie=samesitenone`: it
makes Vercel issue a `Set-Cookie` on the first redirect, so every
sub-resource Lighthouse fetches (JS chunks, fonts, images) is also
authorized. Without it the HTML loads but every asset 401s.

**Alternative: disable Deployment Protection temporarily** — fastest
for a one-off manual run, but exposes every preview URL on the project
until re-enabled. Don't use for routine audits.

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

- `pnpm analyze` (`ANALYZE=true next build`) — bundle treemap at `.next/analyze/client.html`; **first stop** for a suspected regression
- `scripts/lh-diff.sh` — `main` vs branch local prod-build diff, side-by-side metrics
- `npx lighthouse@latest` — single-URL audit, mobile/desktop presets, our default
- `lighthouse/core/lib/median-run.js` — median-of-N helper for stable scoring
- `npx @unlighthouse/cli@latest` (binary: `unlighthouse-ci`) — whole-site crawler, dashboard view
- `@lhci/cli` (Lighthouse CI) — multi-run + assertions; not yet adopted
- `pagespeed.web.dev` — manual PSI in a browser, quota-limited for scripted use
- `treosh/lighthouse-ci-action` — GitHub Actions integration (not yet adopted)
