# Design review workflow — boklanov.com

Free, repeatable UI/UX critique using the existing Claude subscription. No new tools, no new dependencies. Two execution paths — pick by context.

Output of every run lands in `.design/review/<YYYY-MM-DD>-<slug>/REPORT.md` and the screenshots that fed it. Reports are kept in-repo so we can diff between v3 fix-passes.

The calibrated prompt lives in `PROMPT.md`. Treat it as the source of truth — do not rephrase it inline; edit the file if the brief drifts.

## Pages to cover (default sweep)

A full review run covers six URLs at two viewports each (desktop 1440 + mobile 390). Skip pages only when the change being reviewed is scoped.

| Slug        | URL                                          | Why it matters                                               |
| ----------- | -------------------------------------------- | ------------------------------------------------------------ |
| home        | `/en`                                        | 5-second read; Plakat hero + featured strip §11 unfreezes    |
| productions | `/en/productions`                            | Grid discipline (no bento, equal-cell ban); duotone-off gate |
| production  | `/en/productions/cow-on-ice` (or any active) | Editorial fingerprints (slate-strike, credits, tour band)    |
| about       | `/en/about`                                  | SpecimenPlate gallery, photographic plate caption discipline |
| contact     | `/en/contact`                                | Booking CTA findability; mailto-only is correct              |
| archive     | `/en/archive`                                | Long-form scan; hairline rule discipline                     |

For locale-specific copy regressions, repeat the sweep on `/ru` and `/de`.

## Path A — In-CLI (recommended)

For most reviews. Zero deps, runs inside this Claude Code session, uses the Chrome MCP tools to navigate and screenshot. ~5–10 minutes per page.

1. **Make sure dev server (or prod) is reachable.** For uncommitted work: `npm run dev` then point at `http://localhost:3000/en`. For shipped work: `https://boklanov.vercel.app/en`.
2. **Ask Claude in this CLI:**
   > Run a design review of `<URL>` using `.design/review/PROMPT.md`. Capture full-page screenshots at 1440 and 390 viewports, save them to `.design/review/<today>-<slug>/`, and write the report to `REPORT.md` in the same folder.
3. Claude opens the URL via Chrome MCP, resizes the window, captures full-page screenshots, fills in the **Page under review** block of `PROMPT.md`, runs the prompt against its own vision, and writes `REPORT.md`.
4. Skim the report. Promote any **[fix]**-tagged finding to a phase task (or `gsd:add-todo`). **[polish]** items go to a polish-pass batch. **[strategic]** items stay as DESIGN.md follow-up notes.

## Path B — claude.ai web (fallback)

Use when the in-CLI Chrome MCP isn't available, or when you want a separate model context for cross-checking a Path A result.

1. **Capture screenshots manually.** GoFullPage (Chrome extension) gives full-page PNGs. Take desktop 1440 + mobile 390 (DevTools device toolbar) for each page in the sweep.
2. **Save them** to `.design/review/<today>-<slug>/` so the report can reference them by filename.
3. **Open claude.ai in a fresh chat.** Drag the screenshots in, then paste the contents of `PROMPT.md` _after_ filling in the **Page under review** block at the bottom.
4. **Save the response** to `.design/review/<today>-<slug>/REPORT.md`.

For high-stakes phases, run the same screenshots through a second model (ChatGPT GPT-5 vision, or Gemini 3 Pro). Findings flagged by both = high confidence; disagreements = investigate manually.

## When to run

- **Before a §11.x acceptance gate** — full sweep. The gate decision should cite the report.
- **After a v3 fix-pass that touches visible CSS** — narrow to the changed routes.
- **Before any pre-deploy push to `boklanov.vercel.app`** — at least the home + a production-detail.
- **Quarterly drift check** — full sweep on prod, even if no changes were shipped, to catch DESIGN.md / `globals.css` drift.

## What this workflow is _not_

- Not a heatmap. We deliberately skipped Attention Insight / Brainsight / UX Pilot. They are CRO-tuned and benchmark against "did the CTA win the eye?" — wrong question for an editorial portfolio. If we ever add ticketing, revisit.
- Not eye-tracking. The LLM cannot predict gaze fixations; treat hierarchy findings as reasoning, not measurement.
- Not a substitute for a human design review of a phase. Use this as the first-pass screening before showing the work to someone who has seen the brief — research puts LLM-vision heuristic accuracy at ~50–75% vs expert humans, so ~1 in 3 findings will be off-base. The win is throughput, not authority.

## Cost

- Path A: subscription only (no per-call billing on Claude Code).
- Path B: subscription only (claude.ai daily message cap).
- No third-party tool signups, no credit cards, no expiring trials.
