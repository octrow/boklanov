/** Search engines show ~160 chars and audit tools flag >320; cut long
 *  descriptions at the last sentence (or word) boundary under `max`. */
export const META_DESCRIPTION_MAX = 300

export function clampDescription(
  text: string,
  max: number = META_DESCRIPTION_MAX
): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const head = t.slice(0, max)
  const sentenceEnd = head.search(/[.!?…](?=[^.!?…]*$)/)
  if (sentenceEnd > max / 2) return head.slice(0, sentenceEnd + 1)
  return `${head.slice(0, head.lastIndexOf(' ')).replace(/[,;:—-]+$/, '')}…`
}
