# AI Tools for Critiquing an Existing UI/UX Design in 2026: A Practical Guide for boklanov.com

**TL;DR**

- For a free, no-Figma, URL-or-screenshot critique of a content-driven theatre portfolio, your three best starting
  points are: **(1) Attention Insight** (14-day no-card trial → ~5 free credits/month thereafter; URL + Chrome
  extension, real predictive heatmaps), **(2) UX Pilot's Design Review + Predictive Heatmap** (one-time ~90 free
  credits / ~15 screens; works on uploaded screenshots), and **(3) Claude Sonnet 4.x or GPT-5 with vision + a structured
  Nielsen/heuristics prompt** (effectively unlimited via the free chat tier, and surprisingly competent for
  editorial/cultural sites where conversion-optimization tools are a poor fit).
- "Pure AI critique" tools are concentrated on heatmaps (Attention Insight, Brainsight, Neurons, Hostinger) and
  design-review bots (UX Pilot, Uizard's Focus Predictor). Most have either a permanent thin free tier (5–15 free
  analyses) or a 7–14-day trial; none give unlimited free output. Several "free" tools require a credit-card-free signup
  but lock useful features (white-label PDFs, AOI, accessibility) behind paid plans.
- For a theatre director's portfolio (productions, photos, tour dates, editorial copy) you should explicitly **avoid
  CRO/e-commerce-tuned tools like Baymard UX-Ray and WEVO Pulse-tuned-for-funnels**, and instead lean on (a)
  attention/clarity heatmaps for visual-hierarchy gut-checks, plus (b) an LLM-with-vision running a curated heuristics +
  editorial-design prompt, because that combination is what evaluates "is the work legible and emotionally clear?"
  rather than "is this a high-converting checkout?"

---

## Key Findings

### 1. Top 3–5 recommended tools, ranked for boklanov.com

**Rank 1 — Attention Insight (attentioninsight.com)**
The most mature pre-launch attention-prediction tool that genuinely works on a live URL (not just Figma). It accepts URL
input directly, has a Chrome extension that solves lazy-load problems on real sites, plus a Figma plugin you don't need.
Output: AI heatmap (warm/cold attention map), Clarity Score (0–100 vs. a benchmark of top sites), Focus Map (what is
noticed in the first 4 seconds), Percentage-of-Attention on user-defined Areas of Interest (AOIs), Contrast Map, and a "
Vision-LLM" AI Recommendation feature. Free tier: 14-day trial with full features and **no credit card required**, and
per multiple secondary sources a small permanent free allotment (~5 credits/month) thereafter — though this is not
advertised on the official pricing page, so treat it as "trial → paid." 1 credit = 1 image OR 1 URL (up to 3
viewports/sections) OR 1 AI recommendation. Paid plans start ~€23/mo. Caveats: long pages get sliced into 3-viewport
chunks rather than analyzed end-to-end, and free/lower-tier PDF reports carry "Attention Insight" branding. Strength for
your use case: it gives concrete evidence about whether the _photos_ and _production headlines_ on the homepage are
actually the first things noticed, and where the navigation falls in the visual order — exactly the questions a theatre
portfolio needs answered.

**Rank 2 — UX Pilot Design Review + Predictive Heatmap (uxpilot.ai)**
UX Pilot is primarily an AI design _generator_, but it bundles two useful _critique_ features: an automated Design
Review Bot (heuristics, contrast, spacing, accessibility flags, written critique against a scope you define) and a
Predictive Heatmap. It does not natively pull a live URL — you upload a screenshot or paste an image — but that's
exactly what you want for an MDX/Vercel site you can full-page-screenshot with GoFullPage or Awesome Screenshot. Free
tier: a one-time grant of **~90 credits / ~15 screens** that does _not_ replenish; this is enough to review a homepage,
a production-detail page, an "About," and a tour-dates page once or twice each. Pro tier $22/mo (or $14 entry tier per
some listings). Output: written, structured critique organized around objectives you specify, plus a 0–1 attention
heatmap. Strength: the design review _report_ is the closest thing to a written UX audit on this list, and the
chat-based refinement lets you ask follow-ups ("how does the photo grid hold up in mobile?"). Weakness: marketing skews
to SaaS/CRO use cases, and the credits can deplete faster than expected if you use the heatmap and review on the same
page.

**Rank 3 — Claude (Sonnet 4.x / Opus) or ChatGPT (GPT-5) with Vision + a Heuristics Prompt**
This is the most underrated path and the one we'd actually start with. Both Claude and ChatGPT accept full-page
screenshots; both have free tiers (Claude Free gives ~30 messages/day with vision on the smaller model; ChatGPT Free
includes GPT-5 with image upload, with usage limits). Pasted with a Nielsen-style structured prompt (see prompt below),
they produce a written critique covering visual hierarchy, clarity-in-5-seconds, consistency, contrast, CTA clarity,
accessibility flags, and editorial tone — which is what your site actually needs. Independent third-party studies (
Microsoft UX researchers, March 2025; Baymard, Feb 2026) found general-purpose LLMs hit only **50–75% accuracy** on
heuristic evaluations _vs. expert human auditors_, and Baymard's earlier test found GPT-4 at just 20%. So treat output
as a _first-pass screening_ and not a final audit, but for a single-author portfolio site that is _exactly_ the right
level. Claude 4.5 Sonnet is consistently ranked stronger for visual/aesthetic reasoning and prompt-following than GPT-5
in head-to-head 2025–26 comparisons; Gemini 3.x is best for fast bulk image work. Strength: free, unlimited iterations
within daily quota, works on URL via the LLM's browse mode (Claude with Computer Use, ChatGPT with browsing) _or_ on
uploaded screenshots, and adapts to a _cultural/artistic_ brief better than any conversion-tuned tool. Weakness: no
real "heatmap" — the LLM cannot predict eye-tracking, only reason about hierarchy.

**Rank 4 — Brainsight (brainsight.app) — backup heatmap option**
Direct alternative to Attention Insight, with a similar AI-eye-tracking approach (heatmaps, gaze plots, Clarity Score,
benchmarking). Free trial: 14 days, full features, **no credit card**, auto-ends without cancellation. URL or screenshot
upload. Useful if Attention Insight's trial has been used, or if you want a second opinion on the same homepage. No
persistent free tier announced.

**Rank 5 — Uizard Focus Predictor (uizard.io)**
Uizard's Focus Predictor and "Feedback" feature underline elements that work or need improvement and generate an
attention heatmap. Free tier exists but is _very_ tight: **3 AI generations per month**, 2 active projects, 5 screens
per project. The Focus Predictor itself counts against generations. Imports support screenshots. Lower priority for your
use case because Uizard is primarily a generator; the critique features feel grafted on, and the free quota is exhausted
in one sitting.

**Honorable mentions (and why they didn't make the top 5):**

- **WEVO Pulse** — accepts live URLs and produces structured AI-user-feedback in 10–15 minutes, with sentiment maps and
  key findings. Free trial: 3 credits over 7 days, no credit card. Genuinely interesting, but framing is heavily
  conversion/marketing-funnel, which is a poor match for a theatre portfolio. Worth one free pulse to confirm it's
  mismatched.
- **Hostinger AI Heatmap** — free with a tight cap, screenshot-only, basic attention map, no heuristics or written
  critique. Fine for a single sanity check, weak overall.
- **Maze AI** — focused on prototype + live-website _user testing_ (real participants) with AI analysis; the free tier
  is 1 project / 3 blocks and AI-moderated interviews are paid-only. Wrong tool for "AI critique" — it's a
  panel-recruiter platform.
- **Neurons AI / Neurons Predict** (which absorbed VisualEyes/Loceye in Jan 2023 — those products no longer exist
  standalone) — strongest accuracy claims (~95%) and Figma-first, but enterprise sales (~$5,000/year, no public free
  tier). Not viable for free use.
- **Google Stitch (formerly Galileo AI)** — free with high generation caps but is a UI _generator_, not a critic. No
  critique/review mode. Skip for this task.
- **Baymard UX-Ray 2.0** — 95% claimed accuracy heuristic AI, but trained on e-commerce conversion patterns and locked
  to subscription. Wrong fit, and not free.
- **GPT Store "Website Critic" custom GPTs** (yeschat.ai, aichatonline.org wrappers) — accept URL or screenshot but are
  thin wrappers around GPT-4-class vision; quality varies wildly, output often generic. Use only as a quick second
  opinion.
- **Heurix (heurix.io)** — free, structured heuristic-evaluation _form_; you fill it in yourself guided by
  Nielsen-Norman heuristics. Not AI, but genuinely free and produces a shareable PDF. Useful as a complement, not a
  replacement.
- **RUXAILAB (github.com/ruxailab/RUXAILAB)** — open-source self-hosted usability/heuristic eval platform. Requires
  running it yourself; not AI-powered critique, more a survey/test platform. Mention only if self-hosting is a hard
  requirement (it isn't, given the user's stack).

### 2. Free-tier comparison table

| Tool                                  | Input                                             | Free tier specifics                                                                                                                   | Credit card?     | Output                                                                                              | Live in 2026? |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- | ------------- |
| **Attention Insight**                 | URL, screenshot, Chrome ext., Figma plugin        | 14-day full-feature trial; ~5 credits/month after (per third-party reports; not on official page). 1 credit = 1 URL up to 3 viewports | **No**           | AI heatmap, Clarity Score, Focus Map, AOI %, Contrast map, AI Recommendations, branded PDF          | Yes           |
| **Brainsight**                        | URL, screenshot, video                            | 14-day full-feature trial, auto-expires                                                                                               | **No**           | Heatmap, gaze plot, Clarity Score, benchmarks                                                       | Yes           |
| **UX Pilot Design Review + Heatmap**  | Screenshot upload (image-to-design); Figma plugin | One-time ~90 credits / ~15 screens, **does not replenish**                                                                            | No (free signup) | Written design-review report (heuristics, contrast, accessibility, layout) + 0–1 predictive heatmap | Yes           |
| **Uizard Focus Predictor + Feedback** | Screenshot, hand-sketch import                    | 3 AI generations/month, 2 projects, 5 screens/project                                                                                 | No (free signup) | Annotated underline feedback + attention heatmap, one screen at a time                              | Yes           |
| **WEVO Pulse**                        | URL, image, PDF, Figma link                       | 3 credits over 7 days; 1 credit = 1 study                                                                                             | **No**           | Scored UX feedback, sentiment map, key findings, recommendations                                    | Yes           |
| **Hostinger AI Heatmap**              | Screenshot only                                   | A "limited number" of free uses (not specified); requires Hostinger account                                                           | No               | Color-coded attention heatmap                                                                       | Yes           |
| **Maze AI**                           | Prototype, live URL (paid), survey                | Free: 1 project, 3 blocks, AI features mostly paid-only                                                                               | No               | User-test reports (with real participants on paid; AI summaries)                                    | Yes           |
| **Google Stitch (Galileo AI)**        | Prompt, sketch, screenshot                        | Free, ~350 generations/mo Standard / 50–200 Experimental                                                                              | No               | UI _generation_ (not critique)                                                                      | Yes           |
| **Neurons AI / Predict**              | Image, URL, Figma plugin                          | No public free tier; quote-only enterprise (~$5K/yr starting)                                                                         | N/A              | Heatmap, fog map, AOI, Cognitive Demand, Engagement, Memory scores                                  | Yes           |
| **Claude (Free)**                     | Screenshot upload, URL via web tools              | ~30 messages/day with Sonnet vision; quota varies                                                                                     | No               | Written, structured critique (heuristics, hierarchy, copy, accessibility)                           | Yes           |
| **ChatGPT (Free)**                    | Screenshot upload, URL via browse                 | Daily message limits on GPT-5 vision; falls back to smaller model when exceeded                                                       | No               | Same as Claude; somewhat weaker on aesthetic nuance per 2025–26 comparisons                         | Yes           |
| **Gemini (Free)**                     | Screenshot upload, URL via browse                 | Generous daily quota on Gemini 3 Pro/Flash                                                                                            | No               | Strong on aesthetics & speed; weaker structured-critique adherence                                  | Yes           |
| **Heurix (heurix.io)**                | None — manual scoring guided by tool              | Fully free                                                                                                                            | No               | PDF heuristic-evaluation report you fill in                                                         | Yes           |
| **VisualEyes by Loceye**              | —                                                 | **Discontinued Jan 31, 2023** — folded into Neurons AI                                                                                | —                | —                                                                                                   | **No**        |

### 3. Using general LLMs with vision — what to expect, and the prompt to use

For a content-driven, artistic site like boklanov.com, **the LLM-with-vision path is the single most cost-effective
option** and is genuinely useful — _if_ you brief it correctly. Quality expectations, calibrated against published
research:

- **What it does well:** clarity-of-purpose check ("can a first-time visitor understand this is a theatre director's
  site within 5 seconds?"), reading-order critique, copy/microcopy review, navigation labelling, alt-text and
  accessibility flags from visible cues, contrast-by-eye, and — uniquely — _editorial tone_ feedback that
  conversion-optimization tools cannot produce. Claude in particular is strong at picking up subtle inconsistencies in
  spacing/typography/tone across uploaded screenshots and at reasoning about emotional/aesthetic fit for a cultural
  brand.
- **What it does badly:** it **cannot predict eye-tracking** (no real heatmap), it cannot reliably measure precise
  contrast ratios from a screenshot (give it the actual hex values), and Microsoft and Baymard research from 2025–26
  show **50–75% accuracy on heuristic evaluations vs. human experts** — which means roughly 1 in 3 of its findings will
  be off-base. So treat the output as hypotheses to verify, not a finished audit.
- **Best practices:** (1) Upload a _full-page_ screenshot rather than the visible viewport — use GoFullPage, Awesome
  Screenshot, or `microlink.io/tools/website-screenshot` (free, 50/day). (2) Give the LLM a persona for the _user_ (not
  just the site), e.g. "a theatre programmer evaluating whether to invite this director" or "a parent deciding if a show
  is appropriate for their child." (3) Run the same prompt on Claude _and_ ChatGPT and look for overlap — overlap =
  high-confidence findings. (4) Avoid asking it to "redesign" — that wastes the critique signal.

**A community-vetted prompt that works (adapted from the Balsamiq/Nielsen pattern and Anthropic's design-critique
prompts):**

> You are a senior UX critic specialising in cultural and editorial websites (theatre, museums, artist portfolios). I
> will give you full-page screenshots of a website for **Roman Boklanov, a theatre director working in puppet theatre,
> theatre of objects, and contemporary theatre for kids/teens/family**. The site is a Next.js 15 statically-generated
> MDX-based portfolio, not an e-commerce or SaaS product.
>
> Evaluate the screenshots through these lenses, in this order:
>
> 1. **Five-second test** — what does a first-time visitor understand about who this is and what kind of work this is?
> 2. **Visual hierarchy** — what does the eye see 1st / 2nd / 3rd? Is that the right order for a director's portfolio?
> 3. **Editorial / cultural fit** — does the typography, image treatment, whitespace and tone feel appropriate for an

     artistic theatre director, or does it feel SaaS / template / generic?

> 4. **Nielsen's 10 usability heuristics** — for each, note 1 strength and 1 issue, only if relevant.
> 5. **CTA clarity** — how clear are the next steps (view production, contact, tour dates)?
> 6. **Accessibility flags visible from the screenshot** — contrast, font sizes, focus indicators, alt-text needs.
> 7. **Concrete prioritised recommendations** — top 5, ranked by impact, each ≤ 2 sentences.
>
> Be specific. Avoid generic advice. If you can't tell from the screenshot, say so.

Run this in Claude first; re-run in ChatGPT or Gemini for a second opinion. Disagreements = items to investigate;
agreements = items to fix.

### 4. Cultural / editorial vs. SaaS-tuned tools — an important warning

Most of the AI heatmap tools (Attention Insight, Neurons, Brainsight, WEVO Pulse, UX-Ray) are explicitly trained and
benchmarked on **conversion-rate optimisation** — they want your CTA to win the eye, your "Add to Cart" to dominate,
your funnel to flow. For a theatre director's site, the _correct_ answer to "where should the eye go first?" is often a
production photo, not a button. Trust the heatmaps as _descriptive_ (where does the eye actually go?), not
_prescriptive_ (the AI scoring "premium offer needs more attention" is meaningless for your use case).

We could not find any AI critique tool specifically trained for cultural/editorial websites. The closest substitute is
the LLM-with-vision approach above with the cultural-context persona baked into the prompt; second closest is **Heurix
**, which is generic enough to be domain-neutral (it's not trying to sell you conversion uplift).

### 5. Open-source / self-hosted

There is **no good open-source AI tool that does what Attention Insight or UX Pilot does for free, self-hosted, in 2026.
** RUXAILAB is the most-cited open-source heuristic-evaluation platform but it's a survey/test runner, not an AI critic.
Andrew Warr's blog post (LinkedIn, 2024) showed the OpenAI Vision API can be wired into a custom Nielsen-heuristics
evaluator in ~50 lines, and the Claude/Anthropic Cookbook ships a "design-review" Skill — these are the realistic DIY
paths if you ever need to run this at scale on private content. For a one-site review, they're overkill.

---

## Details — what each tool actually outputs

- **Attention Insight** outputs are PNG/PDF deliverables: a coloured attention heatmap overlaid on the screenshot (red =
  high attention, blue = low), a Focus Map highlighting only what is noticed in the first 4 seconds, a numeric Clarity
  Score 0–100 benchmarked against the top 170 Alexa sites, AOI percentage breakdowns, and a Vision-LLM written
  recommendation that addresses CTA, attention distribution, contrast and colour — re-runnable on the same image without
  using a new credit. Long pages are sliced into 3-viewport sections; you analyse them separately.
- **UX Pilot Design Review** delivers a _written_ report against a scope you define (e.g. "review visual hierarchy,
  navigation, and accessibility"), section-by-section with strengths and issues; the Predictive Heatmap is a separate
  action that produces a 0–1 colour-coded overlay. Both can be done from an image upload (no Figma required).
- **Brainsight** delivers AI heatmaps, gaze plots (an estimated scan path), Clarity Score, and side-by-side benchmark
  comparisons. Output format is shareable web links + PDFs.
- **WEVO Pulse** delivers a Sentiment Map (areas of the page coloured by simulated sentiment), Key Findings, and
  audience-segmented insights with custom-question support. Strong if your site sold tickets; less strong for editorial.
- **Uizard Focus Predictor** outputs an attention heatmap and inline annotations on a single screen at a time.
- **Hostinger AI Heatmap** outputs a single attention heatmap PNG, no scoring, no recommendations. Functional but thin.
- **Claude / GPT-5 / Gemini with vision** output structured Markdown critiques sized to your prompt — typically
  800–1,500 words per page screenshot, with prioritised recommendations. No image overlays.

### Free-tier honesty notes (the things vendors don't emphasise)

- **Attention Insight** advertises "free 14 days no credit card," but the much-publicised
  permanent-free-with-5-credits/month tier shows up only on third-party deal-coupon sites; we can't verify it is
  currently on the official pricing page (which lists trial → paid only). Assume worst case: a 14-day free window.
- **UX Pilot Free** credits are a **one-time grant**. They do not refresh. Once the 90 credits are gone, you must pay or
  move on.
- **Uizard Free** is genuinely usable but extremely limited (3 generations/month). Many G2/Product Hunt reviewers
  reported feeling "scammed" after upgrading and finding output generic — keep paid-tier expectations low.
- **WEVO Pulse Free** is 3 credits / 7 days. After day 7 you must subscribe; emails will start arriving.
- **Hostinger AI Heatmap** requires a Hostinger account and the free quota is undeclared — Hostinger is primarily a
  hosting upsell.
- **Neurons AI** does not have a free tier despite a Figma-plugin marketing page suggesting otherwise; expect an
  enterprise sales call.
- **Maze "Free"** plan locks AI-moderated interviews and the participant panel behind Enterprise; it is effectively a
  freemium shell.
- **Claude / ChatGPT / Gemini "Free"** all have daily message caps that trigger silent fallback to weaker models — the
  difference between Claude Sonnet and Claude Haiku output quality on a UI critique is large; check which model you're
  actually on.

---

## Recommendations — what the user should actually do for boklanov.com

**Step 1 (today, 30 minutes, $0):** Take three full-page screenshots — homepage, one production-detail page, and the
tour-dates / contact page — using GoFullPage (free Chrome extension). In a fresh Claude conversation (free tier is fine
for one pass; Claude Pro if available is better), paste the cultural-context prompt above and attach all three
screenshots. Save the response. Run the same prompt in ChatGPT (GPT-5 vision). Diff the two responses — anything both
flag is a high-confidence finding.

**Step 2 (today, 30 minutes, $0):** Sign up for **Attention Insight** with the 14-day no-credit-card trial. Run the
homepage and the most photo-heavy production page through both the URL flow (Chrome extension, to handle Vercel's
lazy-loaded images) and the screenshot upload flow. Compare the heatmap to where you _intended_ visitors to look first.
The Clarity Score gives you a directional benchmark vs. top sites. Use the AI Recommendations sparingly (each = 1
credit). Export branded PDFs while the trial is live.

**Step 3 (this week, 30 minutes, $0):** Run the same homepage screenshot through **UX Pilot's Design Review** (image
upload → "Review" tab) with a scope statement like "Evaluate this theatre-director portfolio for visual hierarchy,
navigation clarity, accessibility flags, and editorial tone — this is not e-commerce." This will give you the closest
thing to a written third-opinion audit, on a one-time but no-card-required free credit pool.

**Step 4 (optional second opinion, 30 minutes, $0):** If Attention Insight's trial has expired or you want a second
heatmap, run **Brainsight** (14-day no-card trial). Treat it as confirmation/disconfirmation of Attention Insight's
findings.

**Step 5 (only if Steps 1–3 don't cover it):** Pay for one month of Attention Insight (~€23) to get unbranded PDFs and
more URL credits, _or_ one month of UX Pilot Standard ($14–19) for replenishing review/heatmap credits. Do not commit
annually until you've completed two full review cycles.

**Decision thresholds:**

- If Steps 1–3 produce ≥3 overlapping high-confidence findings (e.g., LLM + Attention Insight both say "the production
  navigation is buried"), act on those first; you've gotten 80% of the value for $0.
- If the LLM critique and the heatmaps _disagree_, trust the heatmap on attention/visual-weight questions and trust the
  LLM on copy/tone/clarity questions. They measure different things.
- Skip Neurons, Baymard UX-Ray, and Maze entirely — wrong fit, wrong price, wrong domain.
- Re-evaluate this stack only if (a) you redesign substantially, in which case re-run Step 1; or (b) you add
  e-commerce (ticket sales), at which point WEVO Pulse and CRO-tuned tools become genuinely useful.

---

## Caveats

- Vendor pricing and free-tier mechanics in this category change frequently; Attention Insight in particular has shifted
  its free-tier wording multiple times in 2024–2026. Verify the trial terms on the official pricing page before signing
  up.
- The "AI heatmap" category measures _predicted_ attention based on saliency models trained on real eye-tracking
  datasets (5.5M+ fixations for Attention Insight; comparable for Neurons/Brainsight). Independent validation studies
  cite 90–96% correlation with real eye-tracking on benchmark images, but accuracy degrades on unusual layouts, very
  long pages, and motion/video — use heatmaps as directional, not definitive.
- LLM-with-vision accuracy on heuristic evaluations is published at 50–75% (Microsoft UX research, March 2025) and
  historically as low as 20% (Baymard, GPT-4 era, 2023). 2026 frontier models (Claude 4.5/Opus, GPT-5, Gemini 3 Pro)
  almost certainly perform better than the published numbers but no peer-reviewed 2026 benchmark exists yet. Treat all
  AI critique as a _first pass_ that should still be reviewed by a human with UX experience before you act on structural
  changes.
- VisualEyes/Loceye was discontinued on January 31, 2023; any 2024+ guide that still recommends it is out of date. Its
  functionality is now inside Neurons AI.
- We did not find a single AI critique tool specifically tuned for cultural/editorial/portfolio websites in 2026; the
  gap is real and the LLM-prompt workaround is the current best practice for that domain.
- "Free tier requires no credit card" is not the same as "free tier is useful": Uizard's 3 generations/month and
  Hostinger's undeclared cap are both technically free but functionally too restricted to complete a real site review.
  Plan accordingly.
