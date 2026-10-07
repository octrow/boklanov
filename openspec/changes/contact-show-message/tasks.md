# Tasks

## 1. Message

- [ ] 1.1 Confirm the copy table in proposal.md with the user; add the three message templates and the copy/copied labels to `messages/{en,ru,de}.json`
- [ ] 1.2 `/contact` builds a `slug → message` map server-side (kind from the existing booking-kind rule, as for subjects); verify with curl on localhost that the map holds the right text for beware-of-the-dog (tour), bury-me-behind-the-baseboard (new), mcqueen-blood-beneath-skin (premiere)

## 2. Channels

- [ ] 2.1 The Telegram button appends `?text=<encoded message>` when `?show=` is known and the URL is a `t.me/<username>` link; verify in a browser on localhost the href for `/contact?show=beware-of-the-dog`, `/ru/contact?show=bury-me-behind-the-baseboard`, and that `/contact` and `/contact?show=nope` keep the plain link
- [ ] 2.2 A "Copy message" button under the Telegram/Instagram pair, styled like the email Copy button, shows "Copied" after a click; verify in Playwright (clipboard permission) that the clipboard holds the message and that the button is absent without `?show=`; 390×844 screenshot shows no layout change beyond the new button

## 3. Ship

- [ ] 3.1 tsc and eslint on touched files pass; commit to main, push, wait for boklanov_v2 success; repeat 2.1 and 2.2 checks on boklanov.com; open the prod Telegram link once on a phone if the user can (Telegram prefill for a personal chat is documented, not yet observed)
- [ ] 3.2 Add a DESIGN_REVIEW_CHANGELOG.md entry (sixth critique plan + this change) and commit
