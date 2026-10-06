# Design review changelog (2026-10-05 … 2026-10-06)

Every change from the `/impeccable` review of boklanov.com, in order. Each one
is on `main` and deployed to prod (Vercel `boklanovs-projects/boklanov_v2`).
The commit is in brackets.

## Context and decisions

1. Added PRODUCT.md. It records:
   - the primary user: an EU curator on a phone, about 90 seconds;
   - priorities: invitation > EPK > archive;
   - Russian productions are described in the past tense. [951260e]
2. Recorded two decisions in PRODUCT.md:
   - press and awards are fully translated on EN pages;
   - Telegram and Instagram are the primary contact. [ff7931f]

## First critique (20/32): plan carried out

3. Home: an invitation link under the tagline in the first screen, plus an
   invitation band after "Selected works". [091e2e8]
4. Productions:
   - no "Buy tickets" for Russian theatres;
   - archive rows without a year go last;
   - unknown URLs show the site's 404 instead of the default one. [39435a0]
5. i18n:
   - restored 184 RU/EN values (press titles, award names, tour cities) that the
     seed had lost;
   - form tags are translated (PUPPET, FAMILY and so on);
   - EN/DE taglines say "families". [fff74da]
6. Ops script for the user to run step 5 on prod. Applied: 184 values
   written. [e8be610]
7. Production card meta now reads "theatre · city · year · age" instead of a
   cryptic line; the date on the detail slate is labelled "premiere". [aa56329]
8. /productions on a phone:
   - no horizontal scroll;
   - filter chips and links are at least 44px;
   - on the production page the synopsis comes before the photos. [6daa818]
9. /about: the list of cities is set on the reading measure; no jump in heading
   levels (h2 → h4 is now `<p>`). [dcc510f]
10. /about ends with an invitation to get in touch; no line starts with a lone
    "·". [7c07c3b]
11. Gallery photos whose file is missing in R2 (68) are hidden on the site. The
    rows stay in the admin. [5b4e5f3]
12. Prompts for compacting and resuming the session. [63d8e39]

## Second critique (23/36): plan carried out

13. Covers uploaded through the admin no longer break. Before, the site asked
    for AVIF versions that admin uploads don't have, and got a 404. Now it falls
    back to the original. This fixed two new 2026 EU productions and every
    future upload. [c74e67a]
14. Script and ops file to restore the 68 missing photos from `notion-data/`.
    All 68 were found:
    - Nikita's files are matched through transliteration;
    - two Online files carry the "\_\_копия" suffix.

    The user runs it: `bash ops/2026-10-06-restore-gallery-from-notion.sh`.
    [60c6dee]

15. Harden:
    - a card shows a typographic cover when its image fails to load;
    - "Skip to content" link on every page;
    - footer and 404 links are 44px;
    - the 404 has a contact link and copy in the site's voice (RU/EN/DE).
      [c23c010]
16. /press:
    - grouped by production, newest first (Helsinki 2026 leads);
    - each article is one link across the whole row;
    - a language tag where one is set;
    - a note that headlines are translated;
    - links to an outlet's homepage are hidden. [8ff50d5]
17. Production page:
    - the synopsis is printed once, not duplicated by the body;
    - credits are open by default;
    - on desktop the page ends with an invitation instead of empty space.
      [77fd0b4]
18. /productions:
    - two columns of posters on a phone (19.7k → 7.4k px of height);
    - filter group labels are visible on a phone;
    - a "2 of 55" counter appears once a filter is on. [e4c548b]
19. Desktop grid back to 3 columns so posters stay large (4 columns made them
    too small). [1756875]
20. /awards:
    - award names in the body face instead of mono;
    - city and category always under the name;
    - the "×N" count is gone.

    No "Selected honours" block above the list (decided 2026-10-06).
    [4811385]

21. Polish:
    - the arrow in the home invitation link no longer wraps onto a line of
      its own (it did on /ru and /de);
    - "ST. PETERSBURG" with a space in the EN ticker;
    - PRODUCT.md and DESIGN.md now say EN is the default locale. [12d05b6]
22. Changelog and prompts updated for a fresh session.

## Third critique (23/36): OpenSpec changes

23. Third site critique: 23/36 again; the old issues are gone and new ones
    of the same weight replaced them
    (`.impeccable/critique/2026-10-06T14-27-10Z__app-locale.md`). Decided
    2026-10-06: the home page stays as is (no stills instead of posters, no
    duotone change, no ticker city order change). The findings are split into
    OpenSpec changes, in this order:
    - `mobile-booking-cta` (P1): the mobile sticky CTA appears after the
      slate, yields to the invite and footer, leads to Telegram first;
    - `mobile-productions-filters` (P1): filters collapse on phones, the count
      sits by the H1, the default "Directed by Roman" is named;
    - `mobile-touch-targets` (P2): /press, /awards, /archive, slate and
      credits links get 44px;
    - `production-page-polish` (P2): cover credit under the poster, poster
      dims, clean alt;
    - `tour-ticker-pause` (P2): pause toggle (WCAG 2.2.2);
    - `curator-facts-and-labels`: country names, duration on cards, 404 and
      home titles.

## Next

- The user runs `bash ops/2026-10-06-restore-gallery-from-notion.sh` (68
  photos to R2) unless already done. Check: the nikita, aiaccio and online
  galleries show photos on boklanov.com.
- Apply the OpenSpec changes above, `mobile-booking-cta` first
  (`/opsx:apply mobile-booking-cta`).
- `/impeccable critique admin` (never run).
- The old Vercel project `octrows-projects/boklanov` (Keystatic) still builds
  every push and fails without a DB. Disconnect it from Git in the octrow@yandex
  account.

## Content to-dos for Roma (in the admin)

- Home "All productions" shows the productions that have `listOrder` (4 now):
  with 3 columns on desktop the 4th sits alone. Pick 3 or 6.
- "NO WINER WAY" in the archive: check whether it's a typo.
- Upload a press kit and tech rider (PDF). The EPK block appears once a file
  exists.
- Translate the Finnish press headline into EN; set the language on the other
  articles.
- The Aibolit text is in the present tense; rewrite it in the past tense.
- Remove "Buy tickets" where runs are over (Lina-Marlina 2023).
- "TЮZ" in an EN press title; "Vienne"; 14 archive rows without a year; all
  statuses are "live"; the /productions/online poster is an Instagram
  screenshot.
- From the third critique: award lines name a performer in brackets
  ("Winner of the festival (Anastasia Polezhaeva)"), so it's unclear what
  Roman won; the "puppet" form is set on only 6 of 55 productions; check
  "Holiday recipe" vs "Holiday Recipe" (duplicate?); photo credits are in
  Cyrillic on EN pages (e.g. "Павел Семченко"); /about has no CV or
  timeline a curator can forward.
