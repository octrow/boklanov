# Tasks

## 1. Cover

- [x] 1.1 `.cover`: stack image and figcaption (`flex-direction: column; align-items: center`) and move `max-height`/`overflow: hidden` to the image wrapper so the caption is never clipped; verify 390 and 1440 screenshots of vaikenemisen-kielioppi and nikita
- [x] 1.2 Add the localized "Photo:" / «Фото:» / "Foto:" label before the credit; verify RU/EN/DE
- [x] 1.3 Fallback `<Image>`: replace `width={0} height={0}` with `posterW`/`posterH`; verify the rendered `<img>` attributes on a production with an uploads/ poster

## 2. Alt

- [x] 2.1 Build posterAlt title-first from trimmed parts; add a tiny assert-based check (or unit test if a runner exists) for a title with a trailing space; verify no " ," on vaikenemisen-kielioppi

## 3. Ship

- [ ] 3.1 Lint, build, commit to main, verify on boklanov.com, changelog entry; add "credit names on EN pages are Cyrillic" to Roma's content to-dos
