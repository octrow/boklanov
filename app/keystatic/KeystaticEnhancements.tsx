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

/** Allowlist of top-level group labels from the productions schema (WS-1)
 *  AND the unified About singleton. Acts as a backstop: even if the
 *  structural filter below misidentifies nested groups, the label must
 *  match one of these. Update if group labels in keystatic.config.ts change.
 *
 *  Productions: identity / media / production / taxonomy / team /
 *               recognition / performance history / settings
 *  About:       bio / visuals / timeline / margins
 *  ('media' overlaps but only one schema is rendered at a time, so the
 *  shared label is harmless.) */
const TOP_LEVEL_LABELS = new Set([
  'identity',
  'media',
  'production',
  'taxonomy',
  'team',
  'recognition',
  'performance history',
  'settings',
  'bio',
  'visuals',
  'timeline',
  'margins'
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
  labelEl.innerHTML = `<span class="ks-tab-mobile-name">${currentLabel}</span><span class="ks-tab-mobile-count">${currentIndex + 1} / ${tabCount}</span>`

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

  // Find the lowest ancestor that contains every top-level group — the grid
  // that actually holds the group cells. Walking up from groups[0] (instead
  // of `groups[0].parentElement?.parentElement`) survives DOM-shape
  // differences between local mode and Keystatic Cloud, where the form
  // sometimes adds an extra wrapper around the groups' grid AND renders
  // top-level scalar fields (slug / year / durationMin / status) in a
  // sibling container above the groups' grid rather than alongside them.
  let lca: HTMLElement | null = groups[0].parentElement
  while (lca && lca !== form && !groups.every((g) => lca!.contains(g))) {
    lca = lca.parentElement
  }
  if (!lca) lca = form

  // For each group the "cell" we toggle is its closest ancestor that is a
  // direct child of the LCA. Hiding that cell preserves Keystatic's own grid
  // placement (grid-column: span 12), so visible panels fill the canvas the
  // way Keystatic intended.
  const cellInContainer = (
    g: HTMLElement,
    container: HTMLElement
  ): HTMLElement => {
    let el: HTMLElement = g
    while (el.parentElement && el.parentElement !== container) {
      el = el.parentElement
    }
    return el
  }

  const cellsByTab = new Map<string, { label: string; cells: HTMLElement[] }>()
  const groupCells = new Set<HTMLElement>()
  for (const group of groups) {
    const cell = cellInContainer(group, lca)
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
        cell.style.paddingTop = '0'
        cell.style.marginTop = '0'
      }
    }
  }

  // Assign every non-group top-level cell to the Settings tab so the slug,
  // year, durationMin, and status scalar fields live alongside the other
  // config fields. Falls back to the first tab if Settings isn't present.
  const firstTabId = Array.from(cellsByTab.keys())[0]
  const slugTargetTab =
    cellsByTab.get('settings') ?? cellsByTab.get(firstTabId)!

  const isAssigned = (el: HTMLElement) =>
    Array.from(cellsByTab.values()).some(({ cells }) => cells.includes(el))

  // (1) Sweep direct children of the LCA — handles local mode where the slug
  //     and top-level scalars sit alongside the group cells.
  for (const child of Array.from(lca.children)) {
    if (!(child instanceof HTMLElement)) continue
    if (groupCells.has(child)) continue
    if (!isAssigned(child)) slugTargetTab.cells.unshift(child)
  }

  // (2) Walk up from the LCA to the form root and sweep siblings at each
  //     level. In Keystatic Cloud the top-level scalar fields render in a
  //     SIBLING container above the groups' LCA, not as children of it.
  //     Without this sweep they stay visible on every tab, and the strip
  //     ends up below them. Skip siblings that have no form input so
  //     unrelated chrome (toolbars, branch picker, breadcrumbs) isn't
  //     pulled into a tab.
  {
    let cur: HTMLElement | null = lca
    while (cur && cur !== form) {
      const parent: HTMLElement | null = cur.parentElement
      if (!parent) break
      for (const sibling of Array.from(parent.children)) {
        if (!(sibling instanceof HTMLElement)) continue
        if (sibling === cur) continue
        if (groupCells.has(sibling)) continue
        if (isAssigned(sibling)) continue
        if (
          sibling.querySelector(
            'input, textarea, select, [role="group"], [role="combobox"], label'
          )
        ) {
          slugTargetTab.cells.unshift(sibling)
        }
      }
      cur = parent
    }
  }

  // (3) Slug fallback: walk up from the Regenerate button to the slug grid
  //     cell. Useful when the slug field wraps in its own container that
  //     the input-presence check above happened to skip.
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
  // Anchor the strip at the form root so it always sits visually above every
  // field container, regardless of whether top-level scalars live inside the
  // LCA (local mode) or in a sibling container above it (Cloud mode).
  // grid-column: 1 / -1 in the shim CSS still spans whatever grid the form
  // root uses; in non-grid contexts the rule is harmless and the flex strip
  // lays out as a normal block element.
  form.insertBefore(strip, form.firstChild)

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

// ── Sidebar "you are here" decoration ──────────────────────────────────────

const SIDEBAR_DECO_MARK = 'data-ks-sidebar-deco'

function getCurrentLocation():
  | { type: 'item'; slug: string }
  | { type: 'singleton' }
  | { type: 'other' } {
  const path = window.location.pathname
  // Keystatic Cloud injects /branch/<branch>/ between /keystatic/ and the
  // collection/singleton segments. Local mode omits this segment. Match both
  // shapes so the sidebar slug + tab list also render in production.
  const item = path.match(
    /\/keystatic\/(?:branch\/[^/]+\/)?collection\/[^/]+\/item\/([^/]+)/
  )
  if (item) return { type: 'item', slug: decodeURIComponent(item[1]) }
  if (/\/keystatic\/(?:branch\/[^/]+\/)?singleton\//.test(path))
    return { type: 'singleton' }
  return { type: 'other' }
}

/** Harvest classNames from a real NavItem in the sidebar so injected tab
 *  links inherit Keystatic's anchor / content / text styles (font, padding,
 *  hover, focus ring, and the active accent bar via the &::before pseudo).
 *  Same trick the tab strip uses for its ActionButtons. */
function harvestNavItemClasses(): {
  anchor: string
  content: string
  text: string
} | null {
  const ref = document.querySelector<HTMLAnchorElement>(
    'nav a[href*="/keystatic/"]'
  )
  if (!ref) return null
  const contentEl = ref.firstElementChild as HTMLElement | null
  const textEl = contentEl?.firstElementChild as HTMLElement | null
  return {
    anchor: ref.className,
    content: contentEl?.className ?? '',
    text: textEl?.className ?? ''
  }
}

/**
 * Inject a "you are here" panel under the active sidebar nav item showing
 * the current item slug (when editing a collection entry) and a clickable
 * list of tabs that mirrors the form's tab strip. Tabs are read from the DOM
 * (the strip built by initTabs) so this stays in sync without state sharing.
 */
function decorateSidebar(): void {
  const loc = getCurrentLocation()

  // Strip stale decorations whenever we leave an item/singleton page.
  if (loc.type === 'other') {
    document
      .querySelectorAll(`[${SIDEBAR_DECO_MARK}]`)
      .forEach((n) => n.remove())
    return
  }

  const activeLink = document.querySelector<HTMLAnchorElement>(
    'nav a[aria-current]:not([aria-current="false"])'
  )
  const activeLi = activeLink?.closest('li')
  if (!activeLi) return

  const navClasses = harvestNavItemClasses()
  if (!navClasses) return

  // Reuse existing decoration if it sits where we expect, otherwise rebuild.
  let deco: HTMLElement | null = null
  const next = activeLi.nextElementSibling
  if (next instanceof HTMLElement && next.hasAttribute(SIDEBAR_DECO_MARK)) {
    deco = next
  } else {
    // Remove orphan decorations elsewhere (active item changed).
    document
      .querySelectorAll(`[${SIDEBAR_DECO_MARK}]`)
      .forEach((n) => n.remove())
    deco = document.createElement('li')
    deco.setAttribute(SIDEBAR_DECO_MARK, '1')
    deco.className = 'ks-sidebar-context'
    activeLi.insertAdjacentElement('afterend', deco)
  }

  const tabButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      `[${TAB_STRIP_MARK}] [data-ks-tab]`
    )
  )

  // Snapshot the desired contents, then only rewrite if they changed —
  // avoids stomping focus/hover on each MutationObserver tick.
  const slug = loc.type === 'item' ? loc.slug : ''
  const tabsSig = tabButtons
    .map(
      (b) =>
        `${b.dataset.ksTab}:${b.textContent?.trim() ?? ''}:${b.getAttribute('aria-selected')}`
    )
    .join('|')
  const sig = `${loc.type}:${slug}::${tabsSig}`
  if (deco.dataset.ksSig === sig) return
  deco.dataset.ksSig = sig

  deco.replaceChildren()

  if (slug) {
    // Use <h3> semantically so the sidebar reads as a section hierarchy:
    //   <h3>NavGroup title</h3> → active NavItem (h2-equivalent) → slug (h3)
    //   → tabs (h4-equivalent NavItems).
    const slugEl = document.createElement('h3')
    slugEl.className = 'ks-sidebar-context__slug'
    slugEl.textContent = slug
    deco.appendChild(slugEl)
  }

  if (tabButtons.length > 0) {
    const list = document.createElement('ul')
    list.className = 'ks-sidebar-context__tabs'
    for (const btn of tabButtons) {
      const id = btn.dataset.ksTab!
      const label = btn.textContent?.trim() ?? id
      const isActive = btn.getAttribute('aria-selected') === 'true'

      const li = document.createElement('li')

      // Build an <a><div><span/></div></a> tree using harvested classNames so
      // the link inherits Keystatic's NavItem styling (typography, hover,
      // focus ring, and the active &::before accent bar). The extra
      // ks-sidebar-context__tab-link class lets the shim CSS shrink these
      // tabs (H4) below the section NavItem (H2) and slug (H3).
      const a = document.createElement('a')
      a.className = `${navClasses.anchor} ks-sidebar-context__tab-link`
      a.href = `#tab=${encodeURIComponent(id)}`
      if (isActive) a.setAttribute('aria-current', 'page')

      const content = document.createElement('div')
      content.className = navClasses.content

      const text = document.createElement('span')
      text.className = navClasses.text
      text.textContent = label
      content.appendChild(text)
      a.appendChild(content)

      a.addEventListener('click', (e) => {
        e.preventDefault()
        // Delegate to the tab strip's own click handler so the active state,
        // panel visibility, and hash all stay in sync.
        const live = document.querySelector<HTMLButtonElement>(
          `[${TAB_STRIP_MARK}] [data-ks-tab="${CSS.escape(id)}"]`
        )
        live?.click()
      })
      li.appendChild(a)
      list.appendChild(li)
    }
    deco.appendChild(list)
  }
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
      decorateSidebar()
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
    // Hash changes don't mutate the DOM, but the active tab indicator must
    // follow them — listen explicitly so the sidebar stays in sync.
    window.addEventListener('hashchange', schedule)
    schedule()

    return () => {
      obs.disconnect()
      dirtyObs?.disconnect()
      window.removeEventListener('hashchange', schedule)
      if (timer != null) clearTimeout(timer)
      // KeystaticEnhancements is mounted in app/keystatic/layout.tsx and lives
      // for the entire admin session — this cleanup only runs if showAdminUI
      // flips false. The strip lives inside the form and is unmounted with it
      // on SPA navigation.
    }
  }, [])

  return null
}
