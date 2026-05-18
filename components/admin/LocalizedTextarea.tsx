'use client'

import React from 'react'
import type { TextareaFieldClientComponent } from 'payload'
import { LocalizedTextLike } from './LocalizedTextLike'

/**
 * Custom Field for `localized: true` textarea fields. Same flow as
 * LocalizedText but renders <textarea> instead of <input>.
 */

const LocalizedTextarea: TextareaFieldClientComponent = ({ path, field }) => {
  const rawLabel = field?.label
  const labelText =
    typeof rawLabel === 'string'
      ? rawLabel
      : rawLabel && typeof rawLabel === 'object'
        ? ((rawLabel as Record<string, string>).ru ??
          (rawLabel as Record<string, string>).en ??
          path)
        : path

  return (
    <LocalizedTextLike path={path as string} label={labelText} as='textarea' />
  )
}

export default LocalizedTextarea
