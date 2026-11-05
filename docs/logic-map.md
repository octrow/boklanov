# Logic map

How a page request (or an admin save) becomes a rendered boklanov.com page.
The map describes the code as it is today, step by step.
Each step says what it decides, where the flow branches, and which module does it.

Read `CONTEXT.md` first for the terms (Saved, Published, Main texts, Untranslated, Image path).
Known gaps and fixes in progress are in `docs/plans/2026-11-05-logic-map-fixes.md`.

Rule: if you change a step or a branch, update this file in the same commit.
`scripts/check-logic-map.sh` checks that every `Module:` line points to a real module.
`Module:` paths start at the repo root, slash-separated, no extension.

## The flow at a glance

Read path (a visitor):

```
GET /<path>
  │
  ├─ 1  Locale routing ........ which of en / de / ru serves this URL?
  ├─ 2  Messages .............. which UI strings load for the locale?
  ├─ 3  Content load .......... which Productions exist, in what shape and order?
  ├─ 4  Image check ........... which images does the site keep, which variants may it use?
  ├─ 5  Locale projection ..... which language does each field show?
  ├─ 6  Layout ................ what wraps every page (search index, header, share image)?
  ├─ 7  Page ................. which Productions does this route show, in what order?
  └─ 8  Metadata .............. title, canonical, hreflang, og:image
  │
HTML (or XML / Markdown / JPEG for the API-style routes)
```

Write path (an editor in `/admin`):

```
Save in Payload admin
  │
  ├─ 9  Before-save hooks ..... measure images, fill year, copy title
  └─ 10 Cache invalidation .... which tags and paths are busted, here and on peer hosts?
```

Content source: Postgres (Neon) through Payload Local API. Images: R2 behind `NEXT_PUBLIC_CDN_BASE`.
Pages are static (SSG) and rebuilt from the data cache after a tag is busted.

## Where the flow splits by kind

The same kind of split is decided in several places by hard-coded values, not by one registry.

| Kind / variant      | Switched on by                                                       | Steps it changes    | What changes                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role `director`     | `role` array contains `director`                                     | 7                   | Home grid, `/productions` default filter, feed, `llms.txt` list show only these                                                                                  |
| Role not `director` | `role` has no `director`                                             | 7                   | Left out of the home grid, feed, `llms.txt` and the default `/productions` view; listed in `/archive` and under the other role filters                           |
| Role `other` filter | URL `?role=other`, label key `roleReader` (shows "other")            | 7                   | `/productions` shows items with none of director, co-director, performer: `art-director`, `playwright`, `producer` or no role                                    |
| Country `RU`        | `theatre.country === 'RU'`                                           | 7                   | Tickets link hidden; booking CTA kind is `new` unless Status is `in-development` (`premiere`) or `on-tour` (`tour`); RU and KZ sorted last in the country filter |
| Status              | admin Status field (`live`, `in-development`, `archived`, `on-tour`) | 7                   | Card availability label, booking CTA kind (`tour`, `new`, `premiere`), dev note when empty                                                                       |
| Locale `de`         | URL `/de`                                                            | 5                   | `tagline` and `directorsNote` stop at the DE value (null shows "forthcoming"); other fields fall back                                                            |
| Locale `ru` or `en` | URL                                                                  | 5                   | `tagline`: en → ru, ru → ru only (never en); `directorsNote`: locale → ru → en. No DE fallback                                                                   |
| Feed locale         | route `/feed`, `/ru/feed`                                            | 7                   | `de` returns 404, no DE feed                                                                                                                                     |
| Variants flag       | `NEXT_PUBLIC_IMAGE_VARIANTS_ENABLED=1`                               | 3, 4                | Baked `.<W>.avif` URLs are derived or left null                                                                                                                  |
| Production runtime  | `NODE_ENV`                                                           | 3, side flow upload | Dev: 60 s memory cache and disk writes in `r2-asset`; prod: tag cache only                                                                                       |

Examples:

- "/de/productions/lina-marlina" with an empty DE tagline → title falls back en → de → ru, tagline shows "forthcoming".
- "/ru/productions?role=other" → productions whose roles are all outside director, co-director, performer.
- A production with no `role` and no `listOrder` → among the lists, in `/archive` and `/productions?role=other|all` only; its own page, sitemap and Cmd-K still list it.

Module: `lib/content`, `lib/bookingKind`, `lib/availability`, `components/FilteredProductionsPanel`

## Entry points

All page routes call `getAllProductions` / `getProduction` from `lib/content`. They differ in what they filter.

| Entry                          | Locales                   | Productions shown                                                                             | Notes                                                              |
| ------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/` (home)                     | en, de, ru                | `featured` with a poster, max 6; grid of `director` role with `listOrder` set, minus featured | featured sorted by `featuredOrder`, then slug                      |
| `/productions`                 | en, de, ru                | all, `listOrder` first; client filter defaults to `role=director`                             | URL params `role`, `form`, `age`, `country`                        |
| `/productions/<slug>`          | en, de, ru                | one; 404 when slug unknown                                                                    | slug list for SSG comes from the `en` projection                   |
| `/archive`                     | en, de, ru                | roles without `director`, year ascending, undated last                                        |                                                                    |
| `/awards`                      | en, de, ru                | productions with awards or festivals                                                          |                                                                    |
| `/press`                       | en, de, ru                | productions with at least one real article link                                               | non-RU locales show an "originals" note                            |
| `/contact`                     | en, de, ru                | lookup tables for `?show=<slug>`                                                              | Contact global, fallbacks from constants                           |
| `/about`                       | en, de, ru                | About global, not Productions                                                                 |                                                                    |
| `/feed`, `/ru/feed`            | en, ru                    | `director` role                                                                               | `de` is 404                                                        |
| `/llms.txt`                    | en                        | `director` role                                                                               | static text plus list                                              |
| `/sitemap.xml`                 | all three                 | every production                                                                              | `lastModified` from DB `updatedAt`                                 |
| `/robots.txt`                  | n/a                       | n/a                                                                                           | disallows `/*?show=`                                               |
| `/api/og/<slug>?locale=`       | en, de, ru (invalid → en) | one                                                                                           | 1200x630 PNG, satori                                               |
| `/api/share-image`             | n/a                       | n/a                                                                                           | About share photo cropped to 1200x630 JPEG                         |
| `/api/r2-asset` (POST, DELETE) | n/a                       | n/a                                                                                           | admin image upload and delete; 401 without a Payload admin session |
| `/api/revalidate` (POST)       | n/a                       | n/a                                                                                           | peer-host cache bust, shared secret                                |
| `/admin`                       | ru, en UI                 | Payload admin                                                                                 | excluded from locale middleware                                    |
| CLI `scripts/*`                | n/a                       | n/a                                                                                           | see Side flows                                                     |

Module: `lib/roleLabels`, `lib/xml`, `app/[locale]/page`, `app/[locale]/productions/page`, `app/[locale]/productions/[slug]/page`, `app/[locale]/archive/page`, `app/[locale]/awards/page`, `app/[locale]/press/page`, `app/[locale]/contact/page`, `app/[locale]/about/page`, `app/[locale]/feed/route`, `app/llms.txt/route`, `app/sitemap`, `app/robots`

## Steps

### 1. Locale routing

Decides: which locale serves the URL, and whether the URL carries a prefix.
In: request path. Out: locale segment for the `[locale]` route.
Branches:

- no prefix → `en` (default, `localePrefix: 'as-needed'`);
- `/de/...`, `/ru/...` → that locale;
- path with a dot, or starting `api`, `_next`, `_vercel`, `fonts`, `favicon`, `admin` → middleware skipped;
- unknown path under a locale → `[...rest]` calls `notFound()` and renders the site 404 with chrome.
  No Accept-Language or cookie detection; no `NEXT_LOCALE` cookie; no `Link` header (hreflang is in metadata).
  Fails: invalid locale in the layout → `notFound()`.
  Module: `proxy`, `i18n/routing`, `app/[locale]/[...rest]/page`

### 2. Messages

Decides: which UI strings load.
In: locale. Out: `messages/<locale>.json`.
Branches:

- requested locale not in `routing.locales` → `en` messages.
  No fallback between locales inside a messages file: a missing key in `de` shows the key path (next-intl default).
  Module: `i18n/request`, `i18n/navigation`

### 3. Content load

Decides: the list of Productions, their shape and their order.
In: nothing (all locales at once). Out: `Production[]` with `{ru,en,de}` maps per localized field.
Steps inside:

- `payload.find` on `productions`, `locale: 'all'`, `depth: 0`, limit 500 (`PRODUCTIONS_LIMIT`, warns when hit);
- map each doc to `Production`: strings become `{ru,en,de}` maps; null, empty strings and empty one-line rich text (tagline, synopsis) drop out; a body or director's note editor state with no text node and no non-paragraph node becomes null; `status` not in the four known values becomes `live`, `bookingCta` is true unless `false`;
- `poster.lqip` read from `public/productions/<slug>/lqip.json`; when the file has dimensions they overwrite the stored poster dimensions;
- variant URLs derived from the Image path (`.420/.600/.720/.828/.1080.avif`) only when the variants flag is on, the path is local and ends in jpg, jpeg, png or webp;
- sort: `featured` first, then year descending, then slug.
  Cache: `unstable_cache` key `productions:all:v2`, tag `productions`. About and Contact globals use keys `about:global`, `contact:global` and tags `about`, `contact`. Dev adds a 60 s process cache on `globalThis`.
  Fails: a DB error throws; `generateStaticParams` for production pages catches it and returns `[]` (pages render on demand).
  Module: `lib/content`, `payload.config`, `collections/Productions`

### 4. Image check

Decides: which gallery photos and baked variants the site keeps.
In: `Production[]`. Out: same list, mutated in place.
Branches:

- `S3_BUCKET` or `S3_ENDPOINT` unset → check skipped with a console warning, everything kept;
- R2 listing fails → warning, everything kept;
- gallery photo whose key is not in the bucket (and not `http(s)`) → dropped from the site, kept in admin;
- poster, productions photo, featured photo or gallery photo whose `.420.avif` key is missing → `variants` set to null, original file used.
  One `ListObjectsV2` sweep over the whole bucket, run when the cache refills.
  Module: `lib/content`, `lib/image-variants`

### 5. Locale projection

Decides: which language each field shows.
In: `Production`, locale. Out: `ProductionView` with plain strings.
Branches:

- title, synopsis, body, premiere date, CTA label → locale → en → de → ru → default (title default is the slug);
- credits → the locale's own list when non-empty, else en, else de, else ru;
- `tagline` → `de` stops at DE; `en` → en → ru; `ru` → ru only; an empty result becomes null;
- `directorsNote` → `de` stops at DE; `en`/`ru` → locale → ru → en;
- awards, festivals, press, links, runs, theatre, tour → same chain per field; empty tour cities removed.
  The chain uses `??`; empty strings and empty editor states are already null by step 3, so they do not stop it.
  `toCardView` strips heavy fields (body, gallery, credits, press) before a Production goes to a client component.
  Module: `lib/content`

### 6. Layout

Decides: what wraps every page.
In: locale. Out: `<html>` shell, theme script, header, footer, command palette, analytics.
Steps:

- loads all Productions for the locale and builds the Cmd-K index: one item per production, award, press article, plus de-duplicated theatres and cities;
- theme script reads `localStorage` key `boklanov.theme` (`gorky` default, `paper`);
- font preloads depend on locale (`ru` Cyrillic subsets, others Latin);
- metadata: canonical and hreflang for the three locales, `x-default` is en, og:image from the share image.
  Share image: About › Share preview path → `/api/share-image?v=<sha1 of the path>`; empty → bundled default.
  Cmd-K press items are filtered by `isArticle`, like the press and production pages.
  Fails: share image missing, non-2xx or undecodable → `/api/share-image` redirects (307) to `/og.jpg`; a fetch that rejects (relative URL without `NEXT_PUBLIC_CDN_BASE`, network error) also redirects.
  Module: `app/[locale]/layout`, `lib/search`, `lib/listRules`, `lib/shareImage`, `app/api/share-image/route`, `lib/baseUrl`

### 7. Page

Decides: which Productions the route shows and in what order.
In: `ProductionView[]`. Out: JSX.
Per route, see Entry points. Rules that live in the page code:

- home: featured needs a poster; cap 6; grid needs `director` and `listOrder`;
- `/productions`: `listOrder` first, then loader order; filter runs in the browser from URL params (role default `director`; age buckets 3, 6, 12, 18 from the numeric part of `ageRating`; forms `ensemble` and `theater` are not offered as filters);
- production page: role labels for all admin roles plus the legacy `reader` and `sketch` (`lib/roleLabels`), unknown keys print raw; RU theatre → no tickets link; booking CTA label from `bookingCtaLabel`, else by `bookingKind`; CTA URL from `bookingCtaUrl`, else `/contact?show=<slug>`; synopsis hidden when the body already starts with it; press links hidden when the URL has no path (`isArticle`);
- contact: `?show` is read in the browser, the page itself is static;
- about: body picked locale → en → de → ru; `de` pages with a non-DE body show "forthcoming".
  Fails: unknown slug → `notFound()`.
  Module: `app/[locale]/page`, `app/[locale]/productions/[slug]/page`, `lib/listRules`, `lib/bookingKind`, `lib/availability`, `lib/folio`

### 8. Metadata

Decides: title, description, canonical, hreflang, og:image per page.
Branches:

- production title: `<title> — staged by Roman Boklanov` (role director or co-director) or `— with Roman Boklanov`; falls back to the site name suffix, then the bare title, to stay within 60 characters; two productions with the same title in the locale get the year;
- production description: synopsis, else "Title · Theatre · Year" plus the site blurb, clamped;
- production og:image: `/api/og/<slug>?locale=<locale>`; other pages use the share image;
- every page lists all three locales in hreflang, whether or not the text is translated (#7).
  OG route: bilingual title (RU on top, EN under when different); poster fetched from the CDN (request origin when no CDN base), skipped for `.webp` and `.avif`; the JSON-LD `image` uses the same URL (`lib/posterUrl`).
  Module: `lib/productionTitle`, `lib/metaDescription`, `app/api/og/[slug]/route`, `lib/baseUrl`

### 9. Before-save hooks

Decides: what is stored next to what the editor typed.
In: Payload `data`. Out: `data` with computed fields.
Branches:

- `posterDims`: poster path changed or size missing → fetch from the CDN and store width and height; fetch or decode failure stores null;
- `galleryDims`: same for each gallery photo whose path changed or size is missing;
- `yearFromPremiereDate`: blank year → first 19xx or 20xx in the free-text premiere date;
- hidden top-level `title` copies `identity.title`.
  Without `NEXT_PUBLIC_CDN_BASE` the probe returns null (relative URL), so dimensions are null.
  Fails: probe errors never block the save; the page falls back to a default aspect ratio.
  Module: `hooks/posterDims`, `hooks/galleryDims`, `hooks/yearFromPremiereDate`, `lib/imageSize`

### 10. Cache invalidation

Decides: what the next request rebuilds, on this host and on peers.
In: a saved or deleted Production, About or Contact. Out: busted tags and paths.
Branches:

- Production save or delete → tag `productions` (no per-slug tag), paths `/[locale]` and `/[locale]/productions`;
- About save → tag `about`; path `/[locale]` as a layout bust when the share image changed, else `/[locale]/about`;
- Contact save → tag `contact`, path `/[locale]/contact`;
- `context.disableRevalidate` set → nothing runs (seed scripts).
  Peer fan-out: POST `/api/revalidate` to each URL in `REVALIDATE_PEERS` (3 s timeout, own `VERCEL_URL` skipped), body `{secret, tags, paths}`. The receiver busts every tag and every path with type `page`.
  Fails: no peers or no `REVALIDATE_SECRET` → no fan-out; a peer error is logged and ignored; the receiver returns 503 without a secret, 401 on a wrong one.
  Module: `hooks/revalidate`, `hooks/revalidate-peers`, `app/api/revalidate/route`

### Output

HTML pages with JSON-LD (WebSite on home, CreativeWork on production pages, Person on `/about`), `sitemap.xml`, `robots.txt`, `llms.txt`, RSS 2.0, OG PNG, share JPEG.
Image URLs go through `cdnUrl`: `http` paths unchanged, local paths get `NEXT_PUBLIC_CDN_BASE`.
Module: `lib/cdn`, `app/sitemap`

## Side flows

### Admin image upload and delete

Both handlers first check the Payload session cookie (`payload.auth`) and return 401 without a user; the route is outside the `proxy` matcher, so this is the only guard.
POST uploads a file (jpg, jpeg, png, webp, gif, svg, avif; max 25 MB) to R2 under `<directory>/<transliterated name>-<base36 time><ext>` (any directory: POST has no prefix check), then bakes the AVIF variants inline. DELETE removes the key and its variants, only under `productions/`, `about/`, `uploads/`.
Dev also writes and deletes the file under `public/`. R2 errors in dev become `r2Warning`; in prod they return 500. Variant bake errors are logged and ignored.
Reads `R2_*` env, with `S3_*` fallback in the variants helper; the content check in step 4 reads only `S3_*`.
Feeds: step 4 (variants exist or not).
Module: `app/api/r2-asset/route`, `lib/image-variants`, `lib/translit`

### Image bake and R2 mirror scripts

`scripts/bake-image-variants.ts` bakes AVIF variants for the whole bucket. There is no R2 to `public/` mirror: R2 is the only copy of admin uploads (#5 closed, workflow and script removed). `scripts/backfill-media.ts`, `scripts/fill-poster-dims.ts`, `scripts/fill-gallery-dims.ts` fill stored fields.
Feeds: steps 3, 4.
Module: `scripts/bake-image-variants`, `scripts/fill-poster-dims`, `scripts/fill-gallery-dims`

### Content scripts

One-off scripts (`fill-content`, `fix-dead-links`, `add-production`, `port-content-delta`, `fill-array-locales`, `seed-payload`) write through Payload Local API with `context.disableRevalidate`, so step 10 does not run. `translate-content` was removed (#6).
Feeds: step 3 only after the `productions` tag is busted (an admin save or a signed POST `/api/revalidate`); a redeploy alone may not do it; `npm run revalidate` posts the tag (needs `REVALIDATE_SECRET`).
Module: `scripts/fill-content`, `scripts/add-production`, `scripts/port-content-delta`, `scripts/revalidate`

### Production database guard

`payload.config` throws when `DATABASE_URL` points at Neon outside Vercel, unless `ALLOW_PROD_DB=1`.
Module: `payload.config`

## Known gaps

Short list; details and fixes are in the plan (number in brackets).

- Untranslated pages stay indexable with self canonicals and full hreflang (#7).
