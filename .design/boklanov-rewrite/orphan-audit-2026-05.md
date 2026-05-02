# Cyrillic-only-Name orphan audit — 2026-05

**Phase 8.5** — one-shot audit of productions whose RU title was synthesised
via `MANUAL_SIBLING_PAIRS` in `scripts/_legacy/sync-from-notion.ts` rather
than read directly from the CSV `Name` field. These titles may be wrong,
incomplete, or in the wrong transliteration.

Source of the list: the `MANUAL_SIBLING_PAIRS` table in the frozen sync
script (search for `MANUAL_SIBLING_PAIRS`).

---

## Productions to verify

Each production below must be opened in Obsidian and the RU + EN titles
confirmed (or corrected) by Roman via the Properties panel. One commit per
production once confirmed.

| Slug | Current `title.ru` | Current `title.en` | Status |
|------|--------------------|--------------------|--------|
| `sugar-kid` | Сахарный ребёнок | Sugar Kid | ⬜ pending Roman confirmation |
| `kasztanka` | Каштанка | Kasztanka | ⬜ pending Roman confirmation |

---

## Workflow

1. Open the production in Obsidian:
   `content/productions/<slug>/index.mdx`
2. Check `title.ru` and `title.en` in the Properties panel.
3. If correct: add a ✅ row to this table + date.
4. If wrong: correct in Properties, **Cmd+S**, commit with message
   `content(<slug>): correct title — orphan audit`.
5. Update status in this table to ✅.

---

## Audit log

| Date | Slug | Action | Who |
|------|------|--------|-----|
| — | — | — | — |

---

## Context

The `MANUAL_SIBLING_PAIRS` table was needed because
`slugify("Сахарный ребёнок")` returned an empty string (the `\w` regex
doesn't match Cyrillic), so the RU entry was silently dropped during the
EN/RU sibling grouping step. The pair table manually re-attached the RU
row to its EN sibling.

After Phase 8.3, the sync script is retired. These titles are now static
in `index.mdx` frontmatter and can only be changed by direct edit.
Roman confirming them via Obsidian closes this audit permanently.
