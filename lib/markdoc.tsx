/**
 * Inline-Markdoc renderer for short prose fields written via
 * `fields.markdoc.inline()` in keystatic.config.ts.
 *
 * Stored value is a Markdoc string. For plain prose ("Мама, папа, приходите
 * скорей…") this is byte-identical to a plain-text string — no migration
 * needed. When the editor adds inline formatting (italic / bold / links),
 * the serialised string carries Markdoc syntax (`*italic*`, `**bold**`,
 * `[label](url)`).
 *
 * Rendering goes through @markdoc/markdoc:
 *   1. parse(string)    — produces a block-level AST (single paragraph for
 *                          inline content)
 *   2. transform(node)   — applies a config that overrides the `paragraph`
 *                          node so we can pass our own className through
 *   3. renderers.react   — turns the renderable tree into JSX
 *
 * The override is necessary because the default Markdoc paragraph node
 * renders as `<p>` with no className, and we need the existing
 * `.directorsNoteText` styling to keep the production page visually
 * identical to the pre-Markdoc version.
 */

import * as React from 'react'
import Markdoc, { type Config, type Schema } from '@markdoc/markdoc'

interface InlineMarkdocProps {
  /** Raw Markdoc string from a `fields.markdoc.inline` field. */
  value: string
  /** Class to apply to the wrapping <p>. */
  className?: string
}

/** Build a Markdoc config that:
 *   - drops the default `<article>` document wrapper (Markdoc's default
 *     paints one around all parsed content; for an inline note in a
 *     <blockquote> it's noise),
 *   - swaps the paragraph node so the rendered <p> carries our className.
 *  Re-create per call so the className isn't shared across components. */
function buildConfig(className?: string): Config {
  const document: Schema = {
    transform(node, config) {
      // Return children as-is — no wrapping element. Markdoc.transform's
      // type allows returning an array for nodes that should pass through.
      return node.transformChildren(config)
    }
  }
  const paragraph: Schema = {
    render: 'p',
    transform(node, config) {
      const attributes = node.transformAttributes(config)
      const children = node.transformChildren(config)
      return new Markdoc.Tag(
        'p',
        className ? { ...attributes, className } : attributes,
        children
      )
    }
  }
  return { nodes: { document, paragraph } }
}

export function InlineMarkdoc({ value, className }: InlineMarkdocProps) {
  if (!value) return null
  const ast = Markdoc.parse(value)
  const transformed = Markdoc.transform(ast, buildConfig(className))
  return <>{Markdoc.renderers.react(transformed, React)}</>
}
