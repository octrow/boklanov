/** Google shows ~155–160 chars before truncating; cut long
 *  descriptions at the last sentence (or word) boundary under `max`. */
export const META_DESCRIPTION_MAX = 155
// Below this a sentence-boundary cut reads as "too short" to audit tools;
// cut at a word instead.
const META_DESCRIPTION_MIN = 100

export function clampDescription(
  text: string,
  max: number = META_DESCRIPTION_MAX
): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const head = t.slice(0, max)
  const sentenceEnd = head.search(/[.!?…](?=[^.!?…]*$)/)
  if (sentenceEnd + 1 >= Math.min(META_DESCRIPTION_MIN, max))
    return head.slice(0, sentenceEnd + 1)
  return `${head.slice(0, head.lastIndexOf(' ')).replace(/[,;:—-]+$/, '')}…`
}
