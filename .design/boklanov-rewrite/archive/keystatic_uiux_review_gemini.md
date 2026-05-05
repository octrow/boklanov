Based on the screenshots provided and the Keystatic documentation, you have successfully modeled a very complex data
structure for your theater productions. However, from a UI/UX perspective, the editing experience is currently a very
long, flat wall of text fields.

Because you are a theater director, your CMS should feel visual, organized, and easy to scan. Here are several
actionable UI/UX improvements you can make to your Keystatic configuration to drastically improve the editing
experience.

---

### 1. Upgrade Image & File Paths to Visual Uploaders

**The Problem:** Currently, your "Poster image path" and "Gallery" fields are just plain text fields where you have to
manually type paths like `/productions/.../poster_de.webp` or `01.jpg`. This is prone to typos and gives you no visual
preview of the images.
**The Solution:** Use Keystatic's native `fields.image()` and `fields.file()` with the `directory` and `publicPath`
options.

*UI Benefit: You will get a visual image picker, drag-and-drop uploading, and thumbnail previews directly in the
editor.*

```typescript
// Replace your text field with this:
poster: fields.image({
  label: 'Poster Image',
  directory: 'public/productions', // Where the file is saved in your repo
  publicPath: '/productions/',     // How the path is written in your data
}),

// For your Tech Rider / Press Kit:
  techRider
:
fields.file({
  label: 'Tech Rider PDF',
  directory: 'public/downloads',
  publicPath: '/downloads/'
}),
```

### 2. Put Translations Side-by-Side

**The Problem:** You have `Title — RU`, `Title — EN`, `Title — DE` stacked vertically. As you scroll down to Synopsis,
Tagline, and Notes, this pattern takes up a massive amount of vertical space.
**The Solution:** Use `fields.object()` combined with the `layout` property to place translations side-by-side in a
3-column grid. Keystatic uses a 12-column grid system (`[4, 4, 4]` equals three equal columns).

*UI Benefit: Instantly compares translations horizontally and reduces the vertical scrolling of your form by 66%.*

```typescript
title: fields.object({
  ru: fields.text({ label: 'Title — RU' }),
  en: fields.text({ label: 'Title — EN' }),
  de: fields.text({ label: 'Title — DE' }),
}, {
  label: 'Titles',
  layout: [4, 4, 4], // Puts them in 3 columns side-by-side!
}),
```

*You can apply this exact pattern to Synopsis, Tagline, Director's note, etc.*

### 3. Group Related Fields (Create "Sections")

**The Problem:** The form is one continuous list. "Age rating", "Duration", "Awards", and "Notion IDs" all bleed into
one another.
**The Solution:** Use `fields.object()` as a visual wrapper (like an HTML `<fieldset>`) to group related fields
together.

*UI Benefit: Creates visual breaks in the UI, making the massive form digestible.*

```typescript
// Example grouping for Production Details
productionDetails: fields.object({
  status: fields.text({ label: 'Status' }),
  ageRating: fields.text({ label: 'Age Rating' }),
  duration: fields.integer({ label: 'Duration (minutes)' }),
  premiereYear: fields.integer({ label: 'Premiere Year' }),
}, {
  label: 'Production Details',
  description: 'Technical and scheduling details',
  layout: [6, 6, 6, 6] // Puts them in a 2x2 grid
}),
```

### 4. Improve the "Productions" List View

**The Problem:** In screenshot 2, your dashboard list only shows `Slug` and `Premiere year`. Because many premiere years
are empty, it's just a long list of slugs (`aiaccio`, `aibolit`). Slugs are hard to read.
**The Solution:** Use the `columns` property in your collection config to show the actual English or Russian Title, the
City, and the Status.

*UI Benefit: Makes finding specific plays instantly easier without clicking into them.*

```typescript
productions: collection({
  label: 'Productions',
  slugField: 'slug',
  // Add this to your config!
  columns: ['titleEn', 'city', 'premiereYear'],
  schema: { ... }
})
```

### 5. Upgrade Long Text to Rich Text (Markdoc)

**The Problem:** "Synopsis" and "Director's note" are standard text inputs. If you ever need to emphasize a word (
italic/bold) or add paragraph breaks, standard text fields will fail you.
**The Solution:** Upgrade these specific fields to `fields.markdoc.inline()`.

*UI Benefit: Gives you a mini WYSIWYG editor for formatting text cleanly.*

```typescript
directorsNote: fields.markdoc.inline({
  label: "Director's Note"
}),
```

### 6. Organize the Sidebar Navigation

**The Problem:** On the dashboard, your About pages are listed as "About — RU", "About — EN", "About — DE" directly in
the main sidebar. As you add more pages, this will get cluttered.
**The Solution:** Use the `ui.navigation` config to group your sidebar cleanly.

*UI Benefit: A cleaner, professional workspace sidebar.*

```typescript
// In your keystatic.config.ts root:
export default config({
  ui: {
    navigation: {
      'Theatre Productions': ['productions'],
      'About Pages': ['about-ru', 'about-en', 'about-de'],
      'Settings': ['tags', 'settings'], // If you add these later
    }
  },
  collections: { ... },
  singletons: { ... }
})
```

### Summary of what to do next:

1. Stop manually typing `.jpg` paths. Implement `fields.image()`.
2. Wrap your RU/EN/DE fields into `fields.object({ ... }, { layout: [4,4,4] })`.
3. Wrap your small metadata fields (Duration, Age, Year) into `fields.object` grids so they don't take up whole rows.
4. Add actual Titles to your Collection list view using `columns: []`.

Here are even more advanced, highly-targeted UI/UX improvements based on your screenshots. These suggestions focus on
making the editor "foolproof," hiding things you don't need to see, and stopping you from having to remember exact text
formats.

---

### 7. Clean Up "Arrays" with `itemLabel` and Object Structures

**The Problem:** In screenshot 6, your "Credits" are typed manually as a single text string:
`Режиссёр, автор инсценировки — Роман Бокланов`. If you have a long list of credits or awards, it's easy to make a typo,
and frontend developers have a hard time parsing that string.
**The Solution:** Break these into an `Object` inside an `Array`, and use Keystatic's `itemLabel` property.

*UI Benefit: The editor gives you two clean input boxes (Role & Name). When the item is collapsed in the list, Keystatic
will use the `itemLabel` to beautifully title the row.*

```typescript
credits: fields.array(
  fields.object({
    role: fields.text({ label: 'Role (e.g., Director)' }),
    name: fields.text({ label: 'Name (e.g., Roman Boklanov)' }),
  }),
  {
    label: 'Credits',
    // This makes the collapsed UI look like: "Director: Roman Boklanov"
    itemLabel: (props) => `${props.fields.role.value}: ${props.fields.name.value}`
  }
)
```

### 8. Use Conditional Fields to Hide the "Booking CTA" Clutter

**The Problem:** In screenshot 10, you have a checkbox for `Show «booking» CTA`. Below it, you have 4 text fields for
the CTA labels and URLs. Even if the checkbox is OFF, those 4 fields still sit on the screen taking up space.
**The Solution:** Use Keystatic's `fields.conditional()`.

*UI Benefit: The 4 input fields will magically appear ONLY when the checkbox is checked. If it is unchecked, the screen
stays clean.*

```typescript
bookingCTA: fields.conditional(
  fields.checkbox({
    label: 'Show «booking» CTA',
    defaultValue: false,
  }),
  {
    // If checked, show the inputs in a clean grid
    true: fields.object({
      labels: fields.object({
        ru: fields.text({ label: 'Label — RU' }),
        en: fields.text({ label: 'Label — EN' }),
        de: fields.text({ label: 'Label — DE' }),
      }, { layout: [4, 4, 4] }),
      url: fields.url({ label: 'Booking URL' }),
    }),
    // If unchecked, show nothing!
    false: fields.empty(),
  }
)
```

### 9. Prevent Typos with Dropdowns (`Select` and `Multiselect`)

**The Problem:** In screenshot 5 and 10, fields like `Age rating`, `Status`, and `Tags` are free-text fields or text
arrays. If an editor types "mono-performance" on one play, and "Mono-performance" on another, it will break your
website's filtering.
**The Solution:** Change these to `fields.select()` (choose one) and `fields.multiselect()` (choose many).

*UI Benefit: Editors just click a dropdown or check boxes. No typing required, ensuring 100% data consistency.*

```typescript
// Replace free-text Age Rating:
ageRating: fields.select({
  label: 'Age rating',
  options: [
    { label: '0+', value: '0' },
    { label: '6+', value: '6' },
    { label: '12+', value: '12' },
    { label: '16+', value: '16' },
    { label: '18+', value: '18' },
  ],
  defaultValue: '12',
}),

// Replace manually typing Tags:
  tags
:
fields.multiselect({
  label: 'Tags',
  options: [
    { label: 'Mono-performance', value: 'mono-performance' },
    { label: 'Puppet Theater', value: 'puppet-theater' },
    { label: 'Drama', value: 'drama' },
  ]
})
```

### 10. Hide "Legacy" Data Completely

**The Problem:** At the very bottom (screenshot 11), you have a field called `Notion IDs (legacy)`. You don't need to
edit this, but you probably don't want to delete it because it might break old website links.
**The Solution:** Use Keystatic's `fields.ignored()`.

*UI Benefit: The data stays perfectly safe in your codebase (JSON/YAML file), but it is completely erased from the UI.
You never have to look at it again.*

```typescript
// Replaces your current Notion ID text field
notionId: fields.ignored()
```

### 11. Make Adding Videos Easier (No Weird Codes)

**The Problem:** In screenshot 8, under Videos, the editor has to type `youtube:1GWFJ0jfPq4`. This forces the editor to
hunt for YouTube IDs and remember the specific formatting prefix.
**The Solution:** Use `fields.url()` and let your frontend developers extract the YouTube ID in the code. Or, give the
editor an explicit platform dropdown and a standard URL field.

*UI Benefit: The editor can just copy and paste the normal link from their browser address bar.*

```typescript
videos: fields.array(
  fields.object({
    platform: fields.select({
      label: 'Platform',
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' }
      ],
      defaultValue: 'youtube'
    }),
    url: fields.url({ label: 'Video URL' }),
  }),
  {
    label: 'Videos',
    itemLabel: props => props.fields.url.value || 'New Video'
  }
)
```

### 12. Add Helper Text (`description`)

**The Problem:** While you know what "Featured strip cover path" means, a new assistant or editor might not know what
dimensions that image should be.
**The Solution:** Add the `description` property to your fields.

*UI Benefit: Acts as built-in documentation right inside the editor.*

```typescript
featuredStripCover: fields.image({
  label: 'Featured Strip Cover',
  description: 'Used on the homepage carousel. Must be exactly 1920x1080 pixels.',
  directory: 'public/productions',
  publicPath: '/productions/'
})
```

Here is a third round of UI/UX improvements, focusing on automation, preventing errors, and making the data entry
process feel much faster.

---

### 13. Auto-Generate Slugs (URL Paths) from the Title

**The Problem:** In screenshot 3, the `Slug` field requires you to manually type `bury-me-behind-the-baseboard`. If you
change the title, you have to remember to manually update the slug. It is extra work.
**The Solution:** Tie the `slug` field directly to your English Title.

*UI Benefit: When you type the title, Keystatic will automatically generate a perfectly formatted, URL-safe slug for
you. It saves time and prevents typos in your website URLs.*

```typescript
schema: {
  title: fields.object({
    ru: fields.text({ label: 'Title — RU' }),
    // Notice how 'en' uses fields.slug() instead of fields.text()
    en: fields.slug({ name: { label: 'Title — EN' } }),
    de: fields.text({ label: 'Title — DE' }),
  }, { layout: [4, 4, 4] }),
}
// In your collection config, tell it to use the EN title for the file name:
slugField: 'title.en',
```

### 14. Build a "Theaters" Database (Use Relationships)

**The Problem:** In screenshot 4, you have to manually type the Theatre Name in RU, EN, and DE, plus its short name,
city, and country. If Roman performs at the "Bolshoi Puppet Theatre" for 5 different productions, you are typing this
data 5 times.
**The Solution:** Create a separate Collection called `Theaters`. Then, in your `Productions` collection, use a
`fields.relationship()`.

*UI Benefit: Instead of filling out 12 text boxes for the theater every time you add a play, you simply pick "Bolshoi
Puppet Theatre" from a searchable dropdown menu.*

```typescript
// 1. Create a Theaters collection in keystatic.config.ts
theaters: collection({
  label: 'Theaters',
  slugField: 'name',
  schema: { ... } // Put the RU/EN/DE names, city, and URLs here
}),

// 2. In your Productions collection, just reference it:
  theatre
:
fields.relationship({
  label: 'Performing Theatre',
  collection: 'theaters',
  description: 'Select the theater from your database'
})
```

### 15. Turn "Roles" and "Forms" into Fast Checklists

**The Problem:** In screenshot 5, "Roman's role(s)" requires the editor to click "Add", then type `director`. Then
click "Add", then type `performer`. Same for "Form" (`solo`) and "Lineage" (`btk`).
**The Solution:** These are finite lists. You don't invent new roles every day. Change these Array fields to
`fields.multiselect()`.

*UI Benefit: Replaces clunky "Add" buttons with a clean visual checklist. You just click the checkboxes and move on.*

```typescript
romansRoles: fields.multiselect({
  label: "Roman's Role(s)",
  options: [
    { label: 'Director', value: 'director' },
    { label: 'Performer', value: 'performer' },
    { label: 'Playwright', value: 'playwright' },
    { label: 'Set Designer', value: 'set-designer' },
  ]
}),
```

### 16. Enforce URL Formatting (`fields.url`)

**The Problem:** In screenshot 5 and 10, fields like `Theatre URL`, `Tickets URL`, and `Press link` are standard text
inputs. If an editor types `www.puppets.ru` instead of `https://www.puppets.ru`, it will break the link on your live
website.
**The Solution:** Change these from `fields.text()` to `fields.url()`.

*UI Benefit: Keystatic will show a red error if the editor pastes a broken or improperly formatted link, preventing
broken links on your live site.*

```typescript
ticketsUrl: fields.url({
  label: 'Tickets URL',
  description: 'Must include https://'
})
```

### 17. Structure your "Press / Reviews" for the Frontend

**The Problem:** In screenshot 9, "Press" is a list of text strings like: `Почему «Похороните... — sobaka.ru`. For your
frontend developer to make this look nice on the website (e.g., a quote block with a clickable publication name), they
have to write messy code to split that string apart.
**The Solution:** Use an array of objects for Press, so the editor inputs the specific parts of the review.

*UI Benefit: Makes it crystal clear for the editor what data is needed (Quote, Publisher, Link), and makes your website
design much more powerful.*

```typescript
press: fields.array(
  fields.object({
    quote: fields.text({ label: 'Quote / Headline', multiline: true }),
    publisher: fields.text({ label: 'Publication Name (e.g., sobaka.ru)' }),
    link: fields.url({ label: 'Link to Article' }),
  }),
  {
    label: 'Press & Reviews',
    itemLabel: props => props.fields.publisher.value || 'New Review'
  }
)
```

### 18. Protect the Site with Validation Rules

**The Problem:** Right now, an editor could accidentally hit "Save" on a completely empty production, and it would push
to the live website, resulting in a blank page or a site crash.
**The Solution:** Add `validation` rules to your most important fields.

*UI Benefit: The "Save" button will be blocked, and Keystatic will highlight required fields in red so the editor knows
exactly what is missing.*

```typescript
// Example: The poster image MUST be uploaded
poster: fields.image({
  label: 'Poster Image',
  directory: 'public/productions',
  validation: { isRequired: true } // <-- Prevents saving if empty!
}),

// Example: Must have at least ONE tag selected
  tags
:
fields.multiselect({
  label: 'Tags',
  options: [...],
  validation: { length: { min: 1 } } // <-- Must pick at least one
})
```
