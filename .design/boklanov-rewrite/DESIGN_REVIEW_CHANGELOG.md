# Design review changelog (2026-10-05 … 2026-10-07)

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

24. `mobile-booking-cta`:
    - on a phone the booking bar is hidden at first paint, appears once the
      title slate scrolls out, and hides at the closing invite and footer;
    - it leads to `/contact?show=<slug>`: Telegram first, and the email
      subject names the show ("Touring: …", RU/DE too);
    - the closing invite is shown on phones as well;
    - EN label is now "Ask Roman about touring this show". [82840ee]

25. `mobile-productions-filters`:
    - on a phone the 15 filter controls sit behind one button, "filter ·
      directed by Roman" (it lists every active filter); the first row of
      posters is now in the first screen;
    - "31 of 55" always stands next to the title, so the default
      (director) is no longer a hidden state;
    - desktop: all four filter groups fit on one row. [3d1ab19]

26. `production-page-polish`:
    - the poster credit sits under the image, centred, with a "Photo:" /
      «Фото:» / "Foto:" label; it was beside the poster and clipped on phones;
    - poster alt starts with the title and has no " ," left by a trailing
      space (`lib/posterAlt.ts`, check: `npx tsx scripts/check-poster-alt.mts`);
    - admin-uploaded posters without variants get width/height attributes
      (720×1019 default) instead of 0×0. [5c57c8c]

27. `mobile-touch-targets`:
    - a global `.tap-target` class gives standalone links an invisible
      44px-tall hit area centred on the text, so type and row rhythm don't
      change;
    - applied to /press groups, /awards productions, /archive titles, credit
      names, production links, the slate theatre link and the header
      wordmark;
    - checked at 390×844 on /press, /awards, /archive and two production
      pages: before, 10 + 11 + 24 + 8 + 1 links were under 44px; now none
      outside prose (the skip-link stays off-screen until focus). No nested
      links were found. [875f846]

28. `tour-ticker-pause` (WCAG 2.2.2):
    - the city ticker (home and production tour band) has a pause/play
      button at its right edge: 44px hit area, `aria-pressed`, label "Pause
      the city ticker" / «Остановить бегущую строку» / "Städte-Laufband
      anhalten"; the band stays 31–32px tall;
    - hover and keyboard focus pause it too; once the visitor uses the
      button, their choice wins;
    - with reduced motion the band is static and the button is hidden;
    - checked on boklanov.com at 390 (tap) and 1440 (Space/Enter) on the home
      page and bury-me-behind-the-baseboard. City order is unchanged (home
      page left as is). [cbaca13]

29. `curator-facts-and-labels`:
    - countries are shown by name, not ISO code ("Finnland", «Финляндия»):
      in the /productions filter (sorted by name, KZ/RU last), the filter
      summary, typographic covers, detail-page chips and the rider;
      `?country=FI` stays in the URL (`countryName()` in lib/countryCode.ts,
      check: `npx tsx scripts/check-country-name.mts`);
    - the country popover now wraps; longer names overflowed it as one row;
    - cards end with the duration when known ("60 min" / «60 мин» / "60
      Min."), no dangling separator without it;
    - the 404 has its own title ("Roman Boklanov — page not found", RU/DE);
      the home title uses an em dash like every other page. [4c5a714]

## Fourth critique (24/36)

30. Fourth site critique: 24/36 (`.impeccable/critique/2026-10-06T17-40-24Z__app-locale.md`).
    The six shipped changes hold on prod. New P0: an unknown production URL
    (`/productions/xyz`, all locales) returns an unstyled HTTP 500 on prod
    (local dev returns 404). Plan, in order, as OpenSpec changes:
    - P0 unknown production slug → site 404, plus a 404≠500 check and
      redirects from old slugs;
    - P1 mobile production page: title before a capped poster, photo strip,
      tour facts next to the chips;
    - P1 availability on cards from the admin "Status" field ("ON TOUR",
      "ARCHIVE · 2021", nothing for Live; city leaves the card line); the
      TOURING sticker moves to the status too (decided 2026-10-06, option 1).
      Roma sets the statuses;
    - P2 production page structure: sticker gutter, credits grouped by role,
      outlet-only press rows, Watch/listen as a secondary button, visible
      press links;
    - P2 404 title lost after hydration, /press note vs untranslated
      headlines, "FI" on /press.

31. `production-slug-404` (P0):
    - an unknown production URL (`/productions/xyz`, any locale, wrong letter
      case) now returns the site's 404 instead of an unstyled HTTP 500;
    - cause, found with a local production build: the server not-found page
      read the locale from request headers, which throws inside the
      statically generated production route ("Page changed from static to
      dynamic at runtime … reason: headers"); it is now a client component
      using the layout's translations;
    - the 404 tab title is localized and stays after load (it used to switch
      to the home title); the raw server HTML keeps the site title (accepted);
    - no redirects needed: all 54 Keystatic slugs still exist;
    - check: `scripts/check-missing-pages.sh [base]` (6 URLs), passes on
      boklanov.com. [7acfe79]

32. `mobile-production-page` (P1):
    - on phones the poster is capped at 45svh, so the title, theatre,
      premiere and chips are in the first screen (bury-me-behind-the-baseboard
      at 390: H1 top 718 → 601px); the cap was not working at first because
      inline `maxHeight: 65vh` styles on the poster beat the media query, so
      they were removed and CSS owns the size;
    - phones show 3 gallery photos and an "All 11 photos" / «Все 11 фото» /
      "Alle 11 Fotos" button (46px) that opens the lightbox on photo 4;
      desktop shows the full grid;
    - the tour city band sits right after the chips on all viewports;
    - bury-me-behind-the-baseboard at 390: 9294 → 6850px; desktop unchanged;
    - known, older: closing the lightbox from a visible photo drops focus to
      `<body>` (triggers are `display: contents`). [82b203d]

33. `production-availability-status` (P1, decided 2026-10-06, option 1):
    - cards (home and /productions) end their meta line with the admin
      Status: "On tour" / «На гастролях» / "Auf Tournee", "In development" /
      «В работе» / "In Arbeit", "Archive · 2021" / «Архив · 2021» / "Archiv ·
      2021"; Live shows nothing. Today 2 productions are In development
      (mcqueen-blood-beneath-skin, total-fest-4), the other 53 are Live;
    - the city left the card meta line (the theatre stays);
    - the TOURING sticker on the production page shows only for Status "On
      tour"; before, any past tour city triggered it (bury-me-behind-the-
      baseboard lost it; its tour band stays);
    - the productions cache key is now `productions:all:v2`: the Vercel data
      cache outlives deploys and old entries had no status (locally every
      card first showed "productions" as its token);
    - check: `npx tsx scripts/check-availability.mts`. [52957b3]

34. `production-page-structure` (P2):
    - the award/touring sticker row moved inside the reading column, so it
      starts at the title's left edge (390: x=20, 1440: x=175) instead of
      x=0 where the rotated sticker was clipped;
    - credits are grouped by role: consecutive people with the same role sit
      under one label (bury: "Actors" once, both names under it);
    - the production page's press list hides bare outlet homepage links
      ("sobaka.ru", "Fontanka.ru"), the same rule as /press; `isArticle()`
      now lives in `lib/listRules.ts` for both pages (/press still 38 rows);
    - press headlines are underlined at rest (`--rule-strong`, accent on
      hover) and have a 44px hit area (`tap-target`);
    - "Watch / listen" is outlined; the booking bar is the only filled call
      to action. The unused `.btnPrimary` style is gone;
    - check: `npx tsx scripts/check-list-rules.mts`. [a4e2e20]

35. `press-and-404-labels` (P2):
    - the 404 tab title stays localized after load ("Roman Boklanov — page
      not found" / «…страница не найдена» / "…Seite nicht gefunden"), already
      fixed by entry 31; verified on 4 URLs. The layout's home `<title>` also
      stays in `<head>` after ours (accepted 2026-10-07: `document.title` is
      ours, 404s aren't indexed);
    - the /press note no longer promises full translation: "Headlines are in
      English where a translation exists. Articles are in their original
      language, mostly Russian." (DE likewise; /ru/press shows no note, as
      before);
    - the article language tag is a name in the page's language: "Vuosaari ·
      Finnish" / "Finnisch" / «финский» instead of "FI" (`languageName()` in
      `lib/countryCode.ts`);
    - production pages list en, ru and de in their hreflang alternates (de
      was missing). [2b3ae11]

## Fifth critique (23/36)

36. Fifth site critique: 23/36 (`.impeccable/critique/2026-10-06T20-56-44Z__app-locale.md`).
    The fourth critique's fixes hold on prod; the drop is a stricter reading
    of consistency and error prevention. Plan (decided 2026-10-07), as
    OpenSpec changes:
    - P1 the booking call to action follows the production's state;
      archived and Russian shows offer a new production;
    - P1 a designed state for productions in development.
      Not taken now: genre in the home tagline, button grammar / duplicate
      "Photos" H2, small targets on /press, content contradictions (Roma).

37. `status-booking-cta` (P1):
    - the sticky bar and closing button read by Status and theatre country:
      "Ask Roman about touring this show" (On tour, or Live outside Russia),
      "Ask Roman about a new production" (Archived, or Live at a Russian
      theatre), "Ask Roman about the premiere" (In development); RU/DE
      likewise. Today: 14 touring, 15 new production, 2 premiere;
    - bury-me-behind-the-baseboard is a Great Puppet Theatre show, so it now
      offers a new production; if it still tours, Roma sets Status "On tour";
    - `/contact?show=` prefills the matching email subject ("Touring: …",
      "New production / …", "Premiere: …");
    - an admin label override and `bookingCta: false` still win;
    - check: `npx tsx scripts/check-booking-kind.mts`. [93767aa]

38. `in-development-page` (P1):
    - a production with Status "In development" shows "In development"
      (RU «В работе», DE "In Arbeit") under the title, with "· premiere
      <date>" once a premiere date is set; other productions are unchanged;
    - with no poster, photos, video or synopsis the page shows one note
      under the title: "Photos, credits and press will appear here after the
      premiere." (RU/DE likewise) instead of ending in empty space;
    - applies to mcqueen-blood-beneath-skin and total-fest-4. [52689a5]

## Sixth critique (21/32)

39. Sixth site critique: 21/32 (`.impeccable/critique/2026-10-06T21-57-00Z__app-locale.md`).
    Posters stay the primary image of a production (decided 2026-10-07; the
    "stage photos first" finding is dropped). Plan, as OpenSpec changes:
    - `contact-show-message`: the Telegram chat opens with a first message
      about the show; a copy button for Telegram and Instagram;
    - `production-page-consistency`: the poster shrinks on desktop so the
      title is in the first screen, one button style, page titles carry the
      site name, 44px credits/rider toggles.

40. `contact-show-message`:
    - on `/contact?show=<slug>` the Telegram button opens `t.me/roman7593`
      with a first message filled in, of the same kind as the booking button:
      "Hello Roman, I'm writing about touring Beware of the Dog!" (tour),
      "…about a new production (…)", "…about the premiere of …"; RU/DE
      likewise;
    - a "Copy message" button under Telegram/Instagram copies the same text
      (Instagram has no prefill), styled like the email Copy button;
    - `/contact` without `?show=`, or with an unknown slug, is unchanged;
    - Telegram documents the prefill for username links; check once on a
      phone. [64c9dd2]

41. `production-page-consistency`:
    - desktop (≥1024px): the poster is capped at 50vh instead of 65vh, so at
      1440×900 the title ends at 713px (lina-marlina), 827px (bury), 797px
      (vaikenemisen-kielioppi), all in the first screen; phones unchanged;
    - "Buy tickets", "Watch / listen" and the rider/press-kit links use the
      booking button's grammar (mono, uppercase, outlined) with a neutral
      border; only booking is in the accent;
    - production pages are titled "Lina-Marlina — Roman Boklanov" (RU «… —
      Роман Бокланов»); Open Graph and Twitter titles match, in the page's
      language (before: always the Russian title);
    - Credits and tour-rider toggles are 44px tall (were 37px);
    - Vercel Skew Protection looks off for boklanov_v2 (no `?dpl=` on asset
      URLs); enable it in the project settings → Advanced. [62445a1]

## Maintenance

42. Next.js 15.4 → 16.4, to close GitHub's 91 Dependabot alerts (3 critical).
    Next 15.4 has no patched release, and Payload 3.90 accepts only 15.4.x or
    ≥16.3.3.
    - first `npm audit fix`, sharp 0.35.5, undici and dompurify pinned to
      patched versions [9d18c14];
    - `middleware.ts` is now `proxy.ts`; `revalidateTag` gets
      `{ expire: 0 }` so admin saves still show within seconds;
      `eslint.config.mjs` uses the flat exports of eslint-config-next 16;
      `@floating-ui/react` is a direct dependency (`@payloadcms/ui` imports
      it without declaring it) [529f29b];
    - the new `react-hooks/set-state-in-effect` rule is an error with zero
      hits: ThemeToggle and the productions count use `useSyncExternalStore`,
      the command palette resets its highlight on input, the unused
      SlateStrike is removed [31f31c0];
    - 2 alerts remain, both build-time only: braces (no patched version) and
      the old esbuild inside drizzle-kit;
    - the OG image route is checked on prod only: Next 16's `ImageResponse`
      refuses localhost image URLs, so it fails under `next start`.

## Admin critique (17/40)

43. `/impeccable critique admin` (2026-10-08, first run, 17/40, Poor):
    `.impeccable/critique/2026-10-07T19-40-40Z__app-payload-admin.md`.
    Decisions: everything goes through Save; one language switch; R2 delete
    removed from the editor. Done in one pass:
    - one save model: the autosave layer (debounced per-locale PATCH) and
      the per-field RU/EN/DE/ALL pills are gone. Every field edits the page
      locale and goes live on Save. ALL mode, which flattened rich text in
      the other locales, went with them;
    - `LocaleSwitch` (Русский / English / Deutsch) in every document header.
      It is made of links, so Payload's «leave without saving» guard fires;
      the stock header Localizer (router.push, no guard) is hidden;
    - `LocaleHint` under each localized field: the RU original on EN/DE
      pages, and «Нет перевода: EN, DE»;
    - image fields: «Delete from R2» removed; Загрузить / Очистить, RU status
      and errors that say a Save is still needed;
    - Productions list: search by title, 50 per page, poster thumbnails,
      «На главной: Да / —»; API tab and Notion IDs hidden;
    - RU help texts rewritten without code paths and jargon; accusative
      «Добавить Веху / Серию …»; field descriptions at readable contrast.
      Not done: the document heading is still the slug (`useAsTitle` can't be
      nested; needs a top-level title column + backfill). Sorting by year was
      dropped: 25 of 55 productions have no year.

44. External review of the admin (`review/review-1.md`, 2026-10-08), worked
    through with `/grill-with-docs` + `/impeccable`. Its top item was a
    regression from entry 43: the custom poster cell sat in Payload's linked
    first column and dropped the link, so no row opened a production.
    - Productions list: the whole row opens the production (title link
      stretched over the row, checkbox above it); headings without the
      group path («Постер», «Название», «Год премьеры», «Статус», «На
      главной»); 2:3 poster frame with a grey placeholder; status badges
      (Идёт green, На гастролях blue, В работе amber, В архиве grey); ★ for
      featured; empty cells instead of «Без метки»; 1200px max width;
      readable checkboxes; red «Удалить»; «Поиск по названию или слагу»
      (the RU pack's `searchBy` had no `{{label}}`).
    - `/admin` is our own dashboard: sections with counts and «+ Добавить»,
      productions by status (each links to the filtered list), «Нужно
      доделать» (Untranslated EN / DE by the five Main texts, expandable,
      each opens the production in that language; no year; no poster),
      «Недавно изменённые» (last 5 of productions + About + Contact).
      Terms in `CONTEXT.md` › Translation.
    - Sidebar: icons per section (CSS masks on Payload's nav ids), readable
      group headings.
      Not done, by decision: ⌘K palette, floating bulk-action bar, density
      toggle, header profile/role/environment, moving logout, row action
      icons (the clickable row covers them).

45. Admin branding (2026-10-08, ideas from Payload's theming guides): the
    wordmark «роман бокланов» (lowercase Lora) replaces Payload's logo on
    the login screen, «рб» its icon in the header; Payload's neutral
    `--color-base-*` scale is re-tinted warm toward the site's paper/ink at
    the same lightness per step, so contrast is unchanged in both themes.
    The collection description no longer repeats under document headings.
    No Tailwind: `custom.scss` on Payload's variables covers it.

## Next

- Done: the 68 gallery photos are on R2 (nikita, aiaccio, online: every image
  returns 200, checked 2026-10-06).
- Fourth critique done (24/36); work through its plan (entry 30).
- Done: poster size is stored on the production (`media.poster.width/height`,
  measured by a hook when the path changes), so a landscape poster
  (vaikenemisen-kielioppi, 1280×720) reserves the right box. Admin uploads
  never had a Payload media doc to read it from. Backfilled on prod with
  `ops/2026-10-07-fill-poster-dims.sh`: 42 posters (2026-10-07). [64ea933]
- Done: `/impeccable critique admin` (entry 43).
- Check in the admin on prod (entries 42, 43): a save shows on the site
  within seconds; the header language switch, and its unsaved-changes prompt.
- Tell Roma: no autosave any more, everything needs «Сохранить»; the language
  is chosen in the document header.
- Done: the old Vercel project `octrows-projects/boklanov` (Keystatic) is
  disconnected from Git and no longer builds on push (2026-10-07).

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
- From the fourth critique: set "Status" on every production (Live / On tour
  / Archived); today all 55 are "Live", so the new card marker shows nothing.
- From the fifth critique: if bury-me-behind-the-baseboard (or any other
  Russian-theatre show) can still tour, set its Status to "On tour", or its
  button says "new production". Name spellings drift (Maksim/Maxim Morozov,
  Lidia Klirikova / "Lydia Klirovich"); /about "Staged in" lists countries
  the bio doesn't; "Participant" and "Long list" entries count towards the
  FESTIVAL AWARD sticker; Bury has a different poster on home, grid and its
  page; the RU title of the-ape-star ends with a space.
  total-fest-4 is a festival, not a production: move it to /about
  or the awards, or give it a poster and synopsis.
- From the sixth critique: Status is still "Live" everywhere, so no show
  reads as bookable or on tour; the home "Selected works" (`listOrder`) are
  all 2021–23 and mostly Russian: add a current touring show; German titles
  and theatre names read machine-translated: check them in the DE locale;
  the Bury synopsis reads as a fragment; the lina-marlina gallery photos have
  empty alt text.
