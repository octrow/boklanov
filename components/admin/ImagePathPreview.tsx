'use client'

import React, { useRef, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

/**
 * Thumbnail + Upload + Remove controls under any `src` text input that holds
 * an image path. Slotted via `admin.components.afterInput` on
 * Productions.media.*.src and gallery[].src.
 *
 * Upload   POSTs multipart {file, directory} to /api/r2-asset.
 *          Directory is derived from the production slug:
 *            productions/<slug>/
 *          (the slug field lives at the top level of the productions doc).
 * Remove   DELETEs {src} to /api/r2-asset, then clears the field.
 *
 * Reuses the existing R2-only upload endpoint (shipped 2026-05-06 per
 * STATUS.md §8.6) so we don't fork a parallel uploader. Path encoding
 * matches what lib/cdn.ts and the public site already expect.
 */

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
 *  3. `uploads/` fallback (matches r2-asset ALLOWED_DELETE_PREFIXES).
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
  return 'uploads'
}

const buttonStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 500,
  border: '1px solid var(--theme-elevation-200, #ddd)',
  borderRadius: 4,
  background: 'var(--theme-elevation-50, #fff)',
  cursor: 'pointer',
  lineHeight: 1.4
}

export const ImagePathPreview: TextFieldClientComponent = ({ path }) => {
  const fieldPath = path as string
  const { value, setValue } = useField<string>({ path: fieldPath })

  // Read the production slug off the top-level form field; useFormFields
  // only re-renders when this specific value changes.
  const slugField = useFormFields(([fields]) => fields.slug)
  const slug =
    typeof slugField?.value === 'string' ? slugField.value : undefined

  const url = resolveUrl(value)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onPick = () => fileInputRef.current?.click()

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-uploading the same filename
    if (!file) return

    setBusy(true)
    setStatus('Uploading…')
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
      setStatus(`Uploaded ${file.name}`)
    } catch (err) {
      setStatus(
        err instanceof Error ? `Error: ${err.message}` : 'Upload failed'
      )
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async () => {
    if (!value) return
    if (!confirm(`Remove ${value} from R2?`)) return

    setBusy(true)
    setStatus('Removing…')
    try {
      const res = await fetch('/api/r2-asset', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ src: value })
      })
      const data = (await res.json()) as { removed?: boolean; error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      setValue('')
      setStatus('Removed')
    } catch (err) {
      setStatus(
        err instanceof Error ? `Error: ${err.message}` : 'Remove failed'
      )
    } finally {
      setBusy(false)
    }
  }

  const onClear = () => {
    // Clears the field without touching R2. Use for "this production
    // shouldn't reference this image anymore but keep the file around."
    setValue('')
    setStatus('Cleared (R2 untouched)')
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          type='button'
          onClick={onPick}
          disabled={busy}
          style={buttonStyle}
        >
          Upload
        </button>
        {value ? (
          <>
            <button
              type='button'
              onClick={onClear}
              disabled={busy}
              style={buttonStyle}
            >
              Clear
            </button>
            <button
              type='button'
              onClick={onRemove}
              disabled={busy}
              style={{
                ...buttonStyle,
                color: '#a00',
                borderColor: '#e6c0c0'
              }}
            >
              Delete from R2
            </button>
          </>
        ) : null}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml'
          onChange={onUpload}
          style={{ display: 'none' }}
        />
      </div>

      {status ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: status.startsWith('Error')
              ? '#a00'
              : 'var(--theme-elevation-500, #666)'
          }}
        >
          {status}
        </div>
      ) : null}

      {url ? (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            border: '1px solid var(--theme-elevation-150, #e5e5e5)',
            borderRadius: 4,
            display: 'inline-block',
            background: 'var(--theme-elevation-50, #fafafa)'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt='preview'
            style={{
              maxWidth: 240,
              maxHeight: 180,
              display: 'block',
              objectFit: 'contain'
            }}
            onError={(e) => {
              const target = e.currentTarget
              target.style.opacity = '0.3'
              target.title = `Image not reachable: ${url}`
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

export default ImagePathPreview
