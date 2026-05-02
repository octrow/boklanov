/**
 * Strips Notion-export noise from a raw MDX body string before MDX compilation.
 * Removes: duplicate title, blockquote (→ directorsNote), tagline, broken images,
 * duplicate metadata lines (tickets, premiere, duration, credits, press).
 */
export function cleanBodyMarkdown(raw: string): string {
  const lines = raw.split('\n')
  const out: string[] = []
  let skipUntilBlank = false

  for (const line of lines) {
    const t = line.trim()

    // Duplicate H1 title
    if (/^#\s+/.test(t)) continue
    // Blockquote lines (quote already in directorsNote)
    if (/^>\s*/.test(t)) continue
    // Tagline: ***italic*** or **bold** standalone line
    if (/^\*{2,3}[^*].{0,120}\*{2,3}$/.test(t) && !t.includes('\n')) continue
    // Images with URL-encoded (Notion) paths
    if (/^!\[.*\]\(%[0-9A-F]{2}/i.test(t)) continue
    // Duplicate metadata bold lines
    if (
      /^\*\*(Билет|Ticket|Премьера|Premiere|Продолжи|Duration|Категори|Age restrict|Возраст|Partymaker|Graffiti|Lighting designer|Dj:|ENG$|DEU$|Режис|Художн|Освещ|Звук|Composi|Choreograph|Помощн|В спект|Perform|Director|Artist|Cast:|Sound|Light|Figures|Staging|Regie|Besetz)/.test(
        t
      )
    ) {
      skipUntilBlank = true
      continue
    }
    // Section headers for press / awards (already in structured data)
    if (/^###?\s+(Пресса|Press|Награды|Awards|Номинации)/.test(t)) {
      skipUntilBlank = true
      continue
    }
    // Numbered press links  e.g. "1. [**Title**](url)"
    if (/^\d+\.\s+\[/.test(t)) continue
    // Bare URLs
    if (/^https?:\/\//.test(t)) continue
    if (/^\[https?:\/\//.test(t)) continue
    // Aside / HTML tags
    if (/^<aside/.test(t) || /^<\/aside/.test(t)) continue

    if (skipUntilBlank) {
      if (t === '') skipUntilBlank = false
      continue
    }

    out.push(line)
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
