# Design review session prompts (2026-10-06)

Two prompts: one to compact the current session, one to resume the `/impeccable` design work on boklanov in a fresh
or compacted session.

---

## 1. `/compact` instructions

Paste after `/compact `:

```text
Keep for the boklanov /impeccable design work:

1. State: the Keystatic → Payload cutover is done (prod = main on Vercel boklanovs-projects/boklanov_v2, Neon branch
   `production`). I work solo and commit straight to main, then verify on boklanov.com after the Vercel deploy.
2. Decisions by the user (2026-10-06):
   - PRODUCT.md is written. The primary user is an EU curator on a phone with a 90-second session; priority is
     invitation > EPK > archive.
   - Contact: Telegram and Instagram stay primary, email is secondary. Do not restyle /contact.
   - Press and awards are fully translated on EN pages. DE completeness is undecided.
   - Lowercase page H1s and the "2026 EDITION" footer stay (DESIGN.md register).
   - Gallery photos missing in R2 are hidden on the site and their rows stay in the admin.
3. Site critique snapshot: .impeccable/critique/2026-10-05T20-35-48Z__app-locale.md, scored 20/32 (Acceptable),
   3×P1. All of its plan is shipped:
   - layout home: invite line under the tagline plus an invite band after featured.
   - harden productions: no tickets CTA for RU theatres, undated archive rows sort last, [locale]/[...rest] → themed 404.
   - harden i18n: scripts/fill-array-locales.ts restored 184 RU/EN values lost by the seed (applied on prod by the
     user via ops/2026-10-06-fill-array-locales.sh); form-tag labels; EN/DE taglines say "families".
   - clarify: card meta = theatre name · city · year · age; "premiere" label on the detail slate.
   - adapt: no side-scroll on /productions, 44px targets, mobile synopsis before photos.
   - typeset: about city list on the prose measure, TypographicCover <h4> → <p>.
   - polish: About invite band; lib/content.ts hides gallery rows whose file is missing in R2 (one ListObjectsV2).
4. Facts that are easy to lose:
   - Commands the user runs go into ops/<date>-<task>.sh. Read .env via dotenv, never `source .env`: an unquoted `&`
     breaks zsh.
   - I can neither read nor write prod Neon (auto mode). Local DB is docker pg17 on :5433.
   - In dev, unstable_cache persists on disk and MEM_TTL is 60s, so revalidate and wait 60s before checking.
   - Images come from pub-….r2.dev, which is rate-limited and not recommended for prod. A custom CDN domain is
     suggested, not done.
   - Dev server: `npx next dev -p 3010`. Playwright chromium lives at ~/.cache/ms-playwright/chromium-1234; screenshot
     scripts are in the session scratchpad.
   - Content to-dos for Roma in the admin:
     - "TЮZ" in an EN press title;
     - "Vienne" city;
     - 14 archive rows without a year;
     - all production statuses are the default "live";
     - the /productions/online poster is an Instagram screenshot;
     - the 68 missing gallery photos.
5. Next: /impeccable critique site (re-score against 20/32), then /impeccable critique admin (never run). 91
   Dependabot alerts are pending as a separate task.

Drop: tool output, screenshots, intermediate diffs, debugging of the HEAD-check approach.
```

---

## 2. Resume prompt

```text
Continue the /impeccable design work on boklanov (repo ~/dev/boklanov, branch main).

Read first:
1. PRODUCT.md (users, constraints, decisions) and DESIGN.md (v3 Plakat visual system).
2. The latest site critique: `.impeccable/critique/*__app-locale.md`.
3. CONTEXT.md: the glossary (Saved, Published). Saving in the admin publishes within seconds; there are no drafts,
   and localized text fields autosave about 1.5s after typing stops.
4. Memory: payload-cutover-done, payload-shared-neon-db, solo-commit-to-main, prod-commands-in-ops-file.

Where things stand:
- The site critique plan (2026-10-06) is fully shipped: layout, harden ×2, clarify, adapt, typeset, polish.
- The admin (/admin, Payload 3.90 with custom per-locale components in components/admin/) has never been critiqued.

Next, in order:
1. /impeccable critique site. Re-score and compare with 20/32.
2. /impeccable critique admin. The main task is Roma adding a production in RU/EN/DE on a laptop, rarely. Watch for:
   - Save stays grey for autosaved localized fields;
   - the RU·EN·DE·ALL pills;
   - media upload;
   - array rows (press, awards, gallery).
3. Optional: a custom R2 domain to replace pub-….r2.dev, and the Dependabot alerts.

Rules:
- Commit straight to main and verify on boklanov.com after the Vercel deploy.
- Never touch the prod DB yourself. Commands for the user go in ops/<date>-<task>.sh (dotenv, backup, dry run,
  confirm, apply, revalidate).
- Test DB scripts on the local pg17 copy first and diff all tables.
- Ask before changing factual copy or decisions recorded in PRODUCT.md. One decision at a time, with a recommendation.
```
