Full version (original): .design/boklanov-rewrite/archive/DESIGN_BRIEF.md
TARGET: `boklanov.com` (Vercel).
DEADLINE: 2026-05-06.
CONTEXT: Roman Boklanov, puppet/object/kids theatre director. Independent (no troupe). Exited RU 2022; enforce past-tense for RU work.

STACK: Next.js 15, SSG, MDX, Obsidian + obsidian-git CMS.
I18N: RU/EN full parity. DE UI-chrome only (`messages/de.json`). Press keeps original language.
ANALYTICS: PostHog (`booking_cta_click` event only).

ROUTES:
`/` Statement, 4-6 featured items, filterable grid
`/productions` Query-string filtered grid
`/productions/[slug]` Detail layout (cover, dual-title, chips, synopsis, credits, media, CTAs)
`/about` Bio, lineage, staging geography
`/awards` Grouped timeline
`/press` Original language card grid
`/archive` Demoted CV (readings, workshops)
`/contact` TG/IG (primary), pre-filled mailto (secondary)

UX/BEHAVIOR:
Target: EU curator, mobile viewport, 90-second session.
Priority: Booking magnet > EPK > archive.
Search: Cmd-K palette (transliterated index).

TOKENS & CSS VARS:
Light theme: `--paper:#F4F2EC` `--ink:#161514` `--ink-mute:#605C56` `--rule:#1615141A` `--accent:#6B0F0F`
Dark theme: `--paper:#0E0D0C` `--ink:#E8E5DD` `--ink-mute:#9E9A92` `--rule:#E8E5DD1A` `--accent:#A82626`
Rule: Use `--accent` STRICTLY for booking CTAs and hover underlines.
Typography (OFL/Cyrillic): Lora (Display), Inter (Body), JetBrains Mono (Metadata/Captions). No logo. Text only.
Grid: 4px base. Mobile: 1-col/20px gap. Tablet: 8-col/24px gap. Desktop: 12-col/32px gap. 65ch measure.
Motion: 200ms page fade. 150ms underline hover. 320ms slate-strike one-shot (fallback: static edition-frame).

ANTI-PATTERNS (DO NOT IMPLEMENT):
AI gradients, glassmorphism, kinetic typography, hero videos, bento grids, generic Tailwind shadows, infinite spinners, parallax, scroll-driven entrances.

ANTI-PATTERN SUPERSESSIONS:
2026-05-02: "Drop-shadow glow on cards" (DESIGN.md §11 addition post-brief) narrowed → `--specimen-rule` inset 1px on photographic plates only (≥768px, scoped to SpecimenPlate.module.css). See full archive §8.1 + DESIGN_v2_PROPOSAL.md §2.1.
2026-05-02: "Coloured chip pills" (DESIGN.md §11 addition post-brief) narrowed → specimen mono labels (uppercase, mono, hairline underline, no fill, no radius, em-dash separator). See full archive §8.1 + DESIGN_v2_PROPOSAL.md §2.2.
2026-05-02: "Generic Tailwind defaults (`rounded-2xl shadow-xl`)" narrowed → `--border-radius-form: 2px` on form chrome only (input, textarea, select, dialog, kbd). NEVER on cards, images, buttons. Outset shadow-xl still banned. See full archive §8 + DESIGN_v2_PROPOSAL.md §2.3.

YAML DATA FILE (`content/productions/[slug]/index.yaml`) + prose siblings (`body.{ru,en,de}.md`):
*(2026-05-02 was a single `index.mdx` with frontmatter; split 2026-05-04 — see active CONTENT.md.)*
Required structure:
```yaml
slug: string
title: { ru: string, en: string, de: string | null }
synopsis: { ru: string, en: string, de: string | null }
theatre: { name: string, shortName: string, city: string, country: string, url: string }
year: number
premiereDate: { ru: string, en: string }
ticketsUrl: string
ageRating: string
durationMin: number
role: string
form: string[]
lineage: string[]
credits: { ru: array, en: array } # [{ role, name, url }]
poster: { src: string, credit: string | null }
gallery: array # [{ src, credit, caption: { ru, en } }]
videos: array # [{ provider, id }]
awards: array # [{ name, category, year, city }]
press: array # [{ title, outlet, url, language }]
tour: array # [{ city }]
externalLinks: array # [{ label, url }]
techRider: string | null
pressKit: string | null
featured: boolean
tags: string[]
```

OPEN TASKS:
1. Input photographer names into `poster.credit` and `gallery[].credit` via Obsidian.
2. Link PDF/ZIP paths to `techRider` and `pressKit` fields.
3. Validate legal hosting permissions for production photos.
