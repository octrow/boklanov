'use client'

/**
 * KeystaticEnhancements — WS-6 / WS-7 runtime DOM enhancements.
 *
 * Implements via MutationObserver (same pattern as ImagePathPreview) because
 * patch-package against the minified @keystatic/core bundle is fragile across
 * upgrades. The component runs once on mount and re-triggers on route changes.
 *
 * Three enhancements:
 *   1. Tab strip — wraps top-level [role="group"] sections in the entry form
 *      into tab panels. Tab labels come from the group's aria-labelledby text.
 *      Active tab is mirrored to/from the URL hash (#tab=<slug>).
 *   2. body[data-ks-dirty] reflection — watches the toolbar Save button's
 *      disabled state; when the form has unsaved changes the save button is
 *      enabled. Toggles body[data-ks-dirty='true'|'false'] accordingly.
 *   3. Slug Regenerate hidden — hides the Regenerate button and its divider
 *      line in the slug field so only the URL slug input is visible.
 */

import { useEffect } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────

const FORM_ID = 'item-edit-form'
const TAB_STRIP_MARK = 'data-ks-tabs-init'

/** Allowlist of top-level group labels from the productions schema (WS-1).
 *  Acts as a backstop: even if the structural filter below misidentifies
 *  nested groups, the label must match one of these. Update if WS-1 group
 *  labels in keystatic.config.ts change. */
const TOP_LEVEL_LABELS = new Set([
  'identity',
  'media',
  'production',
  'taxonomy',
  'team',
  'recognition',
  'performance history',
  'settings'
])

// ── Helpers ────────────────────────────────────────────────────────────────

/** Slugify a label for use in URL hash */
function toTabId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Get the current active tab from URL hash */
function getHashTab(): string | null {
  if (typeof window === 'undefined') return null
  const m = window.location.hash.match(/^#tab=(.+)$/)
  return m ? decodeURIComponent(m[1]) : null
}

/** Set the URL hash without scrolling */
function setHashTab(id: string): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.hash = `tab=${encodeURIComponent(id)}`
  window.history.replaceState(null, '', url.toString())
}

// ── Tab strip ─────────────────────────────────────────────────────────────

/**
 * Find top-level [role="group"] elements that correspond to the WS-1
 * fields.object sections (Identity, Media, Production, etc.).
 *
 * Why two filters?
 *   1. Structural — a top-level group has no [role="group"] ancestor inside
 *      the form. Nested groups (theatre inside Production, gallery item
 *      objects, etc.) all have an ancestor group and are excluded.
 *   2. Label allowlist — even if the structural filter misidentifies a
 *      group, the label must be one of the eight known top-level labels.
 *
 * Earlier versions of this function used `g.parentElement === topLevelParent`
 * to identify peers, but Keystatic wraps each top-level field in its own
 * `<div className="span N">` (ObjectFieldInputEntry in @keystatic/core), so
 * every group has a DIFFERENT parentElement. The check rejected everything
 * and the tab strip never appeared — that's the bug this rewrite fixes.
 */
function findTabGroups(form: HTMLElement): HTMLElement[] {
  const all = Array.from(
    form.querySelectorAll<HTMLElement>('[role="group"][aria-labelledby]')
  )

  return all.filter((g) => {
    // Structural: no [role="group"] ancestor inside the form.
    let p: HTMLElement | null = g.parentElement
    while (p && p !== form) {
      if (p.getAttribute('role') === 'group') return false
      p = p.parentElement
    }
    // Label: must match the known top-level set (case-insensitive — Keystatic
    // capitalises some labels in the rendered Text element).
    return TOP_LEVEL_LABELS.has(getLabelText(g).toLowerCase())
  })
}

function getLabelText(group: HTMLElement): string {
  const labelledBy = group.getAttribute('aria-labelledby')
  if (!labelledBy) return 'Section'
  const labelEl = document.getElementById(labelledBy)
  return labelEl?.textContent?.trim() || 'Section'
}

/** Find a Keystatic ActionButton already in the DOM and clone its className
 *  so the tab buttons inherit Keystatic's font, padding, hover, and focus
 *  styling. Same trick ImagePathPreview.tsx uses for its Upload button. */
function harvestKeystaticButtonClass(): {
  className: string
  textSpanClass: string
} {
  const ref = document.querySelector<HTMLButtonElement>(
    'button.kui\\:ActionButton:not([data-ks-tab])'
  )
  const span = ref?.querySelector<HTMLSpanElement>(
    'span.kui\\:ActionButton-text'
  )
  return {
    className: ref?.className ?? 'kui:ActionButton kui:reset',
    textSpanClass: span?.className ?? 'kui:ActionButton-text'
  }
}

function buildTabStrip(
  cellsByTab: Map<string, { label: string; cells: HTMLElement[] }>,
  activeId: string,
  onSelect: (id: string) => void
): HTMLElement {
  const strip = document.createElement('div')
  strip.className = 'ks-tabs'
  strip.setAttribute(TAB_STRIP_MARK, '1')
  strip.setAttribute('role', 'tablist')

  const { className, textSpanClass } = harvestKeystaticButtonClass()

  for (const [id, { label }] of cellsByTab) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = className
    btn.dataset.ksTab = id
    btn.setAttribute('role', 'tab')
    btn.setAttribute('aria-selected', id === activeId ? 'true' : 'false')
    const labelSpan = document.createElement('span')
    labelSpan.className = textSpanClass
    labelSpan.textContent = label
    btn.appendChild(labelSpan)
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      onSelect(id)
    })
    strip.appendChild(btn)
  }

  // Mobile nav bar: shown below 768 px instead of the button strip.
  // A native <select> is avoided because iOS Safari overrides its colors with
  // system UI regardless of CSS, making it look like a broken form field.
  // This bar is fully CSS-controlled: prev/next arrows + current tab label +
  // position counter so the editor always knows where they are.
  const tabIds = Array.from(cellsByTab.keys())
  const tabCount = tabIds.length

  const mobileNav = document.createElement('div')
  mobileNav.className = 'ks-tab-mobile-nav'
  mobileNav.setAttribute('aria-hidden', 'true') // desktop screen readers use the real buttons

  const prevBtn = document.createElement('button')
  prevBtn.type = 'button'
  prevBtn.className = 'ks-tab-arrow ks-tab-arrow--prev'
  prevBtn.setAttribute('aria-label', 'Previous tab')
  prevBtn.textContent = '‹'

  const labelEl = document.createElement('span')
  labelEl.className = 'ks-tab-mobile-label'
  const currentLabel = cellsByTab.get(activeId)?.label ?? ''
  const currentIndex = tabIds.indexOf(activeId)
  labelEl.innerHTML = `<span class="ks-tab-mobile-name">${currentLabel}</span><span class="ks-tab-mobile-count">${currentIndex + 1} / ${tabCount}</span>`

  const nextBtn = document.createElement('button')
  nextBtn.type = 'button'
  nextBtn.className = 'ks-tab-arrow ks-tab-arrow--next'
  nextBtn.setAttribute('aria-label', 'Next tab')
  nextBtn.textContent = '›'

  prevBtn.addEventListener('click', () => {
    const idx = tabIds.indexOf(getHashTab() ?? tabIds[0])
    onSelect(tabIds[(idx - 1 + tabCount) % tabCount])
  })
  nextBtn.addEventListener('click', () => {
    const idx = tabIds.indexOf(getHashTab() ?? tabIds[0])
    onSelect(tabIds[(idx + 1) % tabCount])
  })

  mobileNav.appendChild(prevBtn)
  mobileNav.appendChild(labelEl)
  mobileNav.appendChild(nextBtn)
  strip.appendChild(mobileNav)

  return strip
}

function applyTabVisibility(
  cellsByTab: Map<string, { label: string; cells: HTMLElement[] }>,
  activeId: string
) {
  for (const [id, { cells }] of cellsByTab) {
    const visible = id === activeId
    for (const cell of cells) {
      cell.style.display = visible ? '' : 'none'
    }
  }
  // Update active button state on the strip.
  document
    .querySelectorAll<HTMLButtonElement>(`[${TAB_STRIP_MARK}] [data-ks-tab]`)
    .forEach((btn) => {
      btn.setAttribute(
        'aria-selected',
        btn.dataset.ksTab === activeId ? 'true' : 'false'
      )
    })
  // Keep the mobile label in sync.
  const mobileLabel = document.querySelector<HTMLElement>(
    `[${TAB_STRIP_MARK}] .ks-tab-mobile-label`
  )
  if (mobileLabel) {
    const tabIds = Array.from(cellsByTab.keys())
    const label = cellsByTab.get(activeId)?.label ?? ''
    const idx = tabIds.indexOf(activeId)
    const total = tabIds.length
    mobileLabel.innerHTML = `<span class="ks-tab-mobile-name">${label}</span><span class="ks-tab-mobile-count">${idx + 1} / ${total}</span>`
  }
}

function initTabs(form: HTMLElement): boolean {
  if (form.querySelector(`[${TAB_STRIP_MARK}]`)) return false // already done

  const groups = findTabGroups(form)
  if (process.env.NODE_ENV !== 'production') {
    console.debug(
      `[KeystaticEnhancements] findTabGroups: ${groups.length}`,
      groups.map((g) => getLabelText(g))
    )
  }
  if (groups.length < 2) return false

  // Each top-level group lives inside a span-N grid cell — that cell IS the
  // grid item we want to show/hide. Toggling its display preserves Keystatic's
  // own grid placement (grid-column: span 12), so visible content fills the
  // canvas exactly the way Keystatic intended. No wrapper, no width fight.
  const cellsByTab = new Map<string, { label: string; cells: HTMLElement[] }>()
  const groupCells = new Set<HTMLElement>()
  for (const group of groups) {
    const cell = (group.parentElement ?? group) as HTMLElement
    groupCells.add(cell)
    const label = getLabelText(group)
    const id = toTabId(label) || `tab-${cellsByTab.size}`
    cellsByTab.set(id, { label, cells: [cell] })

    // The active tab button already shows the section name — hide the
    // in-panel heading element so each panel starts with the description
    // line directly. Keystatic renders the label as a sibling of the
    // [role="group"], referenced by aria-labelledby.
    const labelledBy = group.getAttribute('aria-labelledby')
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy)
      if (labelEl) {
        labelEl.style.display = 'none'
        // The group and its wrapper cell retain their top padding/margin
        // after the heading is hidden, leaving dead space. Zero them out.
        group.style.paddingTop = '0'
        group.style.marginTop = '0'
        const wrapperCell = group.parentElement as HTMLElement | null
        if (wrapperCell) {
          wrapperCell.style.paddingTop = '0'
          wrapperCell.style.marginTop = '0'
        }
      }
    }
  }

  // Assign every other top-level grid child (the slug field) to the Settings
  // tab so it lives alongside the other config fields. Falls back to the first
  // tab if Settings isn't present for some reason.
  const gridContainer = groups[0].parentElement?.parentElement ?? form
  const firstTabId = Array.from(cellsByTab.keys())[0]
  const slugTargetTab =
    cellsByTab.get('settings') ?? cellsByTab.get(firstTabId)!

  const isAssigned = (el: HTMLElement) =>
    Array.from(cellsByTab.values()).some(({ cells }) => cells.includes(el))

  for (const child of Array.from(gridContainer.children)) {
    if (!(child instanceof HTMLElement)) continue
    if (groupCells.has(child)) continue
    if (!isAssigned(child)) slugTargetTab.cells.unshift(child)
  }

  // Fallback: the slug field can live in a parent container above
  // gridContainer (Keystatic renders it outside the groups' CSS grid).
  // Locate it via its Regenerate button — same walk as hideSlugRegenerate().
  // Chain: regenBtn → regenCol → slugRow → outerCol → slugGridCell
  const regenBtn = form.querySelector<HTMLButtonElement>(
    'button[aria-label="regenerate"]'
  )
  if (regenBtn) {
    const slugCell = regenBtn.parentElement?.parentElement?.parentElement
      ?.parentElement as HTMLElement | null
    if (
      slugCell &&
      slugCell !== form &&
      !groupCells.has(slugCell) &&
      !isAssigned(slugCell)
    ) {
      slugTargetTab.cells.unshift(slugCell)
    }
  }

  const hashTab = getHashTab()
  const activeId = hashTab && cellsByTab.has(hashTab) ? hashTab : firstTabId

  const onSelect = (id: string) => {
    setHashTab(id)
    applyTabVisibility(cellsByTab, id)
  }

  const strip = buildTabStrip(cellsByTab, activeId, onSelect)
  // Strip lives inside the grid container so CSS `grid-column: 1 / -1` makes
  // it span every column. Inserting at the top means it sits above all cells.
  gridContainer.insertBefore(strip, gridContainer.firstChild)

  applyTabVisibility(cellsByTab, activeId)

  return true
}

// ── Slug regenerate hiding ────────────────────────────────────────────────

function hideSlugRegenerate(form: HTMLElement): void {
  if (form.dataset.ksSlugHidden) return

  // Keystatic sets aria-label="regenerate" on the ActionButton — more stable
  // than matching text content, which can include icon SVG titles.
  const regenBtn = form.querySelector<HTMLButtonElement>(
    'button[aria-label="regenerate"]'
  )
  if (!regenBtn) return

  regenBtn.style.display = 'none'

  // The slug field renders: outer [col] → [name TextField] + [slug+regen row]
  //   slug+regen row → [slug TextField] + [regen col]
  //   regen col → [Regenerate button]
  // Walking up: btn → regen col → slug+regen row → outer col → slug grid cell
  const regenCol = regenBtn.parentElement
  const slugRow = regenCol?.parentElement
  const outerCol = slugRow?.parentElement
  // The grid cell is outerCol's parent — it gets a narrow span-N by Keystatic.
  // Override to full-canvas width so the slug input isn't squished.
  const slugGridCell = outerCol?.parentElement as HTMLElement | null
  if (slugGridCell) {
    slugGridCell.style.gridColumn = '1 / -1'
  }
  if (outerCol) {
    // Hide the name field (first child = name TextField).
    const nameField = outerCol.firstElementChild as HTMLElement | null
    if (nameField && nameField !== slugRow) {
      nameField.style.display = 'none'
    }
    // Cap the slug content at a readable width.
    outerCol.style.maxWidth = 'min(640px, 100%)'
  }

  // Walk up and hide any hr / [role="separator"] between the slug field and
  // the tab strip so the divider line disappears.
  let el: HTMLElement | null =
    slugGridCell?.parentElement ?? regenBtn.parentElement
  while (el && el !== form && el.getAttribute('role') !== 'group') {
    for (const child of Array.from(el.children)) {
      if (
        child instanceof HTMLElement &&
        (child.tagName === 'HR' || child.getAttribute('role') === 'separator')
      ) {
        child.style.display = 'none'
      }
    }
    el = el.parentElement
  }

  form.dataset.ksSlugHidden = '1'
}

// ── Dirty-state reflection ─────────────────────────────────────────────────

/**
 * Observe the toolbar Save button's disabled state to detect dirty status.
 * Keystatic disables the save button when `!hasChanged`, so watching its
 * disabled attribute gives us a reliable dirty signal without reaching into
 * React internals.
 */
function observeDirtyState(): MutationObserver | null {
  const btn = document.querySelector<HTMLButtonElement>(
    'button[type="submit"][form="item-edit-form"]'
  )
  if (!btn) return null

  const update = () => {
    const isDirty =
      !btn.disabled && btn.getAttribute('aria-disabled') !== 'true'
    document.body.dataset.ksDirty = isDirty ? 'true' : 'false'
  }

  update()

  const obs = new MutationObserver(update)
  obs.observe(btn, {
    attributes: true,
    attributeFilter: ['disabled', 'aria-disabled']
  })
  return obs
}

// ── Main component ─────────────────────────────────────────────────────────

export function KeystaticEnhancements() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let dirtyObs: MutationObserver | null = null
    let timer: ReturnType<typeof setTimeout> | null = null

    function run() {
      const form = document.getElementById(FORM_ID)
      if (form) {
        initTabs(form)
        hideSlugRegenerate(form)
        if (!dirtyObs) {
          dirtyObs = observeDirtyState()
        }
      }
    }

    function schedule() {
      if (timer != null) return
      timer = setTimeout(() => {
        timer = null
        run()
      }, 120)
    }

    const obs = new MutationObserver(schedule)
    obs.observe(document.body, { childList: true, subtree: true })
    schedule()

    return () => {
      obs.disconnect()
      dirtyObs?.disconnect()
      if (timer != null) clearTimeout(timer)
      // KeystaticEnhancements is mounted in app/keystatic/layout.tsx and lives
      // for the entire admin session — this cleanup only runs if showAdminUI
      // flips false. The strip lives inside the form and is unmounted with it
      // on SPA navigation.
    }
  }, [])

  return null
}
