Here's a curated terminal-first stack for auditing/optimizing a Next.js 15 site on Ubuntu 24.04. Grouped by what they
actually do — there's a lot of overlap in this space, so I'm flagging which tool you'd reach for first.

## Quick map

| Need                                             | First reach                                            | Notes                                       |
| ------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------- |
| Single-page audit (perf/a11y/SEO/best practices) | `lighthouse` CLI                                       | The reference                               |
| Whole-site audit (every route)                   | `unlighthouse`                                         | Wraps Lighthouse, parallel, gorgeous UI     |
| Real-browser perf, repeatable, dashboards        | `sitespeed.io`                                         | Heaviest but most thorough                  |
| CI gating with budgets                           | `lhci` (Lighthouse CI)                                 | Pairs with GitHub Actions                   |
| Next.js bundle bloat                             | `@next/bundle-analyzer` or `next experimental-analyze` | The latter is Turbopack-native (Next 16.1+) |
| Accessibility deep-dive                          | `@axe-core/cli`, `pa11y-ci`                            | More thorough than Lighthouse's a11y slice  |
| Broken links / link audit                        | `lychee`                                               | Rust, blazing fast                          |
| Load testing                                     | `k6`, `oha`, `vegeta`                                  | k6 for scripted, oha for quick hits         |

---

## 1. Lighthouse family

**Vanilla Lighthouse CLI** — single page, exhaustive.

```bash
npm i -g lighthouse
lighthouse https://yoursite.com --view --output=html --output-path=./report.html
# Headless, JSON for piping:
lighthouse https://yoursite.com --output=json --chrome-flags="--headless=new" > report.json
```

By default, network and CPU throttling are applied: slow 4G connectivity and CPU slowed 4x. Disable with
`--throttling.*` flags.

**Unlighthouse** — the big upgrade if you have more than one page. Unlike the standard lighthouse CLI which tests one
page at a time, Unlighthouse automatically discovers and audits all your pages by wrapping the Lighthouse npm package
for site-wide scanning.

```bash
npx unlighthouse --site https://yoursite.com
# Desktop mode, throttling, 3 samples per route:
npx unlighthouse --site yoursite.com --desktop --throttle --samples 3
```

Opens a dashboard on `localhost:5678` with filmstrips, per-route scores, and exportable JSON in `.unlighthouse/`.

**Lighthouse CI (`lhci`)** — for budgets and CI gating.

```bash
npm i -g @lhci/cli
lhci autorun --collect.url=https://yoursite.com --assert.preset=lighthouse:recommended
```

Drop a `lighthouserc.json` with budgets (LCP < 2.5s, JS payload < 200kb, etc.) and fail PRs that regress.

---

## 2. sitespeed.io — the heavyweight

Best when you want continuous monitoring, HAR waterfalls, video, and Grafana dashboards. sitespeed.io drives a real
browser (Firefox, Chrome, Edge, Safari) and collects Core Web Vitals, video and visual metrics, HAR waterfall, and
CPU/long-task analysis.

```bash
# Easiest: Docker (recommended on Ubuntu)
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io \
  https://yoursite.com -n 5 --video --visualMetrics
```

The `-n 5` flag runs five iterations and reports the median — recommended for any real measurement, since single runs
are noisy.

For long-term tracking, pair with the official Graphite + Grafana docker-compose they ship.

---

## 3. Next.js 15-specific

**`@next/bundle-analyzer`** — the standard.

```bash
pnpm add -D @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})
module.exports = withBundleAnalyzer({})
```

```bash
ANALYZE=true pnpm build
```

The plugin writes three HTML files (client.html, edge.html, nodejs.html) into .next/analyze/, covering the browser
bundle, the edge-runtime bundle, and the Node.js server bundle respectively.

**`next experimental-analyze`** — if you're on Turbopack (Next 16.1+, ignore if still on 15.x). The Next.js Bundle
Analyzer is integrated with Turbopack's module graph, available in v16.1 and later. You can also use the `--output` flag
to write to disk: `npx next experimental-analyze --output` writes static files to `.next/diagnostics/analyze` that can
be copied elsewhere or shared.

**Built-in CPU profiling** (Next 15+):

```bash
next build --experimental-cpu-prof
next dev --experimental-cpu-prof   # Ctrl+C saves the profile
```

Generated `.cpuprofile` files can be opened in Chrome DevTools (Performance tab → Load profile) or other V8-compatible
profiling tools.

**`next info`** — environment dump, useful for bug reports.

**Bundle budgets in CI** — `size-limit` is the standard:

```bash
pnpm add -D size-limit @size-limit/preset-app
# Then a "size-limit" section in package.json with budgets per chunk.
pnpm size-limit
```

---

## 4. Accessibility (deeper than Lighthouse's slice)

**`@axe-core/cli`** — uses the same engine as the axe browser extension.

```bash
npm i -g @axe-core/cli
axe https://yoursite.com --tags wcag2aa,wcag21aa --save axe-report.json
```

**`pa11y` / `pa11y-ci`** — opinionated, CI-friendly, supports sitemap input.

```bash
npm i -g pa11y pa11y-ci
pa11y https://yoursite.com
# Or crawl from sitemap:
pa11y-ci --sitemap https://yoursite.com/sitemap.xml
```

---

## 5. Links, SEO, crawling

**`lychee`** (Rust, very fast broken-link checker):

```bash
sudo apt install cargo  # if needed
cargo install lychee
lychee --no-progress https://yoursite.com
# Or crawl your built static export:
lychee './out/**/*.html'
```

**`linkinator`** — Node alternative, simpler:

```bash
npx linkinator https://yoursite.com --recurse
```

---

## 6. Security headers & TLS

**Mozilla HTTP Observatory CLI**:

```bash
pip install httpobs
httpobs-cli yoursite.com
```

**`testssl.sh`** — checks TLS config, ciphers, vulns:

```bash
sudo apt install testssl.sh
testssl.sh yoursite.com
```

**`nikto`** — quick web scanner:

```bash
sudo apt install nikto
nikto -h https://yoursite.com
```

---

## 7. Network / load testing

For your FastAPI backend behind the Next.js frontend, these are the modern picks:

```bash
# Quick single-request timing
sudo apt install httpie
http --print=Hh https://yoursite.com/api/health

# Benchmarks of one endpoint (statistically rigorous)
cargo install hyperfine
hyperfine --warmup 3 'curl -s https://yoursite.com/api/health'

# Quick load test (Rust, modern, beautiful TUI)
cargo install oha
oha -z 30s -c 50 https://yoursite.com/api/endpoint

# Scripted load tests (the serious option)
sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update && sudo apt install k6
k6 run script.js
```

---

## Pragmatic workflow for a Next 15 site

If I were setting this up from scratch on your stack, I'd do:

1. **Local dev loop:** `ANALYZE=true pnpm build` whenever a PR adds deps; eyeball the treemap.
2. **Pre-merge gate:** `lhci autorun` in GitHub Actions with budgets on LCP, INP, TBT, and JS bytes.
3. **Periodic full audit:** `npx unlighthouse --site staging.yoursite.com --desktop --throttle --samples 3` — get the
   multi-page picture.
4. **Backend perf:** `oha` or `k6` against the FastAPI routes from a separate host (not the dev box — too noisy).
5. **Continuous monitoring (optional):** sitespeed.io in Docker → Graphite → Grafana, scheduled hourly via cron or k8s
   CronJob.

Three issues hiding in this setup — worth separating them before picking commands.

## The trap with each option

**`npm run dev` on localhost:3000** — don't use this for perf audits. It's unminified, has HMR overhead, dev-only React
warnings, source maps, and skips a lot of production optimizations. Scores will be 20-40 points worse than what your
users actually see. Useful for catching layout/a11y issues, useless for perf numbers.

**`npm run build && npm run start`** — this is what you want locally. Real production bundle, served exactly as Vercel
would serve it (just without their edge network). Best signal-to-noise for "did my feature branch make things worse."

**Vercel preview with auth wall** — fixable with Protection Bypass for Automation. You generate a secret in Project
Settings → Deployment Protection, then authenticate via either an HTTP header `x-vercel-protection-bypass` or a query
parameter of the same name. The header is the recommended approach for automation tools, and Vercel automatically
exposes it as `VERCEL_AUTOMATION_BYPASS_SECRET` in deployments.

---

## Recommended workflow for boklanov.com

Two-stage audit:

**Stage 1 — local prod build (fast, deterministic, your bottleneck signal):**

```bash
git checkout feature/payloadcms
pnpm install
pnpm build          # check terminal output for bundle sizes already
pnpm start          # serves on :3000, prod mode
```

Then in another terminal: lighthouse / unlighthouse / sitespeed against `http://localhost:3000`.

**Stage 2 — Vercel preview (real network, edge functions, CDN, ISR):**
With the bypass secret, hit `boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app` headlessly. This catches
things local can't: edge runtime regressions, real TTFB, image optimization on Vercel's pipeline, ISR cache behavior.

You don't need both for every run — Stage 1 is your dev-loop tool, Stage 2 is your pre-merge sanity check.

---

## Setting up the Vercel bypass (one-time, ~2 minutes)

1. Vercel dashboard → `boklanovv2` project → Settings → **Deployment Protection** → scroll to **Protection Bypass for
   Automation** → click **Add Secret** (give it a note like "lighthouse-audits").
2. Copy the generated secret.
3. **Redeploy** the feature branch — Vercel only injects the secret into builds made _after_ you create it.
4. Store it locally:
   ```bash
   echo 'export VERCEL_BYPASS="paste-secret-here"' >> ~/.zshrc  # or ~/.bashrc
   source ~/.zshrc
   ```

The critical extra trick for browser-based tools: set an additional header or query parameter
`x-vercel-set-bypass-cookie=true`, which sets the authorization bypass as a cookie via a redirect with a Set-Cookie
header. This means follow-up requests (sub-resources, navigation) are also unblocked. Without this, Lighthouse will get
the homepage but choke on every JS/CSS chunk.

Sanity check it works:

```bash
PREVIEW="https://boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app"
curl -sI -H "x-vercel-protection-bypass: $VERCEL_BYPASS" "$PREVIEW" | head -5
# Expect 200, not 401
```

---

## Tool configs with the bypass

**Lighthouse CLI** (pass header + use the URL trick to plant the cookie):

```bash
# Easiest: put the bypass in the URL so Chrome receives the Set-Cookie
URL="$PREVIEW/?x-vercel-protection-bypass=$VERCEL_BYPASS&x-vercel-set-bypass-cookie=true"
lighthouse "$URL" \
  --preset=desktop \
  --output=html --output=json \
  --output-path=./reports/feature-payloadcms \
  --chrome-flags="--headless=new" \
  --view
```

**Unlighthouse** — config file is cleanest because you'll run it repeatedly:

```ts
// unlighthouse.config.ts
import { defineUnlighthouseConfig } from 'unlighthouse/config'

export default defineUnlighthouseConfig({
  site: 'https://boklanovv2-git-feature-payloadcms-boklanovs-projects.vercel.app',
  scanner: {
    device: 'desktop',
    samples: 3,
    throttle: true
  },
  cookies: [
    {
      name: '_vercel_jwt',
      value: '', // not needed when using bypass
      domain: '.vercel.app'
    }
  ],
  puppeteerOptions: {
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': process.env.VERCEL_BYPASS!,
      'x-vercel-set-bypass-cookie': 'true'
    }
  }
})
```

```bash
VERCEL_BYPASS=$VERCEL_BYPASS npx unlighthouse
```

**sitespeed.io** (Docker):

```bash
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io \
  --browsertime.requestheader "x-vercel-protection-bypass:$VERCEL_BYPASS" \
  --browsertime.requestheader "x-vercel-set-bypass-cookie:true" \
  -n 5 --video --visualMetrics \
  "$PREVIEW/" "$PREVIEW/work" "$PREVIEW/about"
```

**axe / pa11y** — same pattern, both accept custom headers via `--config` JSON or `chromium.launchOptions`. For pa11y:

```bash
pa11y "$PREVIEW/?x-vercel-protection-bypass=$VERCEL_BYPASS&x-vercel-set-bypass-cookie=true"
```

---

## The branch-comparison piece (the actual question)

What you really want is a diff: `feature/payloadcms` vs `main`, not absolute scores. Two clean patterns:

**Pattern A — local diff (recommended for the dev loop):**

```bash
# Audit main
git checkout main && pnpm build && pnpm start &
PID_MAIN=$!
sleep 5
lighthouse http://localhost:3000 --output=json --output-path=./reports/main.json --chrome-flags="--headless=new"
kill $PID_MAIN

# Audit feature
git checkout feature/payloadcms && pnpm build && pnpm start &
PID_FEAT=$!
sleep 5
lighthouse http://localhost:3000 --output=json --output-path=./reports/feature.json --chrome-flags="--headless=new"
kill $PID_FEAT

# Compare with jq (or any JSON diff tool)
jq -r '.categories | to_entries[] | "\(.key): \(.value.score)"' reports/main.json
jq -r '.categories | to_entries[] | "\(.key): \(.value.score)"' reports/feature.json
```

**Pattern B — Lighthouse CI with budgets** (best when this becomes a habit):

`lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/work"],
      "startServerCommand": "pnpm start",
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": [
          "error",
          {
            "minScore": 0.85
          }
        ],
        "largest-contentful-paint": [
          "error",
          {
            "maxNumericValue": 2500
          }
        ],
        "total-blocking-time": [
          "error",
          {
            "maxNumericValue": 300
          }
        ],
        "cumulative-layout-shift": [
          "error",
          {
            "maxNumericValue": 0.1
          }
        ]
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "./lhci-reports"
    }
  }
}
```

```bash
pnpm build
npx @lhci/cli@latest autorun
```

Run on `main` to lock in current numbers as the budget, then on `feature/payloadcms` to see what regresses. Wire into
your GitHub Action later and it'll auto-fail PRs.

---

## What I'd actually do today

1. Run `pnpm build` on both branches and just look at the build output diff first — Next prints route sizes and First
   Load JS. Often the regression is obvious without any audit (e.g. PayloadCMS pulling in heavy editor deps into a
   client component).
2. `ANALYZE=true pnpm build` on feature branch → look at `.next/analyze/client.html`. If PayloadCMS or its admin deps
   leaked into your public bundle (a common pitfall — admin UI should never ship to visitors), you'll see it
   immediately.
3. Set up the Vercel bypass secret (~2 min) so all the cool tools work against previews.
4. Lock in current `main` numbers as `lighthouserc.json` budgets — that becomes your regression alarm.

Want me to draft a script that runs both branches locally and outputs a side-by-side diff of the key metrics (LCP, INP,
TBT, First Load JS per route)? Or a starter `lighthouserc.json` with budgets tuned to a typical Next 15 marketing site?
