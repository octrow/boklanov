'use client'

import React from 'react'
import type { TextFieldClientComponent } from 'payload'
import { LocalizedTextLike } from './LocalizedTextLike'

/**
 * Custom Field for `localized: true` text fields. Wraps the shared
 * <LocalizedTextLike> with `as="input"`. See LocalizedTextLike for
 * the full data-flow + render rationale.
 */

const LocalizedText: TextFieldClientComponent = ({ path, field }) => {
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
    <LocalizedTextLike path={path as string} label={labelText} as='input' />
  )
}

export default LocalizedText
