/** Plain text of a Lexical SerializedEditorState (paragraphs joined by a
 *  blank line); strings pass through. Shared by LocaleHint (client) and
 *  Dashboard (server). */
export const toPlainText = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  const inline = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const n = node as { text?: unknown; children?: unknown }
    if (typeof n.text === 'string') return n.text
    return Array.isArray(n.children) ? n.children.map(inline).join('') : ''
  }
  const root = (value as { root?: { children?: unknown } }).root
  const blocks = Array.isArray(root?.children) ? root.children : []
  return blocks
    .map(inline)
    .filter((t) => t.trim())
    .join('\n\n')
}
