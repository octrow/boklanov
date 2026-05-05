Going through your screenshots against the Keystatic docs — there's a lot to improve here. Organising by impact:

## 1. Form layout — the single biggest win

Your edit form is one long vertical column. For an entry that has dozens of fields plus markdown content, this is
exhausting. Two changes:

**Switch to `entryLayout: 'content'`** so the body content (synopsis or director's note as a markdoc field) gets
prominence and the rest moves to a sidebar:

```ts
productions: collection({
  entryLayout: 'content',
  format: { contentField: 'directorsNote' },
  // ...
})
```

**Group multilingual fields into 12-column objects.** Right now `Title — RU`, `Title — EN`, `Title — DE` stack
vertically and eat 300px of scroll each time. Use `fields.object` with `layout`:

```ts
title: fields.object({
  ru: fields.text({ label: 'RU' }),
  en: fields.text({ label: 'EN' }),
  de: fields.text({ label: 'DE' }),
}, {
  label: 'Title',
  layout: [4, 4, 4], // three columns side by side
}),
```

You have ~6 multilingual field groups (Title, Synopsis, Tagline, Director's note, Theatre name, Short name, City,
Premiere date, Booking CTA label). All of them benefit from this.

## 2. Collection list view is broken

Image 9 shows the Productions list with two columns both labelled "Slug" and a "Premiere year" that's blank for half the
entries. The `columns` config is misconfigured:

```ts
columns: ['title', 'theatreName', 'premiereYear', 'status']
```

Pick the most useful identifying fields. For a director with 30+ productions, the title (in your working language) plus
year plus status is what scans well. Add a `parseSlugForSort` if you want chronological default ordering.

## 3. Slug field appears duplicated

Image 8 shows two slug fields: a free-text "Slug — Folder name" and a "Slug *" with a Regenerate button. You're probably
using both `fields.text` and `fields.slug` simultaneously. Pick one — the [
`fields.slug`](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.slug) tied to the title field is the right
choice, with the collection's `slugField` pointing to it. Drop the separate text field.

## 4. Free-text fields where select belongs

Several fields are typed as `text` with a description listing the only valid values. That's a future data-cleanup
problem. Convert to `select`:

- **Country (ISO-2)** — description says "RU / KZ / DE / ES …". Make it a select with the actual list.
- **Age rating** — description says "0+, 6+, 12+, 16+, 18+". Select.
- **Status** — "Free-form. e.g. 'in-development'. Leave blank for live." This will become a mess. Select with: `live`,
  `in-development`, `archived`, `on-tour`, with conditional logic if needed.
- **Roman's role(s)** — currently an array of strings (`director`, `performer`). Use `fields.multiselect` with the
  actual valid roles. Same data, validated input.

## 5. Image paths as text fields

The Poster, Productions list cover, and Featured strip cover are all text fields holding paths like
`/productions/bury-me-behind-the-baseboard/poster.jpg`. Use [
`fields.image`](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.image) with `directory` and `publicPath`:

```ts
poster: fields.image({
  label: 'Poster',
  directory: 'public/productions',
  publicPath: '/productions/',
  validation: { isRequired: true },
}),
```

This gives you the upload UI, replaces the manual path-typing workflow, and means the editor doesn't need to know the
file system layout.

## 6. Gallery has no alt text or captions

Image 3 — gallery items are just `01.jpg`, `02.jpg`. No accessibility metadata, no photographer credit per image.
Convert to an array of objects:

```ts
gallery: fields.array(
  fields.object({
    image: fields.image({ label: 'Image', directory: '...', publicPath: '...' }),
    alt: fields.object({
      ru: fields.text({ label: 'Alt — RU' }),
      en: fields.text({ label: 'Alt — EN' }),
      de: fields.text({ label: 'Alt — DE' }),
    }, { layout: [4, 4, 4] }),
    credit: fields.text({ label: 'Photographer credit' }),
  }),
  { label: 'Gallery', itemLabel: (props) => props.fields.image.value || 'Image' }
),
```

## 7. Credits are unstructured strings

Image 5 — `Режиссёр, автор инсценировки — Роман Бокланов`, `Director — Roman Boklanov`,
`Regie, Autor der Inszenierung — Roman Boklanov`. You're storing the same data three times as freeform strings. This
blocks:

- Re-rendering credits in a different layout (table, grouped by role)
- Auto-translating role labels
- Querying "all productions where Maksim Morozov is an actor"

Better:

```ts
credits: fields.array(
  fields.object({
    role: fields.select({
      label: 'Role',
      options: [
        { label: 'Director', value: 'director' },
        { label: 'Actor', value: 'actor' },
        { label: 'Production designer', value: 'productionDesigner' },
        { label: 'Lighting designer', value: 'lightingDesigner' },
        { label: 'Producer', value: 'producer' },
      ],
      defaultValue: 'actor',
    }),
    name: fields.text({ label: 'Name' }),
  }),
  { label: 'Credits', itemLabel: (props) => `${props.fields.role.value} — ${props.fields.name.value}` }
)
```

The role labels translate at render time. One source of truth, three languages out.

Apply the same pattern to **Awards** (title, festival, year, category, person), **Press** (outlet, title, URL, date,
language), **Festivals** (name, year, city).

## 8. Tags should be a separate collection

Image 1 shows tags as `mono-performance`, `roman boklanov`, `theater` typed inline. Make tags a collection with a
relationship field. Renaming a tag once propagates everywhere; a tag-index page becomes trivial; typos become
impossible. Same for **Form** (`solo`) and **Lineage** (`btk`, `kudashov`) — those are taxonomies, not freeform.

## 9. Conditional logic for dependent fields

Image 1 has "Show «booking» CTA" checkbox followed by three label fields and a URL override. Image 1 also has "Show on
home featured strip" checkbox followed by "Featured order". Both are perfect [
`fields.conditional`](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.conditional) cases:

```ts
bookingCta: fields.conditional(
  fields.checkbox({ label: 'Show booking CTA', defaultValue: true }),
  {
    true: fields.object({
      label: fields.object({
        ru: fields.text({ label: 'RU' }),
        en: fields.text({ label: 'EN' }),
        de: fields.text({ label: 'DE' }),
      }, { layout: [4, 4, 4] }),
      urlOverride: fields.url({ label: 'URL override (skips mailto)' }),
    }),
    false: fields.empty(),
  }
)
```

Editor doesn't see fields that don't apply. Less cognitive load.

## 10. Videos as `youtube:1GWFJ0jfPq4`

That protocol-prefix string is fragile. Use a conditional with a select for provider:

```ts
videos: fields.array(
  fields.conditional(
    fields.select({
      label: 'Provider',
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
      ],
      defaultValue: 'youtube',
    }),
    {
      youtube: fields.text({ label: 'YouTube ID' }),
      vimeo: fields.text({ label: 'Vimeo ID' }),
    }
  )
)
```

## 11. Inconsistent translation patterns

You mix two approaches:

- Per-field-language: `Title — RU`, `Title — EN`, `Title — DE`
- Per-array-language: `RU credits` / `EN credits` / `DE credits` as separate arrays

Pick one. The structured approach (one credits array with role + name, role translates at render time) is strictly
better than three parallel arrays. For pure-text fields like Title, the object-with-layout pattern from §1 wins.

## 12. Navigation grouping

Image 10 — `About — RU`, `About — EN`, `About — DE` are three separate singletons in the sidebar. Group them:

```ts
ui: {
  navigation: {
    Content: ['productions'],
      'About page'
  :
    ['aboutRu', 'aboutEn', 'aboutDe'],
  }
,
}
```

## 13. Add `previewURL` and `template`

Two quick wins from the docs:

- [`previewURL`](https://docsmill.dev/npm/@keystatic/core@latest#/.Collection) on the productions collection so editors
  can preview drafts. With Next.js draft mode this is genuinely useful.
- [`template`](https://docsmill.dev/npm/@keystatic/core@latest#/.Collection) pointing at a skeleton entry so new
  productions start with the right field structure (default credits roles, default tags, etc.) instead of a blank form.

---

If you tackle these in order, **#1 (layout) and #4 (selects) ship the biggest editor-experience improvement same-day**.
**#5–#8 (image fields, gallery alt text, structured credits/awards/press, tags-as-collection)** are the bigger refactors
but they unblock everything else — better data structure, better rendering, easier translation. The rest is polish.

Want me to draft the actual `keystatic.config.ts` for any specific section?

More — these go beyond the first round and focus on data architecture, workflow, and the smaller UX fixes that compound.

## 14. Normalise theatre data into its own collection

The production form has Theatre name (RU/EN/DE), Short name (RU/EN/DE), City (RU/EN/DE), Country, Theatre URL, Founded
year — that's seven theatre attributes embedded in every production entry. If a theatre changes its name or you stage a
second production at the same theatre, you're editing duplicated data.

```ts
theatres: collection({
  label: 'Theatres',
  slugField: 'slug',
  schema: {
    slug: fields.slug({ name: { label: 'Identifier' } }),
    name: fields.object({ ru: ..., en: ..., de: ... }, { layout: [4, 4, 4] }),
    shortName: fields.object({ ru: ..., en: ..., de: ... }, { layout: [4, 4, 4] }),
    city: fields.relationship({ collection: 'cities' }),
    country: fields.select({ options: [...iso2list] }),
    foundedYear: fields.integer(),
    url: fields.url(),
  }
}),

// in productions
  theatre
:
fields.relationship({ collection: 'theatres' }),
```

The production form gets shorter; theatre data stays consistent across productions; future edits happen in one place.

## 15. Same logic for people, cities, festivals

Three more collections to normalise:

- **`people`** — director, actors, designers, producers reused across productions. Then `credits` becomes
  `{ role: select, person: relationship('people') }`. Querying "all productions Maksim Morozov is in" becomes one line.
- **`cities`** — Tour cities right now only have Russian names (`Лондон`, `Эдинбург`, `Берн`…). On a tri-lingual site
  that's broken. Make cities a collection with `{ name: { ru, en, de }, country, slug }`. Tour cities becomes
  `array(relationship('cities'))`.
- **`festivals`** — Awards mention festivals (`Международный фестиваль «Он.Она.Они»`) but festivals also have their own
  field. Festival is an entity, treat it as one. Awards then carry
  `{ festival: relationship('festivals'), category, year, recipient: relationship('people') | null }`.

This is the biggest schema decision. Postpone if you don't want to migrate now, but at least don't add more flat string
fields.

## 16. Premiere date — use `fields.date`, format at render

You currently store premiere date three times as free text:

- `Premiere date (free text) — RU`: `24 марта 2021 г.`
- `Premiere date (free text) — EN`: `24 March 2021`
- `Premiere date (free text) — DE`: `24. März 2021`

Plus a separate `Premiere year: 2021`. All four fields hold the same information. Replace with one ISO date:

```ts
premiereDate: fields.date({ label: 'Premiere date' }),
```

Then format at render with `Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(date))`. Year derives via
`new Date(date).getFullYear()`. Three free-text fields removed, no chance of inconsistency between languages.

If you genuinely need fuzzy dates ("Spring 2021"), keep one optional override field — but that should be the exception.

## 17. Director's note — rich text, not single-line

Director's note is currently `fields.text`. For a personal piece of writing, you want paragraphs, emphasis, maybe a
quote. Use [`fields.markdoc.inline`](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.markdoc) so the content
stays in the same file but gets a real editor:

```ts
directorsNote: fields.object({
  ru: fields.markdoc.inline({ label: 'RU' }),
  en: fields.markdoc.inline({ label: 'EN' }),
  de: fields.markdoc.inline({ label: 'DE' }),
}, { label: "Director's note" }),
```

Same for Synopsis if you ever want it longer than a single sentence.

## 18. PDF assets — `fields.pathReference`, not text URLs

Tech rider PDF URL and Press kit PDF URL are text fields. Editor types `/path/to/file.pdf` from memory. Use [
`fields.pathReference`](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.pathReference) with a glob that
restricts to actual files in the repo:

```ts
techRider: fields.pathReference({
  label: 'Tech rider',
  pattern: 'public/tech-riders/**/*.pdf',
}),
```

The combobox shows existing PDFs and refuses paths that don't exist. No more typos, no more 404s.

## 19. URL fields — `fields.url`, not text

Theatre URL, Tickets URL, Booking CTA URL override are all `fields.text`. Switch to [
`fields.url`](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.url) which sanitises the input via
`@braintree/sanitize-url`. Cheap upgrade that prevents `javascript:` URLs and other rendering bugs.

## 20. `Form` should be a single select, not an array

Image 5 — `Form` is an array containing only `solo`. A production has one form (mono-performance, ensemble, immersive,
etc.). Single select:

```ts
form: fields.select({
  label: 'Form',
  options: [
    { label: 'Mono-performance', value: 'mono' },
    { label: 'Ensemble', value: 'ensemble' },
    { label: 'Immersive', value: 'immersive' },
    { label: 'Reading', value: 'reading' },
  ],
  defaultValue: 'ensemble',
}),
```

## 21. Validation and required fields

Right now only Slug shows the `*`. Other fields that should be required:

```ts
title: fields.object({
  ru: fields.text({ label: 'RU', validation: { isRequired: true, length: { min: 1, max: 100 } } }),
  // ...
}),
  synopsis
:
fields.text({
  validation: { length: { min: 50, max: 200 } }, // SEO-friendly length
}),
  premiereDate
:
fields.date({ validation: { isRequired: true } }),
  status
:
fields.select({
  options: [...],
  defaultValue: 'live', // never blank
}),
```

Required + length validation prevents the half-empty entries that always emerge after a year of editing.

## 22. The two ordering fields are confusing

Image 1 has both:

- `Featured order (1, 2, 3 …)`
- `Order in /productions grid`

Different orderings for different views. Without context the editor reaches for whichever is on top. Two fixes:

1. Wrap them in a labelled object with a description: `Display order — controls where this production appears in lists`.
2. Make `Featured order` conditional on the `Show on home featured strip` checkbox so it only appears when relevant:

```ts
featured: fields.conditional(
  fields.checkbox({ label: 'Show on home featured strip' }),
  {
    true: fields.integer({
      label: 'Featured order',
      description: 'Lower numbers appear first',
      validation: { min: 1 }
    }),
    false: fields.empty(),
  }
),
  gridOrder
:
fields.integer({
  label: 'Productions grid order',
  description: 'Order on /productions page (lower = first)',
}),
```

## 23. Default sort by premiere year, not slug

Collection list is sorted by slug alphabetically, which is meaningless for a portfolio. Use [
`parseSlugForSort`](https://docsmill.dev/npm/@keystatic/core@latest#/.Collection) to sort by year:

```ts
parseSlugForSort: (slug) => {
  // requires a per-slug lookup or a slug naming scheme
  return slug;
},
```

Better: derive from `premiereYear` in the entry. If `parseSlugForSort` only sees the slug string, switch to a slug
naming convention like `2021-bury-me-behind-the-baseboard` and parse the year prefix. Or just add `premiereYear` to
`columns` so the editor can sort by clicking the header.

## 24. Move "Notion IDs (legacy)" out of the main flow

Image 11 — `Notion ID (RU): ee2d7bea11484e16bcb03effc276a719`. This is migration metadata sitting next to live content
fields. Two options:

**Option A — quarantine in a collapsed section:**

```ts
legacyMetadata: fields.object({
  notionIdRu: fields.text({ label: 'Notion ID (RU)' }),
  notionIdEn: fields.text({ label: 'Notion ID (EN)' }),
}, {
  label: 'Legacy metadata',
  description: 'From Notion migration. Do not edit. Will be removed.',
}),
```

**Option B — write a script to read these for cross-referencing, then drop the fields entirely.** Cleaner. The data they
encode (identity in old system) probably has no further utility once the migration's verified.

## 25. Lock the slug after first save

The Slug field is editable forever. If a slug changes after publish, every external link to that production breaks.
Keystatic can't enforce this natively, but you can:

- Document a team rule: "Don't change slugs after publish."
- Or build an automated redirect map by reading old slugs on each commit (Git history makes this possible).
- Or use the `Regenerate` button only on new entries; treat the slug as frozen on existing ones.

## 26. `Runs` needs structure or a separate collection

Image 11 — `Runs` exists with no entries and no schema visible. If a "run" is a series of performances at a venue, the
right shape is its own collection because runs are time-bound and you'll want queries like "upcoming performances":

```ts
runs: collection({
  schema: {
    production: fields.relationship({ collection: 'productions' }),
    venue: fields.relationship({ collection: 'theatres' }),
    city: fields.relationship({ collection: 'cities' }),
    dateStart: fields.date(),
    dateEnd: fields.date(),
    ticketsUrl: fields.url(),
  }
})
```

If kept inline on the production, at least give it a real schema with the same fields.

## 27. Press needs language tagging

Image 2 mixes Russian press articles with English ones in one array (`Почему «Похороните меня…»` next to
`The Bolshoi Puppet Theatre presented…`). Renderer can't filter by user's locale because the data isn't tagged:

```ts
press: fields.array(
  fields.object({
    title: fields.text({ label: 'Article title' }),
    outlet: fields.text({ label: 'Outlet' }),    // or relationship if you want
    url: fields.url(),
    date: fields.date(),
    language: fields.select({
      options: [
        { label: 'RU', value: 'ru' },
        { label: 'EN', value: 'en' },
        { label: 'DE', value: 'de' },
      ]
    }),
  }),
  { itemLabel: (props) => `${props.fields.outlet.value} — ${props.fields.title.value}` }
)
```

## 28. Awards need a `recipient` field

Image 2 — `Лауреат в номинации «Лучшая мужская роль» (Максим Морозов) — III Международный фестиваль…`. The recipient (
Maksim Morozov) is in parentheses inside the string. As an object:

```ts
{
  category: 'Best male performance',
    recipient
:
  relationship('people'), // → Maksim Morozov
    festival
:
  relationship('festivals'),
    year
:
  2021,
    type
:
  'winner' | 'nominee' | 'special',
}
```

Then a person's profile page can render "awards received" automatically.

## 29. Section grouping with descriptions

Image 7 — "Theatre" / "Theatre name" / "Short name" / "City" / "Country" appear as flat bold headers. Use nested
`fields.object` to create real hierarchy with descriptions:

```ts
theatre: fields.object({
  name: fields.object({ ... }, { label: 'Name', layout: [4, 4, 4] }),
  shortName: fields.object({ ... }, { label: 'Short name', layout: [4, 4, 4] }),
  location: fields.object({
    city: fields.relationship({ collection: 'cities' }),
    country: fields.select({ ... }),
  }, { label: 'Location', layout: [6, 6] }),
  url: fields.url({ label: 'Theatre URL' }),
}, {
  label: 'Theatre',
  description: 'Where the production is staged. Pick from the theatres collection or add a new one.',
}),
```

One section header, three subsections, clear hierarchy.

## 30. UI brand customisation

Add your branding to the admin UI:

```ts
ui: {
  brand: {
    name: 'boklanov.com',
      mark
  :
    ({ colorScheme }) => (
      <img
        src = { colorScheme === 'dark' ? '/admin-logo-dark.svg' : '/admin-logo-light.svg'
  }
    height = { 24 }
    alt = "boklanov.com"
      / >
  ),
  }
,
  navigation: {
    Productions: ['productions'],
      Reference
  :
    ['theatres', 'people', 'cities', 'festivals', 'tags'],
      Pages
  :
    ['aboutRu', 'aboutEn', 'aboutDe'],
  }
,
}
```

Small change, but it makes the admin feel intentional rather than scaffolded.

## 31. Keystatic Cloud — if anyone else edits

If anyone other than you edits content (Roma? a manager?), GitHub mode requires they have a GitHub account with write
access. [Keystatic Cloud](https://keystatic.cloud) skips that — non-technical editors can sign in with email and edit
without touching Git. Free for up to 3 users per team.

Worth it specifically if you ever want Roma to update tour cities or press from the road without learning Git.

## 32. Field descriptions everywhere

Right now only Slug, Country, Status, Age rating, Featured strip cover have descriptions. Add them to the rest, written
for the editor (not the developer):

```ts
synopsis: fields.text({
  description: 'One-sentence pitch. Shown on cards and in search results. 50–200 chars.',
}),
  duration
:
fields.integer({
  description: 'Performance length in minutes, including intermission.',
}),
  ageRating
:
fields.select({
  description: 'Russian standard rating (0+, 6+, 12+, 16+, 18+).',
}),
```

Two-week-from-now you (and anyone else) won't remember which field means what. Descriptions are the cheapest
documentation possible.

## 33. Featured strip cover — fall-back behaviour

Description says "Overrides productions photo on the home featured strip." Visible in image 1. The implication is "leave
blank to use poster." Make that explicit and visual: when blank, show a thumbnail of the poster with a label like "Will
use poster." Keystatic doesn't render that automatically, but you can pre-populate the field with the poster path on
entry creation via `template`.

## 34. Renaming `Roman's role(s)`

The schema key for this is presumably `romansRoles` or similar. As a backend dev you know names matter — this one is too
coupled to one person. If the site ever expands or gets reused, `directorRoles` or `creatorRoles` is more durable:

```ts
creatorRoles: fields.multiselect({
  label: "Roman's roles in this production",
  options: [
    { label: 'Director', value: 'director' },
    { label: 'Performer', value: 'performer' },
    { label: 'Author', value: 'author' },
    { label: 'Producer', value: 'producer' },
  ],
}),
```

Label stays personal; key stays generic. (Though for a `boklanov.com` repo you'll never reuse, this is bikeshedding —
skip if you don't care.)

## 35. Things Keystatic can't do — worth knowing

Some friction is structural to Keystatic and won't be fixed by config:

- **No bulk edit** across entries. Want to add a tag to 30 productions? Script it via the file system.
- **No "duplicate this entry"** button. Closest is `template` for new entries. If you need true cloning, write a CLI
  helper.
- **No autosave / unsaved-changes indicator.** The Save button doesn't change colour when dirty. Train yourself to
  Cmd-S.
- **No sticky table of contents** for long forms. Mitigate by splitting fields into more `fields.object` sections so the
  form is shorter visually.
- **No tag-pill renderer.** Tags display as full-width array items. You can't change this without forking the UI.
- **No per-language editor toggle.** Editors see all three languages stacked. The 12-column object layout from §1 is the
  closest you can get.

If any of these are deal-breakers, file feature requests on the Keystatic repo. They're an active project and
responsive.

---

If you want, I can put together a full `keystatic.config.ts` migration showing the structured-credits +
theatre-collection + people-collection version. That's the highest-leverage refactor and worth doing before adding more
productions.
