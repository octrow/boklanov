/** Text for a CDATA block. `]]>` would end the block early, so it is split
 *  across two blocks. `&` stays as is: CDATA is not entity-decoded. */
export function cdata(text: string): string {
  return `<![CDATA[${text.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

/** Text for an XML element or attribute outside CDATA. */
export function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
