## Personal website

[![Build Status](https://github.com/transitive-bullshit/nextjs-notion-starter-kit/actions/workflows/build.yml/badge.svg)](https://github.com/transitive-bullshit/nextjs-notion-starter-kit/actions/workflows/build.yml) [![Prettier Code Formatting](https://img.shields.io/badge/code_style-prettier-brightgreen.svg)](https://prettier.io)

## Setup

Config: [site.config.ts](./site.config.ts)

**Requirements**: Node.js >= 24 (Next.js 15, React 19, TypeScript 5.9)

1. Clone repo
2. Edit [site.config.ts](./site.config.ts) - set `rootNotionPageId`
3. `npm install`
4. `npm run dev`
5. `npm run deploy`

Notion page setup:
- Use any public Notion page
- Extract page ID from URL: `7875426197cf461698809def95960ebf`
- Find workspace ID: browser console → `block.space_id`

## URL Paths

Dev: `/nextjs-notion-blog-d1b5dcf8b9ff425b8aef5ce6f0730202` (slugified title + ID)
Prod: `/nextjs-notion-blog` (slugified title only)

Auto-generated during build. See [mapPageUrl](./lib/map-page-url.ts), [getCanonicalPageId](https://github.com/NotionX/react-notion-x/blob/master/packages/notion-utils/src/get-canonical-page-id.ts).

Override per-page: add `Slug` text property to database.

Duplicate slugs throw error.

## Preview Images

Uses [next/image](https://nextjs.org/docs/api-reference/next/image) + [lqip-modern](https://github.com/transitive-bullshit/lqip-modern).

Enabled by default. Disable: `isPreviewImageSupportEnabled = false` in `site.config.ts`.

### Redis

Cache preview images across builds.

Enable: `isRedisEnabled = true` in `site.config.ts`

Set env vars:
```bash
REDIS_HOST='TODO'
REDIS_PASSWORD='TODO'
```

## Styles

CSS: [styles/notion.css](./styles/notion.css)

Targets react-notion-x classes from [styles.css](https://github.com/NotionX/react-notion-x/blob/master/packages/react-notion-x/src/styles.css).

Target blocks by ID:
```css
.notion-block-260baa77f1e1428b97fb14ac99c7c385 {
  display: none;
}
```

## Contributing

[Contribution guide](contributing.md) | [Contributors](https://github.com/transitive-bullshit/nextjs-notion-starter-kit/graphs/contributors)

## License

MIT © [Travis Fischer](https://transitivebullsh.it)

