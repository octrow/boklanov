---
target: admin
total_score: 17
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 3
timestamp: 2026-10-07T19-40-40Z
slug: app-payload-admin
---

Method: dual-agent (A: design review · B: detector + browser). Local prod build, local DB, temp user (removed).

## Heuristics: 17/40 (Poor)

| #   | Heuristic        | Score | Key issue                                                                                                               |
| --- | ---------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | System status    | 1     | No saved/saving/failed state for autosaved locales; failed PATCH → console.error only; nothing says "live"              |
| 2   | Real world       | 1     | H1 = slug; search by slug only; help text cites lib/booking.ts, options, R2, content/productions/                       |
| 3   | Control/freedom  | 2     | No undo for autosaved locale edits; rich-text pills rewrite URL                                                         |
| 4   | Consistency      | 1     | Two lookalike pill strips with different scope; EN chrome (Upload/Clear/Delete from R2); «Добавить Веха», «ложь/правда» |
| 5   | Error prevention | 1     | Delete from R2 is immediate while path stays until Save; ALL-mode textarea flattens rich text; Notion IDs editable      |
| 6   | Recognition      | 2     | Gallery rows `01.webp` no thumb; no poster column in list                                                               |
| 7   | Flexibility      | 2     | 10/page over 55 rows, creation-date sort                                                                                |
| 8   | Minimalism       | 2     | Triple-nested headings (Показы→Показы→Гастроли); API tab, Notion IDs visible; Media tab ~7,900px                        |
| 9   | Error recovery   | 2     | `Error: HTTP 4xx` in EN; failed autosave silent                                                                         |
| 10  | Help             | 3     | RU description on nearly every field incl. fallback cascades; dev tone                                                  |

## Specificity

Stock Payload chrome (login, dashboard, list, doc header) + bolted-on custom locale layer in a third inline style. Brand: fonts only; Title input Inter vs rich text Lora below it. Detector CLI clean (components/admin, app/(payload)); overlay 8/10/20/14 findings on dashboard/list/edit/about, mostly Payload stock. Real project-side: .field-description 2.8:1 (#9a9a9a), unlabeled title input LocalizedTextLike.tsx:177 (+ textarea), pill buttons named only "EN"/"ALL".

## Priority issues

- [P0] Save model depends on the URL ?locale=: active locale needs Save, inactive locales autosave invisibly; failures only in console. Breaks Principle 4. Fix: one model + visible per-field and page status. LocalizedDocContext.tsx, LocalizedTextLike.tsx, LocalizedRichTextTabs.tsx. → /impeccable harden, /impeccable clarify
- [P1] ALL-mode textarea for inactive rich-text locales saves via stringToLexicalState → drops headings/links/bold. Documented trade-off in code, invisible to Roman. Fix: read-only preview + "edit in RU" switch, or Lexical per column. LocalizedRichTextTabs.tsx:176-182,310. → /impeccable harden
- [P1] «Delete from R2» next to Clear, immediate + irreversible, EN confirm, file may be shared (poster/cover). Fix: remove or hide in ⋮ with RU consequence-naming confirm; translate buttons. ImagePathPreview.tsx:117. → /impeccable harden, /impeccable clarify
- [P1] Three locale controls (field pills, rich-text pills, header Локаль) with different scopes. Fix: one page-level RU/EN/DE/Все switch in sticky doc header + per-field "EN пусто" badges. → /impeccable distill
- [P2] List/title not in Roman's language: useAsTitle slug, slug search, 10/page, no poster, ложь/правда. Fix: useAsTitle identity.title, listSearchableFields, poster column, year desc, limit 50. collections/Productions.ts. → /impeccable clarify

## Personas

- Alex: 6 pages of 10; slug search; tab strip scrolls away on 7,900px Media tab; no locale shortcut.
- Sam: 5+ buttons named "EN"; active = grey fill/6px dot; labels without htmlFor; alt='preview'; status 11px grey, no aria-live; descriptions 2.8:1.
- Roman: admin defaults to EN UI; EN destructive verbs; code paths in help; «Идёт» on Russian productions vs past-tense rule; preview eye unlabeled; required asterisk lost on custom Title.

## Minor

Tab description says «слоган», field «Подзаголовок»; poster help says Upload "below" (it's above); «ПП/ДП» dates; API tab visible; Users «Name» untranslated; booking URL / featured order lack admin.condition; dashboard has no "view site" or recent edits; dark admin theme not inspected.

## Questions

1. If Principle 4 is "no hidden states", why does a URL query decide whether Save does anything?
2. Should the admin be RU-only with translation as an explicit step, removing every locale control?
3. Is «Статус: Идёт» a director's decision or a fact the site should derive from run dates?
