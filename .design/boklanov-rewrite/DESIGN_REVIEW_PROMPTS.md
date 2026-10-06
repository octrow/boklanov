# Design review session prompts (updated 2026-10-06, evening)

Two prompts: one to compact the current session, one to resume the `/impeccable` design work on boklanov in a fresh
or compacted session. Full list of shipped changes: `DESIGN_REVIEW_CHANGELOG.md` (same folder).

---

## 1. `/compact` instructions

Paste after `/compact `:

```text
Keep for the boklanov /impeccable design work:

1. State:
   - Prod = main on Vercel boklanovs-projects/boklanov_v2, Neon branch `production`.
   - I work solo, commit straight to main, and verify on boklanov.com once the Vercel status is success
     (gh api repos/octrow/boklanov/commits/<sha>/statuses).
2. Two site critiques are done and both plans are shipped:
   - first 20/32, second 23/36 (snapshots in .impeccable/critique/*__app-locale.md);
   - 22 numbered changes in .design/boklanov-rewrite/DESIGN_REVIEW_CHANGELOG.md, last code commit 12d05b6.
3. Decisions by the user (2026-10-06):
   - Primary user is an EU curator on a phone, 90 s; priority invitation > EPK > archive.
   - TG/IG are the primary contact; do not restyle /contact.
   - Press and awards are fully translated on EN.
   - Lowercase H1s and the "2026 EDITION" footer stay.
   - Gallery photos missing in R2 are hidden on the site, rows stay in the admin.
   - Featured on home stays as Roma picks it; do not reorder.
   - /productions grid: 2 columns on phones, 3 on desktop (4 was too small).
   - No "Selected honours" block on /awards.
4. Facts that are easy to lose:
   - Commands the user runs go in ops/<date>-<task>.sh; read .env via dotenv, never `source .env`.
   - I can neither read nor write prod Neon. Local DB is docker pg17 on :5433 (container boklanov-db-1).
   - Dev server: run `NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED=1 npx next dev -p 3010` with run_in_background.
     Never use `pkill -f` (it kills my own shell). After DB changes POST /api/revalidate, then wait 60 s.
   - Playwright: /home/octrow/node_modules/playwright-core with
     ~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome. Use waitUntil 'load', not 'networkidle'.
   - lib/content.ts checkImagesInR2:
     - one ListObjectsV2 hides gallery rows whose file is missing;
     - it drops AVIF variants that don't exist, so admin uploads in uploads/ use the original.
   - The 68 missing gallery photos are in notion-data/ (gitignored). The user still has to run
     ops/2026-10-06-restore-gallery-from-notion.sh unless done.
   - The old Vercel project octrows-projects/boklanov (Keystatic, octrow@yandex) still builds every push and fails
     (no DB). Prod is unaffected. The user should disconnect it from Git.
   - No production has pressKit or techRider, so EPK waits on Roma's files.
5. Next:
   - /impeccable critique site (re-score against 23/36);
   - /impeccable critique admin (never run).

Drop: tool output, screenshots, intermediate diffs.
```

---

## 2. Resume prompt

```text
Continue the /impeccable design work on boklanov (repo ~/dev/boklanov, branch main).

Read first:
1. PRODUCT.md (users, constraints, decisions) and DESIGN.md (v3 Plakat visual system).
2. .design/boklanov-rewrite/DESIGN_REVIEW_CHANGELOG.md: the 22 shipped changes, next steps, content to-dos for Roma.
3. The latest site critique: `.impeccable/critique/*__app-locale.md` (newest is 23/36).
4. CONTEXT.md: the glossary (Saved, Published). Saving in the admin publishes within seconds; there are no drafts,
   and localized text fields autosave about 1.5 s after typing stops.
5. Memory: payload-cutover-done, payload-shared-neon-db, solo-commit-to-main, prod-commands-in-ops-file.

Where things stand:
- Both site critique plans are shipped (last code commit 12d05b6). The grid is 2 columns on phones and 3 on desktop.
- Waiting on the user:
  - run ops/2026-10-06-restore-gallery-from-notion.sh (68 photos to R2);
  - disconnect the old Vercel project octrows-projects/boklanov from Git.
- Waiting on Roma: press kit and tech rider PDFs, plus the content to-dos in the changelog.
- The admin (/admin, Payload 3.90 with custom per-locale components in components/admin/) has never been critiqued.

Next, in order:
1. Check whether the 68 photos are live (the nikita, aiaccio and online galleries on boklanov.com). If not, remind
   the user.
2. /impeccable critique site. Re-score and compare with 23/36.
3. /impeccable critique admin. The main task is Roma adding a production in RU/EN/DE on a laptop, rarely. Watch for:
   - Save stays grey for autosaved localized fields;
   - the RU·EN·DE·ALL pills;
   - media upload (uploads get transliterated names; no AVIF variants, the site falls back to the original);
   - array rows (press, awards, gallery).
4. Optional: a custom R2 domain to replace pub-….r2.dev (rate-limited), and the 91 Dependabot alerts.

Rules:
- Commit straight to main and verify on boklanov.com after the Vercel deploy. Add each change to the changelog.
- Never touch the prod DB yourself. Commands for the user go in ops/<date>-<task>.sh (dotenv, backup, dry run,
  confirm, apply, revalidate).
- Test DB scripts on the local pg17 copy first and diff all tables.
- Ask before changing factual copy or decisions recorded in PRODUCT.md. One decision at a time, with a recommendation.
```
