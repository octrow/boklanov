# Proposal

## Why

`/contact?show=<slug>` keeps the show only in the email subject. Email is the secondary channel; Telegram and Instagram are primary (PRODUCT.md, reconfirmed 2026-10-06), and their buttons are bare profile links, so most enquiries lose which show they are about (sixth critique, P2; decided 2026-10-07: prefill Telegram, add Copy for Instagram).

## What Changes

- When `?show=<slug>` names a known production, `/contact` builds a ready first message in the page's locale, worded by the same kind as the booking CTA (tour / new production / premiere).
- The Telegram button opens the chat with that message pre-entered (`t.me/<username>?text=…`, documented by Telegram for public username links).
- A "Copy message" button sits under the Telegram and Instagram buttons, for Instagram (no prefill) and as a fallback when Telegram drops the text.
- Without `?show=` (or with an unknown slug) the page is unchanged: plain links, no copy button.
- No restyle of /contact: the copy button reuses the existing email Copy button's look.

Proposed copy (confirm at apply):

|             | EN                                                         | RU                                                              | DE                                                                  |
| ----------- | ---------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| tour        | Hello Roman, I'm writing about touring {title}.            | Здравствуйте, Роман! Пишу насчёт гастролей спектакля «{title}». | Hallo Roman, ich schreibe wegen eines Gastspiels von {title}.       |
| new         | Hello Roman, I'm writing about a new production ({title}). | Здравствуйте, Роман! Пишу насчёт новой постановки («{title}»).  | Hallo Roman, ich schreibe wegen einer neuen Inszenierung ({title}). |
| premiere    | Hello Roman, I'm writing about the premiere of {title}.    | Здравствуйте, Роман! Пишу насчёт премьеры «{title}».            | Hallo Roman, ich schreibe wegen der Premiere von {title}.           |
| copy button | Copy message                                               | Скопировать сообщение                                           | Nachricht kopieren                                                  |
| copied      | Copied                                                     | Скопировано                                                     | Kopiert                                                             |

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `booking-cta`: adds the prefilled message for the primary channels on `/contact?show=`.

## Impact

- `app/[locale]/contact/page.tsx` (server-built `slug → message` map, like the subject map), `ShowTopic.tsx` (Telegram href + copy button island), `messages/{en,ru,de}.json`.
- Telegram URL comes from the admin Contact global (`telegramUrl`); the `text` parameter is appended only when it is a `t.me/<username>` link.
- Out of scope: Instagram has no prefill API; the DM still starts empty and relies on the copy button.
