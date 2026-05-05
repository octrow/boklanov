'use client'

/**
 * Inline image upload + thumbnail for Keystatic `fields.text` inputs that
 * store image paths (poster.src, productionsPhoto.src, featuredPhoto.src,
 * gallery[].src). Keystatic's `fields.image` shows an empty picker for
 * files placed manually under `public/`, and `fields.cloudImage` requires
 * paid Keystatic Cloud — so we keep the path as text and graft on:
 *
 *   1. an "Upload image" button on its own line below the input
 *   2. a 240×180 preview thumbnail on the next line
 *
 * A MutationObserver picks up Keystatic's array re-renders (gallery
 * add/remove/reorder). The upload route is dev-only; in cloud/prod the
 * Keystatic admin isn't reachable from the public site anyway.
 */

import { useEffect } from 'react'

const IMG_EXT = /\.(jpe?g|png|webp|gif|svg|avif)$/i
const MARK = 'data-image-path-preview'

const PREVIEW_W = 240
const PREVIEW_H = 180

function resolveSrc(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null
  if (!IMG_EXT.test(v)) return null
  if (/^https?:\/\//i.test(v)) return v
  return v.startsWith('/') ? v : '/' + v
}

/** Derive the target directory for an upload from the input's current value
 *  (e.g. `/productions/foo/01.jpg` → `productions/foo`). Falls back to
 *  parsing the URL — `/keystatic/collection/<col>/item/<slug>` →
 *  `<col>/<slug>` — and finally to a generic `uploads/`. */
function deriveDirectory(currentValue: string): string {
  const v = currentValue.trim()
  if (v) {
    const noLead = v.replace(/^\/+/, '')
    const lastSlash = noLead.lastIndexOf('/')
    if (lastSlash > 0) return noLead.slice(0, lastSlash)
  }
  if (typeof window !== 'undefined') {
    const m = window.location.pathname.match(
      /\/keystatic\/collection\/([^/]+)\/item\/([^/]+)/
    )
    if (m) return `${m[1]}/${m[2]}`
    const s = window.location.pathname.match(/\/keystatic\/singleton\/(\w+)/)
    if (s) return s[1]
  }
  return 'uploads'
}

/** Set a React-controlled input's value the way React expects so its
 *  onChange handler fires. */
function setReactInputValue(input: HTMLInputElement, value: string) {
  const proto = Object.getPrototypeOf(input)
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(input, value)
  else input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

async function uploadFile(file: File, directory: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('directory', directory)
  const res = await fetch('/api/keystatic-asset', { method: 'POST', body: fd })
  const json = (await res.json()) as { src?: string; error?: string }
  if (!res.ok || !json.src) {
    throw new Error(json.error || `upload failed (${res.status})`)
  }
  return json.src
}

function buildAddon(input: HTMLInputElement): HTMLElement {
  const addon = document.createElement('div')
  addon.setAttribute(MARK, '1')
  // gap + margin-top sized to match Keystatic's own field-to-field vertical
  // rhythm (~1rem) so the upload button doesn't visually "stick" to the
  // input above and the preview doesn't crowd the button.
  addon.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'align-items:flex-start',
    'gap:16px',
    'margin-top:16px'
  ].join(';')

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif'
  fileInput.style.display = 'none'

  // Clone the markup of an existing Keystatic ActionButton (e.g. "Reset
  // changes" / "Sign into Cloud") so font, padding, radius, height and
  // hover all match the surrounding admin chrome. The text-wrapping
  // <span> matters — without it the button collapses to ~20px tall.
  const ref = document.querySelector<HTMLButtonElement>(
    'button.kui\\:ActionButton:not([data-image-path-button])'
  )
  const refSpan = ref?.querySelector<HTMLSpanElement>('span.kui\\:ActionButton-text')
  const button = document.createElement('button')
  button.type = 'button'
  button.className = ref?.className ?? 'kui:ActionButton kui:reset'
  button.setAttribute('data-image-path-button', '1')
  if (refSpan) {
    const labelSpan = document.createElement('span')
    labelSpan.className = refSpan.className
    labelSpan.textContent = 'Upload image'
    button.appendChild(labelSpan)
  } else {
    button.textContent = 'Upload image'
  }
  // Keystatic's css-l97xxv sets `height: var(--kui-size-element-regular)`
  // (32px). Inside a column-flex parent, the button gets `flex: 1 1 0%`
  // from cascade and shrinks to content (~19px). Pin flex so the var-
  // driven height wins and the button matches Keystatic's other action
  // buttons exactly.
  button.style.flex = '0 0 auto'
  button.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    fileInput.click()
  })

  const status = document.createElement('span')
  status.dataset.role = 'status'
  // No font/size hardcoded — inherits from Keystatic's body styles.
  status.style.color = '#71717a'

  const preview = document.createElement('span')
  preview.dataset.role = 'preview'
  preview.style.cssText = [
    'display:block',
    `width:${PREVIEW_W}px`,
    `height:${PREVIEW_H}px`,
    'border:1px solid #d4d4d8',
    'border-radius:6px',
    'background:#fafafa center/contain no-repeat',
    'overflow:hidden'
  ].join(';')

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    fileInput.value = ''
    if (!file) return
    const dir = deriveDirectory(input.value)
    button.disabled = true
    status.textContent = `Uploading ${file.name}…`
    status.style.color = '#71717a'
    try {
      const src = await uploadFile(file, dir)
      setReactInputValue(input, src)
      status.textContent = `Saved to ${src}`
      status.style.color = '#15803d'
    } catch (err) {
      status.textContent = (err as Error).message
      status.style.color = '#b91c1c'
    } finally {
      button.disabled = false
    }
  })

  addon.append(button, fileInput, preview, status)
  return addon
}

/** Find the field's column container so we can append the addon as a new
 *  row beneath the input row (rather than as a sibling inside the row).
 *  Keystatic wraps each field in a `display:flex; flex-direction:column`
 *  div whose direct children are: label, description, input-row. */
function findFieldContainer(input: HTMLInputElement): HTMLElement | null {
  let cur: HTMLElement | null = input.parentElement
  for (let i = 0; i < 5 && cur; i++) {
    const cs = window.getComputedStyle(cur)
    if (cs.display === 'flex' && cs.flexDirection === 'column') return cur
    cur = cur.parentElement
  }
  return null
}

function ensureAddon(input: HTMLInputElement): HTMLElement | null {
  const container = findFieldContainer(input)
  if (!container) return null

  let addon: HTMLElement | null = null
  for (const child of Array.from(container.children)) {
    if (child instanceof HTMLElement && child.getAttribute(MARK) === '1') {
      addon = child
      break
    }
  }

  if (!addon) {
    addon = buildAddon(input)
    container.appendChild(addon)
  }

  const src = resolveSrc(input.value)
  const preview = addon.querySelector<HTMLElement>('[data-role="preview"]')!
  if (!src) {
    preview.style.backgroundImage = ''
    preview.dataset.src = ''
  } else if (preview.dataset.src !== src) {
    preview.dataset.src = src
    preview.style.backgroundImage = `url("${src.replace(/"/g, '\\"')}")`
  }

  return addon
}

/** Heuristic: an input belongs to an image-path field if its current value
 *  matches an image extension OR its description sibling mentions a path
 *  (description text contains an image extension example). */
function isImagePathInput(input: HTMLInputElement): boolean {
  if (IMG_EXT.test(input.value || '')) return true
  // Description is rendered as a sibling SPAN of the input's grandparent
  // (Keystatic puts label + description above the input wrapper). Walk up
  // and look for a description element with an image-ext example.
  const grand = input.closest('div')?.parentElement
  if (!grand) return false
  const desc = grand.querySelector('span, p')
  if (desc && /\.(jpe?g|png|webp|gif|svg|avif)\b/i.test(desc.textContent || '')) {
    return true
  }
  return false
}

const ROW_THUMB_MARK = 'data-image-row-thumb'

/** Inject a small thumbnail into each collapsed array-of-images row whose
 *  aria-label looks like an image filename. The src is inferred from the
 *  URL (collection/<col>/item/<slug>) plus the label filename — works
 *  because every productions gallery image lives under `/<col>/<slug>/`.
 *
 *  DOM-coupling note: Keystatic's array UI is built on react-aria
 *  GridList, so each row carries `role="row"` and the itemLabel returned
 *  from keystatic.config.ts surfaces as `aria-label`. The internal class
 *  names ("kui:ListViewItem-grid" in older builds) are NOT a stable API
 *  — earlier versions of this scanner relied on them and silently broke
 *  when Keystatic's bundle reshuffled. Now we lean only on
 *  `[role="row"][aria-label]` and pick the first element-children
 *  container we can find for insertion. */
function scanRows(root: ParentNode) {
  if (typeof window === 'undefined') return
  const m = window.location.pathname.match(
    /\/keystatic\/collection\/([^/]+)\/item\/([^/]+)/
  )
  if (!m) return
  const dirPrefix = `/${m[1]}/${m[2]}/`

  const rows = root.querySelectorAll<HTMLElement>('[role="row"][aria-label]')
  rows.forEach((row) => {
    const label = row.getAttribute('aria-label') || ''
    if (!IMG_EXT.test(label)) {
      const stale = row.querySelector<HTMLElement>(`[${ROW_THUMB_MARK}="1"]`)
      if (stale) stale.remove()
      // Restore the row's original padding-right when the row stops
      // being a thumbnail row (image filename → other label). Without
      // this, switching the field's src to empty would leave a 64px
      // gutter forever.
      if (row.dataset.imgRowAnchored) {
        row.style.paddingRight = row.dataset.imgRowOrigPadRight || ''
        delete row.dataset.imgRowAnchored
        delete row.dataset.imgRowOrigPadRight
      }
      return
    }
    const src = dirPrefix + label

    // The thumb is positioned ABSOLUTELY so it never participates in the
    // row's intrinsic flex/grid layout — that's what kept breaking when
    // we inserted it as a flex item (it pushed siblings and overlapped
    // controls). The row gets position: relative (idempotent — only set
    // once via dataset flag) so the thumb anchors to it.
    if (!row.dataset.imgRowAnchored) {
      const cs = window.getComputedStyle(row)
      if (cs.position === 'static') {
        row.style.position = 'relative'
      }
      // Reserve a strip on the right edge so the thumb doesn't overlap
      // the row's text label / controls. 64px = 48 thumb + 8 gap on each
      // side. Save the original padding so we don't double-up if React
      // re-renders the row.
      const origPadRight = row.style.paddingRight
      row.dataset.imgRowOrigPadRight = origPadRight
      row.style.paddingRight = `calc(${origPadRight || '0px'} + 64px)`
      row.dataset.imgRowAnchored = '1'
    }

    let thumb = row.querySelector<HTMLElement>(`:scope > [${ROW_THUMB_MARK}="1"]`)
    if (!thumb) {
      thumb = document.createElement('span')
      thumb.setAttribute(ROW_THUMB_MARK, '1')
      thumb.style.cssText = [
        'position:absolute',
        'right:8px',
        'top:50%',
        'transform:translateY(-50%)',
        'width:48px',
        'height:36px',
        'border:1px solid var(--kui-color-border-neutral, #d4d4d8)',
        'border-radius:3px',
        'background:var(--kui-color-background-surface, #fafafa) center/cover no-repeat',
        'pointer-events:none',
        'z-index:1'
      ].join(';')
      row.appendChild(thumb)
    }
    if (thumb.dataset.src !== src) {
      thumb.dataset.src = src
      thumb.style.backgroundImage = `url("${src.replace(/"/g, '\\"')}")`
    }
  })
}

function scan(root: ParentNode) {
  const inputs = root.querySelectorAll<HTMLInputElement>('input[type="text"]')
  inputs.forEach((input) => {
    if (isImagePathInput(input)) {
      ensureAddon(input)
    } else {
      // Clean up an addon we may have attached to this field's container.
      const container = findFieldContainer(input)
      if (container) {
        for (const child of Array.from(container.children)) {
          if (child instanceof HTMLElement && child.getAttribute(MARK) === '1') {
            child.remove()
          }
        }
      }
    }
  })
  scanRows(root)
}

export function ImagePathPreview() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onInput = (e: Event) => {
      const t = e.target
      if (t instanceof HTMLInputElement && t.type === 'text') {
        if (isImagePathInput(t)) ensureAddon(t)
      }
    }

    let timer: number | null = null
    const schedule = () => {
      if (timer != null) return
      timer = window.setTimeout(() => {
        timer = null
        scan(document.body)
      }, 50)
    }

    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('input', onInput, true)
    schedule()

    return () => {
      observer.disconnect()
      document.removeEventListener('input', onInput, true)
      if (timer != null) clearTimeout(timer)
    }
  }, [])

  return null
}
