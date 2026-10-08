'use client'

import React, { useRef, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

/**
 * Image preview + Upload / Remove under any `src` text input that holds
 * an image path. Slotted via `admin.components.afterInput` on
 * Productions.media.*.src, gallery[].src and the About photos; the
 * `image-path` field class (custom.scss) lifts it above the path input,
 * which stays as a small secondary line.
 *
 * Upload   POSTs multipart {file, directory} to /api/r2-asset.
 *          Directory is derived from the production slug:
 *            productions/<slug>/
 *          (the slug field lives at the top level of the productions doc).
 * Remove   empties the field only. Deleting files from R2 is left to ops:
 *          one file can back several fields (poster and a cover), and a
 *          delete here went live before Save (2026-10-08 admin critique).
 * Fallback optional `fallback` clientProp: the fields the site uses when
 *          this one is blank (cover → poster). Shown dimmed, so the editor
 *          sees what is live without reading the fallback rules.
 *
 * Reuses the existing R2-only upload endpoint (shipped 2026-05-06 per
 * STATUS.md §8.6) so we don't fork a parallel uploader. Path encoding
 * matches what lib/cdn.ts and the public site already expect.
 */

type Fallback = { path: string; label: string }

const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE?.replace(/\/$/, '') ?? ''

const resolveUrl = (path: string | null | undefined): string | null => {
  if (!path) return null
  if (path.startsWith('http')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return cdnBase ? `${cdnBase}${p}` : p
}

/** Decide where to put a newly-uploaded file based on (in priority order):
 *  1. The directory of the existing field value (overwriting in place).
 *  2. `productions/<slug>/` if the form has a top-level `slug` field.
 *  3. `about/` when the admin route is the About global (no slug exists there).
 *  4. `uploads/` fallback (matches r2-asset ALLOWED_DELETE_PREFIXES).
 */
const deriveDirectory = (
  currentValue: string | undefined,
  slug: string | undefined
): string => {
  if (currentValue && currentValue.includes('/')) {
    const trimmed = currentValue.replace(/^\/+/, '')
    const dir = trimmed.slice(0, trimmed.lastIndexOf('/'))
    if (dir) return dir
  }
  if (slug) return `productions/${slug}`
  if (
    typeof window !== 'undefined' &&
    window.location.pathname.includes('/globals/about')
  ) {
    return 'about'
  }
  return 'uploads'
}

export const ImagePathPreview: TextFieldClientComponent = (props) => {
  const fieldPath = props.path as string
  const fallback = ((props as { fallback?: Fallback[] }).fallback ??
    []) as Fallback[]
  const { value, setValue } = useField<string>({ path: fieldPath })

  // Read the production slug off the top-level form field; useFormFields
  // only re-renders when this specific value changes.
  const slugField = useFormFields(([fields]) => fields.slug)
  const slug =
    typeof slugField?.value === 'string' ? slugField.value : undefined

  // First non-blank fallback as one "label\npath" string, so the selector
  // result compares by value and the field doesn't re-render on every edit.
  const inherited = useFormFields(([fields]) => {
    for (const f of fallback) {
      const v = fields[f.path]?.value
      if (typeof v === 'string' && v) return `${f.label}\n${v}`
    }
    return ''
  })
  const [inheritedLabel, inheritedPath] = inherited.split('\n')

  const url = resolveUrl(value)
  const shownUrl = url ?? resolveUrl(inheritedPath)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onPick = () => fileInputRef.current?.click()

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-uploading the same filename
    if (!file) return

    setBusy(true)
    setStatus('Загрузка…')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('directory', deriveDirectory(value, slug))
      const res = await fetch('/api/r2-asset', {
        method: 'POST',
        body: fd
      })
      const data = (await res.json()) as { src?: string; error?: string }
      if (!res.ok || !data.src) {
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      setValue(data.src)
      setStatus(
        `Загружено: ${file.name}. Нажмите «Сохранить», чтобы файл появился на сайте.`
      )
    } catch (err) {
      setStatus(
        `Ошибка: не удалось загрузить ${file.name}${
          err instanceof Error ? ` (${err.message})` : ''
        }. Попробуйте ещё раз.`
      )
    } finally {
      setBusy(false)
    }
  }

  const onClear = () => {
    // Clears the field without touching R2. Use for "this production
    // shouldn't reference this image anymore but keep the file around."
    setValue('')
    setStatus('Картинка убрана. Нажмите «Сохранить», чтобы убрать её с сайта.')
  }

  return (
    <div className='image-preview'>
      {shownUrl ? (
        <figure
          className={`image-preview__frame${url ? '' : ' image-preview__frame--inherited'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shownUrl}
            alt={url ? `Превью: ${value}` : `Сейчас: ${inheritedLabel}`}
            onError={(e) => {
              const target = e.currentTarget
              target.style.opacity = '0.3'
              target.title = `Картинка не открывается: ${shownUrl}`
            }}
          />
          {url ? null : (
            <figcaption>Сейчас используется {inheritedLabel}</figcaption>
          )}
        </figure>
      ) : (
        <div className='image-preview__empty'>Нет картинки</div>
      )}

      <div className='image-preview__actions'>
        <button
          type='button'
          className='image-preview__upload'
          onClick={onPick}
          disabled={busy}
        >
          {value ? 'Заменить' : 'Загрузить'}
        </button>
        {value ? (
          <button
            type='button'
            className='image-preview__remove'
            onClick={onClear}
            disabled={busy}
          >
            Убрать
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml'
          onChange={onUpload}
          hidden
        />
      </div>

      {status ? (
        <div
          role='status'
          className={`image-preview__status${status.startsWith('Ошибка') ? ' image-preview__status--error' : ''}`}
        >
          {status}
        </div>
      ) : null}
    </div>
  )
}

export default ImagePathPreview
