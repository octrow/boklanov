# Proposal

## Why

Three small labels mislead (fourth critique, P2):

- The 404 page's own title ("Roman Boklanov — page not found", 4c5a714) is in the server HTML, but after hydration the browser tab shows the home title "Roman Boklanov — theatre director" (en and de confirmed).
- `/press` says "Headlines are translated", yet one headline is Finnish and another contains "TЮZ". The translations are content (Roma's to-do), but the note promises more than the site delivers.
- The press row's language tag is a raw code ("Vuosaari · FI"), which reads as a country code; the rest of the site now uses names.
- Also found: the production page's `alternates.languages` lists en and ru but not de.

## What Changes

- The 404 page keeps its own `<title>` after hydration in all locales.
- The `/press` note becomes accurate (proposed copy, to be confirmed in review): EN "Headlines are in English where a translation exists. Articles are in their original language, mostly Russian."; RU «Заголовки переведены, где есть перевод. Статьи на языке оригинала, в основном русском.»; DE "Überschriften sind übersetzt, wo eine Übersetzung vorliegt. Die Artikel sind in der Originalsprache, meist Russisch."
- The language tag shows the language name in the page's locale ("Finnish" / «финский» / "Finnisch") instead of the code; it still appears only when the article language differs from the page locale.
- Production pages list en, ru and de in `alternates.languages`.

## Capabilities

### New Capabilities

- `press-labels`: how `/press` describes headline translation and article language.
- `locale-alternates`: production pages advertise all three locale versions.

### Modified Capabilities

<!-- `missing-pages` is created by production-slug-404; this change ADDS a requirement to it (archive production-slug-404 first) -->

- `missing-pages`: adds "the 404 title survives hydration".

## Impact

- `app/[locale]/not-found.tsx` (title), `app/[locale]/press/page.tsx` (language name via `Intl.DisplayNames`), `messages/{en,ru,de}.json` (`press.originalNote`), `app/[locale]/productions/[slug]/page.tsx` (`alternates.languages.de`).
- Depends on `production-slug-404` (same not-found file); apply after it.
