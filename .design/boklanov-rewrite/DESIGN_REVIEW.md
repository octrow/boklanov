# Design Review: boklanov.com / boklanov.ru rewrite (R1)

Reviewed against: `.design/boklanov-rewrite/DESIGN_BRIEF.md` + `DESIGN.md`
Philosophy: warm editorial (α) + brutalist metadata accents (δ)
Scope: Home, Productions index, one Production detail (`/productions/lina-marlina`), About, Press, Contact, Cmd-K, dark mode
Date: 2026-05-01
Build under review: branch `rewrite/v2`, head `6ddb466` (P3)

> **Status (2026-05-02):** R1 is fully resolved (all Must-Fix and
> Should-Fix items shipped in `73620e6` `871f287` `09d5005`). This
> document is **reference only** — kept as the historical record of
> what R1 found and how it was closed.
>
> A retrospective evaluation against this baseline ("the chrome reads
> as a generic editorial template") is captured in
> `.design/boklanov-rewrite/DESIGN_AMBITION.md`, locked 2026-05-02 as
> Phase 7.5. R1's verdict ("zero §11 anti-patterns shipped") still
> stands; Phase 7.5 adds editorial fingerprints **on top** of the R1
> baseline, it does not relitigate it.

---

## Screenshots Captured

Captured live via Chrome MCP against `http://localhost:3000` (`next dev`). Screenshots
were rendered inline during the review session for visual analysis. The `mcp__claude-in-chrome`
build of this environment did not return persistent file paths from `save_to_disk`, so
attachments are in-conversation rather than on-disk. All findings below cite the view they
were drawn from.

| Capture                                | Viewport (window) | What it shows                                                                  |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `home-ru-desktop`                      | 1280×800          | RU home: Lora wordmark, mono genre meta, Inter statement, featured strip 3-up |
| `productions-ru-desktop`               | 1280×800          | Filter chip strip + 3-up grid, including typographic-fallback card             |
| `production-detail-cover-desktop`      | 1280×800          | Full-bleed Lina-Marlina cover                                                  |
| `production-detail-titleblock-desktop` | 1280×800          | Title block, chips (`2023`, `100 MIN`), Lora-italic synopsis, photo gallery    |
| `production-detail-bottom-desktop`     | 1280×800          | Awards, press, sticky CTA (right column) at bottom of column                  |
| `about-ru-desktop`                     | 1280×800          | Lora heading, Lora lead paragraph, Inter body, mono milestones, lineage cards |
| `press-ru-desktop`                     | 1280×800          | 2-col card grid, Lora-italic article titles, mono outlet                       |
| `home-ru-dark-desktop`                 | 1280×800          | Dark mode home: soft `#0E0D0C`, photos carry colour                            |
| `cmd-k-ru-desktop`                     | 1280×800          | Cmd-K open with query "лина", grouped PRODUCTIONS / AWARDS / PRESS results    |
| `contact-ru-desktop`                   | 1280×800          | Oxblood primary "Написать Роману", mono email + COPY, Telegram + Instagram   |

> Mobile-emulated screenshots could not be produced via this MCP (window resize did not
> propagate a 375px viewport into the captured image). Mobile behaviour was instead audited
> via the responsive CSS modules, which use a clean mobile-first `min-width` cascade across
> every component reviewed. **A real-device pass remains scheduled as R2 and is the right
> place to verify the iPhone-SE 90-second curator scenario end-to-end.**

---

## Summary

The build lands the brief. Warm-editorial body, brutalist mono metadata, Lora display,
oxblood reserved, sharp corners, hairline rules — the grammar from `DESIGN.md` §3 is on
the page in every component. **Zero `DESIGN.md` §11 anti-patterns shipped.** Token
discipline is unusually clean: no hardcoded hex, no off-scale spacing, no rogue radii.

The single biggest finding is that the desktop sticky booking CTA on `/productions/[slug]`
**does not appear until the user has scrolled past most of the page**. Per brief D1
("booking magnet first") and D7 ("sticky `Email Roman about touring this show` button —
sticks to … right column on desktop"), the booking action is the load-bearing conversion;
right now a curator who lands on the cover and scans the title block on a 1280px screen
sees only empty paper to the right of the column. Mobile is correct (pinned bottom). Fix
in `app/[locale]/productions/[slug]/page.module.css:348-365`.

Second-biggest finding: the I5 *signature gesture* never shipped, and per `DESIGN.md` §13
the design contract authorises cutting it. Recommendation in this review: **cut I5
formally**. The site reads as serious and curatorial without it; adding a paper-cut or
string-line at this stage would risk the gimmick the brief explicitly warns against.

---

## Must Fix

1. **Desktop sticky booking CTA is below the fold on landing.** In
   `app/[locale]/productions/[slug]/page.module.css:348-365`, the `≥1024px` rule does
   `position: sticky; top: var(--space-7); margin-top: calc(-1 * var(--space-9));`. Because
   `.column` is a single flow with all sections stacked inside it and the CTA is the last
   child, the sticky element is anchored at the *bottom* of the column and pulled up only
   `--space-9` (96px). On a long detail page (cover, title block, chips, synopsis, gallery,
   press, awards, links) the CTA only enters the viewport after the user has scrolled past
   the gallery. That is the opposite of what brief D1 + D7 promised. _Fix: lift the CTA out
   of `.column` into a sibling on desktop, position it in a real right rail (CSS grid:
   `[content 720px] [rail 1fr]`), and make `position: sticky; top: var(--space-7);` from
   the top of the title block. Mobile behaviour (`position: fixed; bottom`) stays as is._

2. **Cover credit row sits between cover and title with no visible separation in the
   no-credit case.** When `production.poster.credit` is null (the common case — credits
   are not in the local export) the `figcaption.coverCredit` is omitted but the cover and
   title block then collide at `--space-7` only, with no rule. Compare with the title-block
   bottom rule (`border-bottom: 1px solid --rule`) — visually inconsistent. _Fix: add a
   top rule or padding-top on `.titleBlock` so the title always opens with the same
   editorial breath whether or not the credit row rendered._

---

## Should Fix

1. **Empty right column above the (hidden) CTA wastes 35–40 % of horizontal space at
   1280–1440px.** Even after fix #1 above, the right rail is unused for content. The brief
   keeps galleries and credits in the prose column, which is correct, but a vertical mono
   "spec sheet" (year · duration · ageRating · countryCode, one chip per line, brutalist
   left-aligned) above the sticky CTA would (a) give the rail a reason to exist before the
   CTA pins, (b) move the chips out of the prose column where they currently fight with
   the synopsis, (c) reinforce the "machine-like metadata" voice from `DESIGN.md` §1.
   File: `app/[locale]/productions/[slug]/page.tsx:240-258`.

2. **Filter chip groups on `/productions` read as one undifferentiated row.** The `·`
   separators between role / form / age / country groups are very subtle (`--ink-mute` at
   meta size, see `components/FilteredProductionsPanel.module.css`) and at desktop the
   four groups visually merge into a single chip strip. A curator filtering by age has to
   guess which chips are which axis. _Fix: add a small mono-caps label above each group
   (`РОЛЬ`, `ФОРМА`, `ВОЗРАСТ`, `СТРАНА`) at `--font-size-chip` in `--ink-mute`.
   This matches the labelling grammar already used by the Cmd-K palette
   (`components/CommandPalette.module.css .groupLabel`) — which is the right precedent._

3. **Native `<input type="search">` clear button leaks into the Cmd-K palette.** Chromium
   renders a default red `×` clear icon on the right of the input that does not match the
   muted palette and clashes with the oxblood focus ring. _Fix: add
   `input[type="search"]::-webkit-search-cancel-button { -webkit-appearance: none; display: none }`
   in `components/CommandPalette.module.css` (or globally in `app/globals.css` since the
   site has only one search input by design)._

4. **Featured strip on home shows LQIP-only blur for the first card in dev.** The
   "Осторожно, злая собака!!!" cover renders as the LQIP background even after the
   priority preload should have landed. Likely transient (cold `next/image` cache in dev),
   but it suggests the preload `<link rel="preload" as="image">` from `priorityFirst` isn't
   resolving fast enough on a fresh build. _Fix: re-test on a `next build && next start`
   production build before R2 to confirm this is dev-mode-only. If reproducible in
   production, audit the AVIF/WebP negotiation in `next.config.js`._

5. **Hydration warning in dev for `data-theme` on `<html>`.** Console error from
   `intercept-console-error.js` shows the server emits `<html lang="ru">` and the client
   adds `data-theme="light"` via the anti-flash inline script before React hydrates. The
   shipped layout already sets `suppressHydrationWarning` (you can see `suppresshydrationwarning="true"`
   in the rendered HTML), but the warning still fires because the diff also includes a
   browser-extension attribute (`data-lt-installed` from LanguageTool). The site behaves
   correctly — but verify in production logs that this stays a dev-only Next devtools
   warning and never surfaces in `npm run build`. No code change needed unless the same
   diff fires without the extension.

6. **ThemeToggle glyph is ambiguous.** `components/ThemeToggle.tsx` renders `●` (filled
   circle) when current theme is light, `○` (hollow) when dark. Both glyphs read as
   abstract symbols rather than "switch to dark"/"switch to light". The aria-label is
   correct ("Switch to dark mode") so screen readers are fine, but sighted users have to
   click to learn which is which. _Fix: use a lightweight inline-SVG sun (light) and moon
   (dark) at 14×14, `currentColor`, no fill — keeps the brutalist look while making the
   action legible._

7. **Production card LQIP background sits behind the typographic-fallback card too.**
   `components/ProductionCard.tsx:68-71` always assigns `coverStyle` if `lqip` is set,
   then renders the typographic fallback when `poster.src` is absent. For typographic
   fallbacks (per `DESIGN.md` §5.3 a *deliberate* treatment, not a placeholder) the LQIP
   background should not paint at all. Currently it doesn't matter because LQIP is null
   when poster.src is null, but the conditional is fragile — if a future content change
   produces an LQIP without a poster, the fallback would render over a blurry photo.
   _Fix: gate `coverStyle` on `poster.src && poster.lqip`._

---

## Could Improve

1. **Cut I5 (signature gesture) formally.** It was deferred to R1 (brief Q3, `DESIGN.md`
   §13). The site reads as quietly curatorial *without* a signature gesture; adding a
   paper-cut or string-line now would either land flat (no surrounding motion language to
   echo it) or read as gimmicky. Brief authorises the cut: *"If it tests as gimmicky in
   design review, cut it."* Recommendation: cut. Update `TASKS.md` to mark I5 as
   declined with a one-line rationale, so it doesn't haunt v2 planning.

2. **Production detail gallery is grid-2 at desktop, masonry per spec.** `DESIGN.md` §9
   says galleries are masonry with original aspect ratios. Current implementation in
   `app/[locale]/productions/[slug]/page.module.css:208-217` is `grid-template-columns:
   repeat(2, 1fr)`. Two equal columns flatten the rhythm — wide landscapes get cropped to
   the same width as tall portraits. Not blocking; a CSS-columns or `grid-auto-flow: dense`
   masonry would honour the brief.

3. **Detail page chips include `MIN` in the unit label (`100 MIN`) but year and age
   ratings are bare numerals.** Reads as inconsistent: `[18+] [2020] [90 MIN] [RU]` mixes
   suffix-units with bare-tokens. `DESIGN.md` §7.3 example also writes `[90 MIN]` so this
   is per spec, but consider lowercasing to `90 min` (chip CSS already does
   `text-transform: uppercase`, so the source can stay `90 min` and visual stays caps).
   That removes a content-vs-presentation coupling. Cosmetic.

4. **Press card "production reference" link is mono italic** in the screenshots — the
   title pull-quote is correctly Lora italic but the production reference at card-bottom
   is rendering in a mono italic style that I don't see declared in
   `app/[locale]/press/page.module.css`. Likely the global `a { text-decoration-thickness: 1px }`
   inheriting from a parent context. Worth a quick visual check on a production build.

5. **Wordmark in header has `letter-spacing: -0.015em` but home hero uses
   `var(--letter-spacing-tight)` which is the same value.** Fine — consistent — but the
   header overrides via raw value (`SiteHeader.module.css:40`) instead of the token.
   _Fix: replace `letter-spacing: -0.015em` with `letter-spacing: var(--letter-spacing-tight)`
   for token discipline parity with the rest of the codebase._

6. **About page lineage cards use `--paper-sunken` background.** Reads correctly per spec
   ("paper-sunken cards"). Borders are absent, hairlines do the work. Good. No change.

---

## What Works Well

- **Token discipline is exceptional.** Every value in every component CSS module reads
  from a `--*` custom property — `--space-*`, `--font-size-*`, `--ink`, `--paper`,
  `--accent`, `--rule`. Spot-checked all 8 component modules and 4 page modules — fewer
  than 5 hardcoded values across ~1100 lines of CSS, and most of those are intentional
  (e.g. mobile gallery `gap`).

- **Anti-pattern audit: zero violations.** No glassmorphism (no `backdrop-filter`), no
  AI-purple (single `--accent` is `#6B0F0F`), no `rounded-2xl shadow-xl` (max radius is
  2px on chips, max shadow is `--shadow-sm` on the mobile sticky CTA), no hero video, no
  bento grid, no kinetic gradient text, no Comic-Sans-as-irony, no animated-forever
  spinners (LQIP blur-up replaces them per I4).

- **Typography lands the brief.** Lora at 500 for display reads warmly in both Cyrillic
  and Latin; the Cyrillic Lora cuts in particular have the "transitional, calligraphic
  warmth" the brief recommended. JetBrains Mono for metadata is the right brutalist
  tilt without going pastiche. Inter body at 17–18px on `--max-width-prose: 65ch`
  reads cleanly. The unicode-range subsetting in `app/globals.css` is meticulous.

- **Dark mode is warm, not inverted.** `#0E0D0C` paper, `#E8E5DD` ink, `#A82626` lifted
  oxblood — all per `DESIGN.md` §5.4. The anti-flash inline script in the layout `<head>`
  prevents FOUC. The "every value in CSS variables, never hardcoded hex" discipline pays
  off here: switching theme is one `data-theme` attribute change with zero per-component
  overrides needed.

- **Press page nails the EPK feel.** Lora-italic article titles as pull-quotes, mono
  outlet attribution falling back to URL host, hairline-only borders, two-column grid
  that breathes — a press jury opening this gets exactly the curatorial frame the brief
  asked for.

- **About page editorial layering.** Lora display heading, Lora lead paragraph, Inter
  body for the rest, mono milestones row, paper-sunken lineage cards. Three voices in
  one column without any of them shouting. The 65ch reading measure is honoured.

- **Cmd-K palette transliteration works in practice.** Typing Cyrillic "лина" surfaces
  the production, an award (TEENS WEEKEND attached to it), and press reference — all in
  one keystroke set. Group labels in `--font-size: 10px; letter-spacing: 0.1em;
  uppercase; --ink-mute` are exactly the right brutalist register.

- **Focus discipline.** The unified `--shadow-focus` ring (paper gap + oxblood) lands on
  every interactive element I tabbed through. `:focus-visible` only — no permanent
  outlines, no AI-default neon glow. P2 accessibility commit clearly held.

- **Touch targets per CSS audit.** Filter chips, mobile nav links, locale links in the
  drawer, the contact CopyEmailButton, the home "view all →", the productionGrid empty
  reset — all `min-height: 44px`. P1 commit held.

- **Footer is quiet.** Three columns of mono links, copyright, no megaphones, no
  "Built with Next.js", no newsletter modal. `DESIGN.md` §11 holds.

- **Sharp corners, hairline rules, sharp images.** The newspaper-grade rhythm
  `DESIGN.md` §3 promised is on every page.

---

## I5 (Signature Gesture) — formal decision

**Decision: cut.**

Rationale:

- The brief explicitly authorises cutting it (`DESIGN.md` §13: *"If it tests as gimmicky
  in design review, cut it"*).
- The build reads as quietly curatorial without it. Adding motion on first paint risks
  reading as a SaaS marketing flourish — the exact AI-default register the brief warns
  against in `DESIGN.md` §3 ("Voice → Curatorial, quiet, declarative; not Promotional,
  hyped, exclamation-heavy").
- The site has *one* place where it's allowed to delight (`DESIGN.md` §8.3). Spending it
  on a paper-cut at the home-page first paint pre-commits us to a flourish before we know
  what the home page actually needs in v2 (DE bios, Roman's photo credits, audio).

Action: update `.design/boklanov-rewrite/TASKS.md` `I5` row from `[ ]` to `[~]` (declined)
with a one-line rationale linking to this review.

---

## Anti-pattern compliance (DESIGN.md §11) — line by line

| Anti-pattern                                       | Observed? | Notes |
| -------------------------------------------------- | --------- | ----- |
| AI-purple / pink gradients                         | No        | Single accent is `#6B0F0F` oxblood |
| Glassmorphism / neumorphism / claymorphism         | No        | No `backdrop-filter`, no soft 16px radii |
| AI-Native UI chips, animated gradient text         | No        | Chips are `--font-size-chip 11px`, mono caps, sharp 2px |
| Hero video backgrounds                             | No        | Type-led wordmark hero |
| Bento grids on home                                | No        | Featured strip is plain 3-up grid; below-fold is filterable grid |
| Tailwind defaults (`rounded-2xl shadow-xl`)        | No        | Max radius 2px on chips, max shadow on mobile CTA only |
| Stock photography                                  | No        | Production photos throughout |
| Comic-Sans irony, "puppet show" pastiche           | No        | Lora / Inter / JetBrains Mono only |
| Animated-forever spinners                          | No        | LQIP blur-up replaces skeletons (I4) |
| Bottom-20% cookie banner                           | No        | No banner |
| Newsletter modal on first visit                    | No        | No modal |
| "Built with Next.js" in footer                     | No        | Footer is nav · social · copyright only |
| Coloured chip pills (status colours on chips)      | No        | Chips are `--paper-sunken` background, no hue |
| Drop-shadow glow / neon focus                      | No        | Focus is paper gap + oxblood ring only |
| Coloured headers with white text                   | No        | Header is `--paper` with hairline below |

All clean.

---

## Goal-backward check

The brief's #1 user is a festival curator, RU-speaking, opening the link from an
Instagram DM on mobile, in 90 seconds, who needs to:

1. Understand what kind of theatre Roman makes.
2. See 2–3 productions they could request video for.
3. Find a contact method that is not Instagram.

| Goal                                       | Status                              | Notes |
| ------------------------------------------ | ----------------------------------- | ----- |
| 1. Understand the work                     | ✓                                   | Hero meta says it (`режиссёр · театр кукол · театр объекта`); statement says it again in prose |
| 2. See 2–3 productions, framed by identity | ✓                                   | Featured strip is the 6 hand-curated featured cards from top-coverage productions (per DESIGN §9) |
| 3. Reach a non-Instagram contact           | ✓ on mobile, **flagged** on desktop | Mobile sticky CTA is correct. Desktop CTA is below scroll fold (Must-Fix #1). Header has no contact link by design — relies on the sticky CTA *or* curator clicking through to /contact. After fix #1, this is solid. |

---

## Recommended R1 → R2 hand-off

Before R2 (real-device manual QA):

1. Land the desktop right-rail fix (Must Fix #1) — the only blocking finding.
2. Land the cover/title separation fix (Must Fix #2) — small.
3. Land Should-Fix #2 (filter group labels) — has the highest impact-per-line on
   /productions usability for the curator persona.
4. Decide on Should-Fix #6 (theme-toggle glyph) — small but each pass on the site goes
   through that toggle so it's worth doing now.
5. Cut I5 in `TASKS.md`.
6. Run `npm run build && npm run start` and re-check Must-Fix items + Should-Fix #4
   (LQIP/preload race) on a production build before handing to Roman for R2.

Everything else (Could-Improve list) can move to a v2 polish backlog.

---

_Reviewer: Claude Opus 4.7 (1M context)._
_Source-of-truth chain held: DESIGN_BRIEF.md → DESIGN.md → tokens.css → app/globals.css._
_R1 status: complete with two Must-Fix items and one decision (cut I5)._
