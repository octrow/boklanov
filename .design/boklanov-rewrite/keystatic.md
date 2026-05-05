# Introduction

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/introduction.mdoc
---
title: Introduction
summary: >-
Keystatic is designed to work when you're creating a new site, or to introduce
content management into your existing codebase.
---
Keystatic is designed to work when you're creating a new site, or to introduce content management into your existing
codebase.

It can save data locally, directly to Github, or both.

---

## Quick start

{% tags tags=["New project", "Local"] /%}

{% layout %}
{% layout-area %}
**Good for:**

- Checking out Keystatic for the first time.
- Starting a new project from scratch.
- Making a quick prototype.
  {% /layout-area %}

{% layout-area %}
**What you get:**

- A local version of Keystatic running in Next.js or Astro
- Changes saved to your local file system
  {% /layout-area %}
  {% /layout %}

[Follow the Quick start guide](/docs/quick-start)

---

## Add to your existing project

{% tags tags=["Existing project", "Local", "Astro", "Next.js", "Remix"] /%}

{% layout %}
{% layout-area %}
**Good for:**

- Making your existing project editable!
- Adding Keystatic to your project with minimal effort.
  {% /layout-area %}

{% layout-area %}
**What you get:**

- Keystatic content management set up in your existing project.
  {% /layout-area %}
  {% /layout %}

- [Astro integration guide](/docs/installation-astro)
- [Next.js integration guide](/docs/installation-next-js)
- [Remix integration guide](/docs/installation-remix)

More framework guides coming soon!

# Quick start

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/quick-start.mdoc

---
title: Quick start
summary: The fastest way to get started with Keystatic.
---

## Keystatic CLI

The quickest way to get started is to run the Keystatic CLI in your terminal. It creates a new project (Next.js, Astro
or Remix), integrated with Keystatic.

```bash
npm create @keystatic@latest
```

Watch this introduction to the CLI and the Keystatic Admin UI:

{% embed
mediaType="video"
embedCode="<iframe width=\"560\" height=\"315\" src=\"https://www.youtube.com/embed/6q9M-dIrbNk\" title=\"YouTube video
player\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope;
picture-in-picture; web-share\" allowfullscreen></iframe>" /%}

---

## Bring your own project

Already have an existing project? We've got integration guides
for [Astro](/docs/installation-astro), [Next.js](/docs/installation-next-js) and [Remix](/docs/installation-remix).

# Keystatic Cloud

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/cloud.mdoc

---
title: Keystatic Cloud
summary: >-
Keystatic Cloud takes care of GitHub authentication for you, and provides an
opt-in image storage, optimisation and delivery service.
---
[Keystatic Cloud](https://keystatic.cloud) simplifies authentication (GitHub) with your projects. No need to deal with
environment variables and a custom GitHub app.

Keystatic Cloud also offers opt-in products such as [Cloud Images](#cloud-images) (an image storage, optimisation and
delivery service) or multi-player editing.

---

## Authentication

Keystatic Cloud lets you connect to GitHub and authenticate for one or multiple Keystatic projects.

It skips the more complicated process of [setting up GitHub mode](/docs/github-mode), while also allowing team members
to edit content without needing a GitHub account.

## Teams and projects

Keystatic cloud organises projects into teams. Each team can have multiple projects, and each project is be connected to
a specific GitHub repository.

User access is set at the team level, so every user in team will have access to all projects within that team.

## Free vs Pro plans

[Creating a Keystatic Cloud account](https://keystatic.cloud) is free. You can create as many teams and projects as
needed.

The free plan allows for up to 3 users per team.

If you need more than 3 users on a given team, you'll need to upgrade that specific team to Pro. You can do so from
the "billing" tab for that team.

Keystatic Cloud Pro starts at $10/month. Adding beyond 3 users to a team costs $5/month per user.

A Pro plan only affects the one team it's applied to.

---

## Pro features

Besides allowing you to add more than 3 users to a team, Keystatic Cloud Pro also offers the following features:

- **Multi-player editing** (experimental): collaborate with other editors in real-time on the same document.
- **Cloud Images**: upload, transform and serve optimized images without cluttering your GitHub repository.

Once subscribed to Pro, you'll be able to enable these features on the settings tab of a given team.

---

## Cloud Images

Cloud Images is an opt-in image storage and delivery service that optimises your images for the web.

Each Keystatic Cloud project can have its own Image Library, where you can upload images and copy the URL to use in your
content.

### Image optimisation via URL query parameters

When using Keystatic Cloude image URLs, you can pass the following optional query parameters to drastically improve the
performance of your images:

- **`fit`** — how the image should be resized to fit the dimensions you specify. Possible values are `scale-down`,
  `contain`, `cover` and `crop`.
- **`format (f)`** — the image format to use. Possible values are `png`, `avif`, `webp` and `jpeg`.
  If no format is provided, Keystatic Cloud will auto-detect browser capabilities and serve the most optimal format.
- **`quality (q)`** — the quality of the image. A number between `1` and `100`.
- **`height (h)`** — the height of the image. A number between `1` and `10240`.
- **`width (w)`** — the width of the image. A number between `1` and `10240`.

You can provide one or both of height and width, which will have a different effect based on the fit.

Here's an example URL with image transform query parameters:

```
https://[IMAGE_URL]?width=240&height=480&fit=crop
```

### Cloud image field

Keystatic provides a [`cloudImage` field](/docs/fields/cloud-image), which can be used instead of
the [regular image field](/docs/fields/image) if Keystatic is running in cloud mode, and the Image Library is enabled
for the project.

### Cloud image component block (experimental)

Keystatic also provides a `CloudImage` component block, which can be used within the flow of
a [document field](/docs/fields/document).

Again, you'll need Keystatic running in `cloud` mode, and have the Image Library enabled for the project.

{% aside icon="🚧" %}
Documentation for the `CloudImage` component block is coming soon.
{% /aside %}

---

## Configuring your project with Keystatic Cloud

In your Keystatic config, you'll need to set the `storage` option to `cloud`.

You'll also need to add the `cloud.project` property with the name of the team and project from your Keystatic Cloud
account:

```ts
import { config } from '@keystatic/core'

export default config({
  storage: {
    kind: 'cloud',
  },
  cloud: {
    project: '[TEAM_NAME]/[PROJECT_NAME]',
  },
  ...
})
```

Each project in Keystatic Cloud has a settings page where you'll find a ready-to-paste code snippet in your config file.

---

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how Keystatic Cloud works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/S_0333JEs6w?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

# Adding Keystatic to a Next.js project

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/installation-next-js.mdoc
---
title: Adding Keystatic to a Next.js project
summary: Integrating Keystatic with an existing Next.js 13 project.
---
{% aside icon="☝️" %}
This guide assumes you have an existing Next.js 14 project, and are using the `app` directory.
{% /aside %}

If you don't have an existing Next.js project, you can create a new one with the following command:

```bash
npx create-next-app@latest
```

## Installing dependencies

Install two Keystatic packages and `@markdoc/markdoc`:

```bash
npm install @keystatic/core @keystatic/next @markdoc/markdoc
```

## Creating a Keystatic config file

A Keystatic config file is required to define your content schema. This file will also allow you to connect a project to
a specific GitHub repository (if you decide to do so).

Create a file called `keystatic.config.ts` in the root of the project and add the following code to define both your
storage type (`local`) and a single content collection (`posts`):

```typescript
// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
  },
});
```

Keystatic is now configured to manage your content based on your schema.

---

## Setting up the Keystatic Admin UI

First, create a `src/app/keystatic/keystatic.ts` file:

```ts
// src/app/keystatic/keystatic.ts
"use client";

import { makePage } from "@keystatic/next/ui/app";
import config from "../../../keystatic.config";

export default makePage(config);
```

Next, create a layout file called `src/app/keystatic/layout.tsx`:

```tsx
// src/app/keystatic/layout.tsx
import KeystaticApp from "./keystatic";

export default function Layout() {
  return (
    <KeystaticApp />
  );
}

```

Next, create a page called `src/app/keystatic/[[...params]]/page.tsx`:

```jsx
// src/app/keystatic/[[...params]]/page.tsx

export default function Page() {
  return null;
}

```

Finally, create an API route called `src/app/api/keystatic/[...params]/route.ts`

```tsx
// src/app/api/keystatic/[...params]/route.ts
import { makeRouteHandler } from '@keystatic/next/route-handler';
import config from '../../../../../keystatic.config';

export const { POST, GET } = makeRouteHandler({
  config,
});

```

You can now launch the Keystatic Admin UI. Start the Next dev server:

```bash
npm run dev
```

Visit `http://127.0.0.1:3000/keystatic` to see the Keystatic Admin UI running.

---

## Creating a new post

{% aside icon="☝️" %}
In our Keystatic config file, we've set the `path` property for our `posts` collection to `src/content/posts/*`.

As a result, creating a new post from the Keystatic Admin UI should create a new `content` directory in the `src`
directory, with the new post `.mdoc` file inside!
{% /aside %}

Go ahead — create a new post from the Admin UI, and hit save.

You will find your new post inside the `src/content/posts` directory:

```bash
src
└── content
    └── posts
        └── my-first-post.mdoc
```

Navigate to that file in your code editor and verify that you can see the Markdown content you entered. For example:

```markdown
---
title: My First Post
---

This is my very first post. I am **super** excited.
```

---

## Rendering Keystatic content

{% aside icon="💡" %}
Keystatic provides a [Reader API](/docs/reader-api) to bring content to the front end. As it is a Node API it must be
run server-side.
{% /aside %}

### Displaying a collection list

The following example displays a list of each post title, with a link to an individual post page:

```tsx
// src/app/posts/page.tsx
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../../keystatic.config';

import Link from 'next/link';

// 1. Create a reader
const reader = createReader(process.cwd(), keystaticConfig);

export default async function Page() {

  // 2. Read the "Posts" collection
  const posts = await reader.collections.posts.all();
  return (
    <ul>
      {posts.map(post => (
        <li key={post.slug}>
          <Link href={`/posts/${post.slug}`}>{post.entry.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

### Displaying a single collection entry

To display content from an individual post, you can use Markdoc's `transform` and `renderers.react` functions:

```tsx
// src/app/posts/[slug]/page.tsx
import { createReader } from "@keystatic/core/reader";
import React from "react";
import Markdoc from "@markdoc/markdoc";

import keystaticConfig from "../../../../keystatic.config";

const reader = createReader(process.cwd(), keystaticConfig);

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await reader.collections.posts.read(params.slug);
  if (!post) {
    return <div>No Post Found</div>;
  }
  const { node } = await post.content();
  const errors = Markdoc.validate(node);
  if (errors.length) {
    console.error(errors);
    throw new Error('Invalid content');
  }
  const renderable = Markdoc.transform(node);
  return (
    <>
      <h1>{post.title}</h1>
      {Markdoc.renderers.react(renderable, React)}
      <hr />
      <a href={`/posts`}>Back to Posts</a>
    </>
  );
}
```

---

## Deploying Keystatic + Next.js

Because Keystatic needs to run serverside code
and [Next.js API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes), you will need to
ensure that your hosting provider supports Node.js.

You will also probably want to [connect Keystatic to GitHub](/docs/github-mode) so you can manage content on the
deployed instance of the project.

# How Keystatic organises your content

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/content-organisation.mdoc
---
title: How Keystatic organises your content
summary: Control and flexibility with where your content gets generated.
---
Keystatic has two&nbsp;*concepts*&nbsp;or structures to organise data:&nbsp;`collections`&nbsp;and&nbsp;`singletons`.

Those are defined in the&nbsp;[Keystatic configuration](/docs/configuration).

You get a lot of control and flexibility with *where* your content gets generated, both at the `collection` or
`singleton` level, and at the `field` level for certain field types, like images.

### Path configuration

You can define _where_ Keystatic should store collection entries and singletons via the `path` property in the
collection/singleton top-level options:

```javascript
// Keystatic config
export default config({
  collections: {
    posts: collection({
      label: 'Posts',
      path: 'content/posts/*/',
      // ...
    })
  },
  singletons: {
    settings: singleton({
      label: 'Settings',
      path: 'content/posts/',
      // ...
    })
  }
})

```

The optional trailing slash `/` on that path has an impact on the content structure - read below for more details on
`collection paths` and `singleton paths`.

{% aside icon="⚡️" %}
`collections` require a `*` wildcard part of the path string.

This will be replaced by the slug of the entry.
{% /aside %}

We will go over core concepts here, but check out the [Path wildcard page](/docs/path-wildcard) for more details and
advanced examples.

---

## Collections

The default `path` value, if not specified, will be `{collection-name}/*/`.

### Collection paths ending with a trailing slash `/`

If the path ends with a trailing slash `/`, each entry will be created in its own directory named after the slug:

```yaml
collection-name
└── slug
├── index.yaml
└── other.mdoc
```

Say you create two entries in the `posts` collection, where the `path` is set to `'content/posts/*/'`.

Since there is a trailing slash in the `path`, the generated output will look like so:

```yaml
content
└── posts
├── my-first-post
├── index.yaml
├── other.mdoc
└── my-second-post
├── index.yaml
└── other.mdoc
```

### Collection paths ending without a trailing slash

If the path does not end with a trailing slash, entries' index files will be created immediately inside the collection
directory:

```yaml
collection-name
├── slug.yaml
└── slug
└── other.mdoc
```

Say you create two entries in the `posts` collection, where the `path` is set to `'content/posts/*'`.

Since there is no trailing slash in the `path`, the generated output will look like so:

```yaml
content
└── posts
├── my-first-post.yaml
└── my-first-post
└── other.mdoc
├── my-second-post.yaml
└── my-second-post
└── other.mdoc
```

---

## Singletons

The `path` property for singletons does not contain a `*` wildcard.

If not specified, the default `path` value for singletons will be `{singleton-name}/`.

### Singleton paths ending with a trailing slash `/`

If the path ends with a trailing slash `/`, the singleton's content will be created **inside a directory** named after
the singleton:

```yaml
singleton-name
├── index.yaml
└── other.mdoc

```

### Singleton paths ending without a trailing slash

If the path does not end with a trailing slash, the content will be stored **in a file** named after the singleton.

Additional document fields will be stored inside a directory with the same name:

```yaml
singleton-name.yaml
singleton-name
└── other.mdoc

```

---

## Images output path

You can decide where to store your images independently of the path configuration for a given collection or singleton.

This is useful when you want to have your images in the `public` or `assets` directory, to comply to framework-specific
conventions.

```javascript
// In the context of a `posts` collection...
coverImage: fields.image({
  label: "Cover Image",
  directory: "public/images/posts",
}),

```

Regardless of where the `posts` entries are created, the `coverImage` image will be generated in
`public/images/posts/{post-slug}`.

---

## Path prefix

If you're in a monorepo, you can use the `storage.pathPrefix` option to scope Keystatic to a specific directory instead
of adding a prefix to every `path` option.

For example, this config will look for posts in `somewhere/my-site/content/posts`:

```js
export default config({
  storage: {
    kind: 'github',
    repo: 'my-org/my-repo',
    pathPrefix: 'somewhere/my-site'
  },
  collections: {
    posts: collection({
      label: 'Posts',
      path: 'content/posts/*/',
      // ...
    })
  },
})
```

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) also
provides context on how the path configuration works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/0Zo9q2tcn3k\" title=\"YouTube video player\" frameborder=\"0\"
allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\"
allowfullscreen></iframe>" /%}

# Path wildcard

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/path-wildcard.mdoc
---
title: Path wildcard
summary: Granular control over where Keystatic stores content.
---

The `path` wildcard for Keystatic [collections](/docs/collections) gives you flexibility and control over your where
your content is being output.

It's a glob pattern that lets you organise your content to support most scenarios.

## Nested folder output example

{% aside icon="👉" %}
`path: 'packages/design-system/*/docs/'`
{% /aside %}

Imagine a Design System inside a monorepo:

```sh
root
├── packages
  ├── design-system
    ├── button
      └── src
    ├── dropdown
      └── src
└── apps
  └── docs(keystatic)
```

Your Keystatic site lives in `apps/docs`, but you want your documentation entries in
`packages/design-system/{component-name}/docs/`, to collocate them with each component.

The following path will let you do exactly that:

```
path: 'packages/design-system/*/docs/'
```

## Nested slug example

{% aside icon="👉" %}
`path: 'content/posts/**'`
{% /aside %}

There may be situations where you need the `slug` of an entry to be following a multi-folder structure.

Say you want the **same collection** to support this following tree structure:

```sh
content
├── posts
  ├── en
      └── post-1.mdoc
  ├── fr
      └── post-1.mdoc
```

You can enable this by using the `**` wildcard in your `path`:

```
path: 'content/posts/**'
```

Since Keystatic `slugs` can contain `/` characters, you construct a multi-folder structure with `slug` field values
like: `en/post-1` and `fr/post-1`.

# Local mode

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/local-mode.mdoc

---
title: Local mode
summary: >-
Store your content on your local file system.
---
Most projects start their lifecycle with Keystatic in `local` storage mode:

```ts
// keystatic.config.ts
export default config({
  storage: {
    kind: 'local'
  }
})
```

Content is stored on your local file system directly, and this is what makes the most sense when starting a project.

{% aside icon="☝️"%}
New projects started with the [Keystatic CLI](/docs/quick-start) will be running in `local` mode.
{% /aside %}

### GitHub collaboration

Keystatic also has a [github mode](/docs/github-mode) which unleashes enhanced collaboration capabilities.

# GitHub mode

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/github-mode.mdoc
---
title: GitHub mode
summary: >-
Walk-through guide of manually connecting your existing Keystatic project to
GitHub.
---
Keystatic's `github` mode unleashes enhanced collaboration capabilities.

To use it, you'll need your project on an existing GitHub repository. Collaborators will need `write` access to this
repository.

---

## Setting up GitHub mode

Start by changing the `storage` option in your Keystatic config to use the `github` kind.

You will need to specifiy a repo `owner` and `name`:

```diff
storage: {
-  kind: 'local',
+  kind: 'github',
+  repo: {
+    owner: REPO_OWNER,
+    name: REPO_NAME
+  }
}
```

You can also define the `repo` as a string with the `owner/name` format:

```ts
storage: {
  kind: 'github',
    repo
:
  `${REPO_OWNER}/${REPO_NAME}`
}
```

### Connecting with GitHub

With `github` mode on, visit the `/keystatic` route. You will be prompted to login with GitHub.

The first time you click this button will initiate the setup process:

{% cloud-image
src="https://thinkmill-labs.keystatic.net/keystatic-site/images/m89vlce42r9h/create-keystatic-github-app"
alt="Screenshot of Keystatic App setup"
height=1480
width=1468 /%}

If you happen to know the URL of your deployed project and/or the GitHub repo is owned by a GitHub organization, you can
fill in those fields.

Otherwise, leave them blank and click on "Create GitHub App".

### Create  a custom GitHub App

The next step will walk you through creating a GitHub App. Choose a name for your app, and proceed.

### Grant repo access

Next, you will need to grant this new GitHub App access to your GitHub repo:

{% cloud-image
src="https://thinkmill-labs.keystatic.net/keystatic-site/images/oobbqvaxikou/github-app-installation-screen"
alt="Screenshot of successful Keystatic App installation"
height=666
width=892 /%}

{% cloud-image
src="https://thinkmill-labs.keystatic.net/keystatic-site/images/u7mw0hg9y40m/github-app-permissions"
alt="Screenshot of GitHub custom app authorization UI"
height=1902
width=1348 /%}

Finally, you will be taken back to your local Keystatic Admin UI... running in `github` mode!

{% aside icon="👀" %}
You can tell Keystatic runs in `github` mode by the extra UI around your GitHub repo, like a branch dropdown.
{% /aside %}

### New environment variables

Behind the scenes, some environment variables were generated in a `.env` file on your project:

```bash
# Keystatic
KEYSTATIC_GITHUB_CLIENT_ID=...
KEYSTATIC_GITHUB_CLIENT_SECRET=...
KEYSTATIC_SECRET=...
NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=... # for Next.JS or `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` for Astro
```

These variables are used to authenticate users with GitHub, based on their access to the GitHub repo in question.

Next time someone with `write` access on the repo visits `/keystatic`, they will be able to login and access the Admin
UI.

## Branch prefix

The `branchPrefix` option lets you scope out what GitHub branches Keystatic should interact with:

```diff
storage: {
   kind: 'github',
   repo: 'Thinkmill/keystatic',
+  branchPrefix: 'my-prefix/'
}
```

Keystatic will only list branches starting with `my-prefix/` in the Admin UI, and will only let you create new branches
with that prefix.

## Add `redirect_uri`

When you authorize on a server and get the following error from GitHub, you need to modify the GitHub application
settings.

{% aside %}

> Be careful!
> The `redirect_uri` is not associated with this application.
> The application might be misconfigured or could be trying to redirect you to a website you weren't expecting.

{% /aside %}

To add a redirect URL:

1. Go to
   the [list of "Installed Github Apps"](https://docs.github.com/en/apps/using-github-apps/reviewing-and-modifying-installed-github-apps#navigating-to-the-github-app-you-want-to-review-or-modify)

- For Users: [`https://github.com/settings/installations`](https://github.com/settings/installations)
- For Organisations: `https://github.com/organizations/<org name>/settings/installations`

2. Select the app > Choose "App settings"

- For Users: `https://github.com/settings/apps/<app slug>`
- For Organisations: `https://github.com/organizations/<org name>/settings/apps/<app slug>`

3. Use "Add Callback URL" > Add the additional URL > Save

Now try reloading the authentication page.

---

## Deploying Keystatic

Coming soon 🚧

{% aside icon="⚡️" %}
The process of deploying Keystatic can vary based on where you're deploying, but here's the **TL;DR**:

- Copy the Keystatic environment variables over to your deployed environment,
- Make sure the host can run Node.js for Keystatic's API routes.
  {% /aside %}

---

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how to set up the `github` storage kind:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/BAnfePGzkbg?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

# Reader API

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/reader-api.mdoc
---
title: Reader API
summary: >-
The Reader API is a Node.js API that lets you read Keystatic content from a
storage of your own choice.
---
The Reader API is a Node.js API that lets you *read* Keystatic content from a storage of your own choice.
The storage can be any local directory / GitHub repository, and does not need to be the same as the one defined in the
Keystatic config.

{% aside icon="⚠️" %}
The reader API code is meant to run on the server, and not in the browser. Be sure to use it accordingly.
{% /aside %}

## Usage

### Local Directory

To read from local storage, import the `createReader` function, as well as your Keystatic config file:

```javascript
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from 'relative/path/to/your/keystatic.config';
```

You can then create a new `reader` by calling `createReader` and passing it two arguments:

1. Path to the root of your content repository
1. The Keystatic config

```javascript
const reader = createReader(process.cwd(), keystaticConfig);
```

### GitHub Repository

To read from GitHub, import the `createGitHubReader` function, as well as your Keystatic config file:

```javascript
import { createGitHubReader } from '@keystatic/core/reader/github';
import keystaticConfig from 'relative/path/to/your/keystatic.config';
```

You can then create a new `reader` by calling `createGitHubReader` and passing it the following arguments:

1. The Keystatic config
1. An options object containing:

- `repo`: The name of the content repository on GitHub (e.g. `Thinkmill/keystatic-data`)
- `token`: The Personal Access Token that allows read access to the repository. This is different from your GitHub App
  Client ID / Secret in `.env`.
  For information on how to generate PATs,
  see [GitHub's documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

```javascript
const reader = createGitHubReader(keystaticConfig, {
  repo: 'Thinkmill/keystatic-data',
  token: process.env.GITHUB_PAT,
});
```

---

## Reading from collections

You can get an **array of slugs** for a given collection with:

```javascript
const slugs = await reader.collections.
{
  collectionName
}
.
list();

// Example
const slugs = await reader.collections.posts.list();
```

You can get the data for a specific collection entry with:

```javascript
const entry = await reader.collections.
{
  collectionName
}
.
read(slug);

// Example
const post = await reader.collections.post.read(slug);
```

You can get an array of objects containing **both** slug and entry data for a collection with:

```javascript
const entries = await reader.collections.
{
  collectionName
}
.
all();

// Example
const posts = await reader.collections.blog.all();
```

---

## Reading from singletons

You can get the data for a specific singleton with:

```ts
const data = await reader.singletons.
{
  singletonName
}
.
read();

// Example
const navigation = await reader.singletons.navigation.read();
```

**Remember:** this code cannot run in the browser, as it's using some Node.js APIs.

Good places to use the Reader API are:

- `getStaticProps` in **Next.js (Pages Router)**
- The frontmatter in **Astro** files
- The `loader()` function in **Remix**
- React **Server Components**

---

## Data from linked files

If your collection or singleton contains a `document` field, that field will be returned as an asynchronous function
that you'll need to call to get the data:

```ts
// The `posts` collection has a `document` field named `content`
const post = await reader.collections.posts.read(slug);

// Get the content data
const content = await post.content()
```

If you'd rather get the `document` field data immediately, you can pass `resolveLinkedFiles: true` as an option when
reading the entry:

```ts
await reader.collections.posts.read(slug, { resolveLinkedFiles: true });
```

---

## Using TypeScript

The Reader API exports an `Entry` type, which is useful when you need to define what props a UI component should
receive:

```ts
import { Entry } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

type MovieProps = Entry<typeof keystaticConfig['collections']['movies']>

export function Movie(props: MovieProps) {
  // ...
}
```

If your data was read using the `resolvedLinkedFiles` option, you can use the `EntryWithResolvedLinkedFiles` type
instead:

```ts
import { EntryWithResolvedLinkedFiles } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

type MovieProps = EntryWithResolvedLinkedFiles<typeof keystaticConfig['collections']['movies']>
```

---

## Rendering content from the document field

The `document` field returns a JSON object with complex structured data. It can be a lot of work to turn this data
object as HTML to render it on a page.

Luckily, Keystatic also provides a `DocumentRenderer` that does all the heavy lifting for you, and is highly
customisable.

---

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how the Reader API works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/8831JbFOCN4?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

---

## Type signature

Find the latest version of the `Reader` type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.reader.Reader](https://docsmill.dev/npm/@keystatic/core@latest#/reader.Reader)

# Format options

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/format-options.mdoc
---
title: Format options
summary: >-
The `format` option lets you configure Keystatic's output files. Choose
between JSON, YAML or Markdoc.
---
Keystatic is capable to store your data in multiple formats: YAML, JSON, Markdoc and MDX.

By default, entries will be stored in a YAML file.

If the collection contains a `document`, `markdoc` or `mdx` field, a separate `.mdoc` or `.mdx` file will be generated
for the content of those fields.

The name and directory structure of entries is also affected by the `path` settings on a given collection or singleton.
See the [Content organisation page](/docs/content-organisation) for more details.

## Example (default format options)

```typescript
blog: collection({
  label: 'Blog',
  slugField: 'title',
  schema: {
    title: fields.slug({ name: { label: 'Title' } })
    publishedDate: fields.date({ label: 'Published date' }),
    body: fields.markdoc({ label: 'Body' })
  }
})
```

With the above config, creating a new `blog` entry with a `what-a-day slug` will generate the following files:

```bash
blog/what-a-day
├── index.yaml
└── body.mdoc
```

The `index.yaml` file will look like so:

```yaml
title: What a day
publishedDate: 2023-07-27
```

The `body.mdoc` file will look like so:

```markdown
What a **beautiful** day!

## Let's go to the beach

I say we pack our swimmers and towels and head to the beach.

Who's with me?
```

---

## Example with JSON data

We can specifically ask for `json` data instead of `yaml` with the `format.data` option in our `blog` collection:

```diff
blog: collection({
  label: 'Blog',
  slugField: 'title',
+ format: { data: 'json' },
  schema: { //... }
})
```

The files generated will now look like this:

```bash
blog/what-a-day
├── index.json
└── body.mdoc
```

The `index.json` file will look like so:

```json
{
  "title": "What a day",
  "publishedDate": "2023-07-27"
}
```

The `body.mdoc` file will look like so:

```markdown
What a **beautiful** day!

## Let's go to the beach

I say we pack our swimmers and towels and head to the beach.

Who's with me?
```

---

## Example with single file output

Quite often, you may want Keystatic to output all the fields within the same file, with the "metadata" fields placed in
a frontmatter on top of the file.

The `format.contentField` option lets you do that.

You need to reference a `markdoc`, `mdx` or `document` field from the schema as the `contentField` value for it to work:

```diff
blog: collection({
  label: 'Blog',
  slugField: 'title',
+ format: { contentField: 'body' },
  schema: {
    title: fields.slug({ name: { label: 'Title' } })
    publishedDate: fields.date({ label: 'Published date' }),
    body: fields.markdoc({ label: 'Body' })
  }
})
```

Instead of outputting the data for the `body` field in a separate file, Keystatic will now output everything inside a
single `index.mdoc` file:

```bash
blog/what-a-day
└── index.mdoc
```

The `index.mdoc` file will look like this:

```markdown
---
title: What a day
publishedDate: 2023-07-27
---

What a **beautiful** day!

## Let's go to the beach

I say we pack our swimmers and towels and head to the beach.

Who's with me?
```

## Type signature

Find the latest version of the `Format` type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.Format](https://docsmill.dev/npm/@keystatic/core@latest#/.Format)

# Entry layout

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/entry-layout.mdoc

---
title: Entry layout
summary: >-
The entryLayout option on collections and singletons lets you decide how much
prominence you give to your long-form WYSIWYG field.
---
Collections and singletons both have an `entryLayout` option, which can be set to either `"form"` (default) or
`"content"`.

While the default `"form"` layout stacks every field on top of each other, the `"content"` layout will give more
prominence to a selected `document`, `markdoc` or `mdx` filed and move all the other fields into a sidebar.

{% aside icon="✋" %}
**Note:** Setting the `entryLayout` will only take effect if `format.contentField` is referencing a `document`,
`markdoc` or `mdx` field for the collection or entry.
{% /aside %}

See the [Format options](/docs/format-options) page for more details.

## Example

```typescript
blog: collection({
  label: 'Blog posts',
  path: 'src/content/blog/**',
  entryLayout: 'content',
  format: {
    contentField: 'body',
  },
  schema: {}
})
```

With the above config, the `blog` entry layout will put the `body` field front and center. All the other fields will be
placed in a sidebar:

{% cloud-image
src="https://thinkmill-labs.keystatic.net/keystatic-site/images/lseg2m1wjh53/entry-layout"
alt="Screenshot of Keystatic's \"content\" entry layout."
height=939
width=1496 /%}

You can think about&nbsp;`entryLayout: "content"`&nbsp;as the "focus" copywriting mode!

---

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how the entry layout works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/7Ex24wna6L4?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

---

## Type signature

Find the latest version of the `entryLayout`&nbsp;type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.EntryLayout](https://docsmill.dev/npm/@keystatic/core@latest#/.EntryLayout)

# User interface

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/user-interface.mdoc

---
title: User interface
summary: >-
Configure parts of the Admin UI to improve the experience of your content
editors.
---
Configure parts of the Admin UI to improve the experience of your content editors. Making the interface familiar to your
editors will help them get started quickly and feel at home.

## Example

Out-of-the-box Keystatic will default the brand name depending on the storage mode used. You can override this by
providing a `brand` object in the `ui` key of your config.

```jsx
// keystatic.config.ts
import { config } from '@keystatic/core'

export default config({
  ...
    ui
:
{
  brand: {
    name: 'Your brand'
  }
,
}
,
})
```

## Brand

In the example above we've set the brand `name`, which will be used in the Admin UI as the title of the app. You can
also set the brand `mark` using a React component to render your logo or anything you like.

We recommend a maximum height of `24px` so the element fits well with the rest of the UI.

{% aside icon="🎨" %}
The component has a single prop `colorScheme` which is either `light` or `dark` depending on the user's preference. You
can use this to render a different asset or apply a different style.
{% /aside %}

```tsx
// keystatic.config.tsx
import { config } from '@keystatic/core'

export default config({
  ...
    ui
:
{
  brand: {
    name: 'Your brand',
      mark
  :
    ({ colorScheme }) => {
      let path = colorScheme === 'dark'
        ? '//your-brand.com/path/to/dark-logo.png'
        : '//your-brand.com/path/to/light-logo.png';

      return <img src={path} height={24} />
    },
  }
,
}
,
})
```

When using inline SVGs you can employ `"currentColor"` for `fill` and `stroke` values to inherit the foreground color.
This is what we do for the Keystatic instance of this docs website.

## Navigation

Out-of-the-box Keystatic will separate navigation into two groups: `Collections` and `Singletons`. You can override this
by providing a `navigation` object in the `ui` key of your config, organising your content into a simple list or any
number of groups.

```jsx
// keystatic.config.ts
import { config } from '@keystatic/core'

export default config({
  ...
    ui
:
{
  navigation: {
    'Content'
  :
    ['pages', 'posts'],
      'Settings'
  :
    ['site', 'seo'],
  }
,
}
,
})
```

Use the special `"---"` key to insert a separator between items.

```jsx
// keystatic.config.ts
import { config } from '@keystatic/core'

export default config({
  ...
    ui
:
{
  navigation: [
    'pages',
    'posts',
    '---',
    'site',
    'seo',
  ],
}
,
})
```

The "Dashboard" item will always be first in the navigation list.

---

## Screencast walk-through

These two segments of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how the user interface customization works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/A_20VrYEaUs?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/_Y7v9q8Blbs?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

---

## Type signature

Find the latest version of the `UserInterface` type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.UserInterface](https://docsmill.dev/npm/@keystatic/core@latest#/.UserInterface)

# Content components

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/content-components.mdoc
---
title: Content components
summary: >-
Content components are a new-generation of rich-text building blocks that can be used with the Markdoc and MDX fields.
---

Content components are a new-generation of rich-text building blocks that can be used with
the [Markdoc](/docs/fields/markdoc) and [MDX](/docs/fields/mdx) fields.

You can define content components by passing a `components` object to the Markdoc or MDX field:

```tsx
// Inside a collection/singleton...
schema: {
  // ...
  richText: fields.mdx({
    label: 'Rich text',
    components: {
      // Content components here
    }
  })
}
```

There are 5 types of content components, listed below.

Refer to the [Type signature](#type-signature) to learn how to create `ContentView` component previews, restrict
component usage with `forSpecificLocations`, and more.

---

## Wrapper

{% aside icon="☝️" %}
A `wrapper` component has an opening and closing tag, with `children` content wrapped inside.
{% /aside %}

The `children` content can be freeform rich text, or a combination of other content components.

### Example: Testimonial

```tsx
import { wrapper } from '@keystatic/core/content-components'

Testimonial: wrapper({
  label: 'Testimonial',
  schema: {
    author: fields.text({ label: 'Author' }),
    role: fields.text({ label: 'Role' }),
  }
})
```

The example above will add a 'Testimonial' dropdown to the rich text editor. The output for a Testimonial will look like
this (using the MDX field):

```mdx
<Testimonial author="Jina Dawkins" role="Head of Product Design">

  I've been very impressed with the work done by the team in such a short period of time. I'm really proud of everyone's effort and dedication!

</Testimonial>
```

### Example: Multi-variant Container

```tsx
import { wrapper } from '@keystatic/core/content-components'

Container: wrapper({
  label: 'Container',
  schema: {
    crop: fields.select({
      label: 'Crop',
      description: 'Max width container and options',
      options: [
        { label: 'normal', value: 'normal' },
        { label: 'narrow', value: 'narrow' },
        { label: 'narrower', value: 'narrower' },
        { label: 'bleed', value: 'bleed' },
        { label: 'boxed', value: 'boxed' },
        { label: 'narrow-boxed', value: 'narrow-boxed' },
      ],
      defaultValue: 'normal'
    }),
  }
})
```

This `Container` component can contain rich text as `children`, but also a `Testimonial` component or any other existing
content component:

```mdx
<Container crop="narrow">
  <Testimonial author="Jina Dawkins" role="Head of Product Design">

    I've been very impressed with the work done by the team in such a short period of time. I'm really proud of everyone's effort and dedication!

  </Testimonial>
</Container>
```

---

## Block

{% aside icon="☝️" %}
A `block` component has a self-closing tag, and therefore no `children`.
{% /aside %}

### Example

```tsx
import { block } from '@keystatic/core/content-components'

Playlist: block({
  label: 'Playlist',
  schema: {
    id: fields.text({ label: 'Playlist ID' }),
  }
})
```

The MDX output for an `PlayList` will look like this:

```mdx
<PlayList id="5f8a3b3e3f3e4d001f3e4d00" />
```

---

## Inline

An `inline` component is just like a `block` component, but it will sit inline within a paragraph or other text content.

### Example

```tsx
import { inline } from '@keystatic/core/content-components'

StatusBadge: inline({
  label: 'StatusBadge',
  schema: {
    status: fields.select({
      label: 'Status',
      options: [
        { label: 'To do', value: 'todo' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Ready for review', value: 'ready-for-review' },
        { label: 'Done', value: 'done' },
      ],
      defaultValue: 'todo'
    }),
  }
})
```

The MDX output for a `StatusBadge` will look like this:

```mdx
This task is currently <StatusBadge status="in-progress" /> but has no blocker on the rest of the team.
```

---

## Mark

{% aside icon="☝️" %}
The `mark` component lets you highlight text
{% /aside %}

You can select text in the rich text editor and apply a `mark` component to it, just like you would apply bold or italic
formatting.

### Example

```tsx
import { mark } from '@keystatic/core/content-components'

Highlight: mark({
  label: 'Highlight',
  schema: {
    variant: fields.select({
      label: 'Variant',
      options: [
        { label: 'Fluro', value: 'fluro' },
        { label: 'Minimal', value: 'minimal' },
        { label: 'Brutalist', value: 'brutalist' },
      ],
      defaultValue: 'fluro'
    }),
  }
})
```

The selected text will be wrapped in a `Highlight` component:

```mdx
This is a <Highlight variant="fluro">highlighted</Highlight> word.
```

---

## Repeating

{% aside icon="☝️" %}
The `repeating` component sets a "0 to many" list of explicitly defined components.
{% /aside %}

Use this to achieve the pattern of parent/child component composition, where children are responsible for their own
data/props:

```mdx
<Parent>
  <Child title="Repeating" data={} />
  <Child title="List" data={} />
  <Child title="Of" data={} />
  <Child title="Things" data={} />
</Parent>
```

The `repeating` components takes a `children` array, where you can define which components are allowed to be inserted.

### Example

```tsx
import { repeating } from '@keystatic/core/content-components'

TestimonialGrid: repeating({
  label: 'Testimonial Grid',

  // Only allow Testimonial components
  children: ['Testimonial'],
  schema: {
    columns: fields.integer({
      label: 'Columns',
      validation: {
        min: 1,
        max: 6
      }
    })
  }
}),
  Testimonial
:
wrapper({
  label: 'Testimonial',
  schema: {
    author: fields.text({ label: 'Author' }),
    role: fields.text({ label: 'Role' }),
  }
})
```

The MDX output for this `TestimonialGrid` will look like this:

```mdx
<TestimonialGrid columns={2}>
  <Testimonial author="Jina Dawkins" role="Head of Product Design">

    I've been very impressed with the work done by the team in such a short period of time. I'm really proud of everyone's effort and dedication!

  </Testimonial>
  <Testimonial author="Leesa Edwards" role="CMO">

    The team makes my job easy. I'm just here to amplify the amazing work everyone here is doing!

  </Testimonial>
</TestimonialGrid>
```

---

## Type signature

Find the latest version of the `content-components` type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/content-components](https://docsmill.dev/npm/@keystatic/core@latest#/content-components)

# Real-time previews with Next.js' draft mode

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/recipes/real-time-previews.mdoc
---
title: Real-time previews with Next.js' draft mode
summary: >-
This recipe shows you how to create immediate previews of your Keystatic
content with Next.js' draft mode feature.
---
One of the downsides of building static sites with content files is the delay occuring between saving changes and seeing
them on the website.

You typically need to open a PR and wait for deploy previews.

This recipe shows you how to create *immediate* previews of your Keystatic content with
Next.js' [draft mode](https://nextjs.org/docs/app/building-your-application/configuring/draft-mode) feature.

{% aside icon="🎬" %}
Scroll to the bottom of this page for a [video walk-through](#screencast-walk-through) of the feature!
{% /aside %}

---

{% aside icon="☝️" %}
This recipe assumes you've got an existing Next.js and Keystatic site, that:

1. uses the Next.js [App router](https://nextjs.org/docs/app)
1. uses the [Reader API](/docs/reader-api) to retrieve content
1. is connected to a GitHub repo, running in [github mode](/docs/github-mode) or [cloud mode](/docs/cloud)
   {% /aside %}

---

## Creating "start" and "end" preview routes

Create an `app/preview/start/route.tsx` file that will enable draft mode when accessed:

```tsx
import { redirect } from 'next/navigation';
import { draftMode, cookies } from 'next/headers';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const branch = params.get('branch');
  const to = params.get('to');
  if (!branch || !to) {
    return new Response('Missing branch or to params', { status: 400 });
  }
  draftMode().enable();
  cookies().set('ks-branch', branch);
  const toUrl = new URL(to, url.origin);
  toUrl.protocol = url.protocol;
  toUrl.host = url.host;
  redirect(toUrl.toString());
}
```

Next, create an `app/preview/end/route.tsx` file used to disable draft mode:

```tsx
import { cookies, draftMode } from 'next/headers';

export function POST(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin) {
    return new Response('Invalid origin', { status: 400 });
  }
  const referrer = req.headers.get('Referer');
  if (!referrer) {
    return new Response('Missing Referer', { status: 400 });
  }
  draftMode().disable();
  cookies().delete('ks-branch');
  return Response.redirect(referrer, 303);
}
```

## Adding a "stop draft mode" button in the front-end

Add the following to your main layout component to allow editors to opt out of draft mode:

```diff
+ import { cookies, draftMode } from 'next/headers';

export default async function RootLayout() {

+  const { isEnabled } = draftMode();

  return (
    <div>
      {children}

+      {isEnabled && (
+        <div>
+          Draft mode ({cookies().get('ks-branch')?.value}){' '}
+          <form method="POST" action="/preview/end">
+            <button>End preview</button>
+          </form>
+        </div>
+      )}

    </div>
  );
}

```

---

## Adding a Preview URL key to collections or singletons

The draft mode opt-in will happen from the Keystatic Admin UI.

In the Keystatic config, collections and singletons can have a `previewUrl` key. This will generate an Admin UI link to
the content preview, in draft mode:

```diff
collections: {
  posts: collection({
    label: 'Posts',
    slugField: 'title',
    path: `content/posts/*`,
+   previewUrl: `/preview/start?branch={branch}&to=/posts/{slug}`,
    schema: { //... }
  }),
},
```

This prefixes the front-end route for a post entry with the `/preview/start` route we created earlier.

---

## Updating the Keystatic Reader

The `reader` you're currently using from the Keystatic Reader API needs to be updated. If draft mode is turned on, it
should read from GitHub directly, using Keystatic's GitHub reader.

Since there is a little bit of setup involved, it makes sense to create reusable *draft-mode-aware* reader.

{% aside icon="☝️" %}
Make sure you replace the `repo: 'REPO_ORG/REPO_NAME'` line in the code snippet below with your own repo org and name!
{% /aside %}

{% aside icon="⚠️" %}
If you didn't setup a GitHub app (you are using [Keystatic cloud](/docs/cloud)), you'll also need to replace the `token`
line with a personal access token.

Live previews may still work without a valid `token`, as long as your GitHub repo is public and you haven't reached
GitHub's rate limit.
{% /aside %}

```ts
// src/utils/reader.ts
import { createReader } from '@keystatic/core/reader';
import { createGitHubReader } from '@keystatic/core/reader/github';
import keystaticConfig from '../../keystatic.config';

import { cache } from 'react';
import { cookies, draftMode } from 'next/headers';

export const reader = cache(() => {
  let isDraftModeEnabled = false;
  // draftMode throws in e.g. generateStaticParams
  try {
    isDraftModeEnabled = draftMode().isEnabled;
  } catch {
  }

  if (isDraftModeEnabled) {
    const branch = cookies().get('ks-branch')?.value;

    if (branch) {
      return createGitHubReader(keystaticConfig, {
        // Replace the below with your repo org an name
        repo: 'REPO_ORG/REPO_NAME',
        ref: branch,
        // Assuming an existing GitHub app
        token: cookies().get('keystatic-gh-access-token')?.value,
      });
    }
  }
  // If draft mode is off, use the regular reader
  return createReader(process.cwd(), keystaticConfig);
});
```

## Updating existing uses of the reader

The new `reader` is a function, so you'll need to update all your existing use cases to call the `reader()` function:

```diff
- const posts = await reader.collections.posts.all();
+ const posts = await reader().collections.posts.all();
```

---

## Testing the preview

In the Keystatic Admin UI, create a new post and save it in a new branch.

Next to the `Save` button, you will find a preview icon.

{% cloud-image
src="https://thinkmill-labs.keystatic.net/keystatic-site/images/q1xcdf0hg7ph/preview-button"
alt="Keystatic Admin UI's preview button"
height=368
width=680 /%}

Click on it and you should see the post you just created!

---

## Screencast walk-through

Here's a 2-minute video walk-through of the feature, as implemented on this website!

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/QuoADtLQVCE?si=WfaZm6GYs9zdsjbo\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

# Next.js: Disable Admin UI Routes in Production

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/recipes/nextjs-disable-admin-ui-in-production.mdoc

---
title: 'Next.js: Disable Admin UI Routes in Production'
summary: >-
This recipe shows you how to prevent access to `/keystatic`
routes in production when using the Next.js framework.
---
{% aside icon="🙏" %}
This is a community contribution from [Funabab](https://github.com/funabab).
{% /aside %}

When using the `local` strategy, you may want to only allow access to the `/keystatic` routes during development, but
with the default Next.js setup, these routes are still accessible in production.

Here's how you can prevent access to those routes in production when using the Next.js framework.

## Define condition for showing admin UI

If you've followed the [Next.js integration guide](/docs/installation-next-js), you should have a `keystatic.config.ts`
file in the root of your project. Now, in the `keystatic.config.ts` file, we'll define and export the condition for
accessing the admin UI.

```diff
// `keystatic.config.ts` file
import { config, collection, fields } from '@keystatic/core';

+ export const showAdminUI = process.env.NODE_ENV === "development"

export default config({
    storage: {
      kind: 'local',
    },
    collections: {
      posts: collection({
        label: 'Posts',
        slugField: 'title',
        path: 'posts/*',
        format: { contentField: 'content' },
        schema: {
          title: fields.slug({ name: { label: 'Title' } }),
          content: fields.markdoc({
            label: 'Content',
          }),
        },
      }),
    },
  });

```

In the snippet above, we've define the condition to access the admin UI to during development using the `NODE_ENV`
environment variable. This environment variable is likely to be set to "production" during a production deployment on
hosts like Vercel, Netlify etc. Kindly consult your host documentation to confirm it production deployment settings.

## Disable admin UI render

With the condition defined, we'll now disable the rendering of the admin UI from the `/app/keystatic/layout.ts` file.

```diff
// `app/keystatic/layout.tsx` file
import KeystaticApp from './keystatic'
+ import { showAdminUI } from '../../keystatic.config'
+ import { notFound } from 'next/navigation'

export default function RootLayout() {
+    if (showAdminUI === false) {
+       notFound()
+    }
    return <KeystaticApp />;
}

```

Now, deploy to production while ensuring `NODE_ENV` is set to any value except "development" (should be handled
automatically if you are deploying to vercel or netlify). You would see that accessing `/keystatic` page will return a
404 page.

## Disable admin API routes (optional)

Keystatic admin uses [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) to get
data for rendering. Since we've disabled the access to that, we could also disable it API routes.

```diff
// `api/keystatic/[...params]/route.ts` file
import { makeRouteHandler } from '@keystatic/next/route-handler';
- import keystaticConfig from '../../../../keystatic.config';
+ import keystaticConfig, { showAdminUI } from '../../../../keystatic.config';

- export const { POST, GET } = makeRouteHandler({
-    config: keystaticConfig,
- });

+ export const { POST, GET } = (() => {
+    const notFoundRouteHandler = () => {
+        return new Response(null, {
+            status: 404,
+        })
+    }
+    if (showAdminUI === false) {
+        return { GET: notFoundRouteHandler, POST: notFoundRouteHandler }
+    }
+    return makeRouteHandler({
+        config: keystaticConfig,
+    })
+ })()

```

# Configuration

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/configuration.mdoc

---
title: Configuration
summary: >-
The Keystatic's config file, where content structures and storage paths are
defined.
---
Every Keystatic project expects an exported `config`. The `config()` function can be imported from the `@keystatic/core`
package:

```typescript
// keystatic.config.ts
import { config } from '@keystatic/core'

export default config({
  // ...
})
```

## Example

Here's an example of a Keystatic `config` that creates a `posts` collection, stored on the local file system within the
`src/content/posts` directory.

Each post has a `title` as well as a long-form, WYSIWYG `content` field.

```typescript
// keystatic.config.ts
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        content: fields.markdoc({ label: 'Content' }),
      },
    }),
  },
});
```

---

## Options

### Branch prefix

`branchPrefix` — scope out what GitHub branches Keystatic should interact with (when using `github` or `cloud` storage
kind).

```ts
// keystatic.config.ts
import { config } from '@keystatic/core'

export default config({
  storage: {
    kind: 'github',
    repo: 'Thinkmill/keystatic',
    branchPrefix: 'my-prefix/'
  }
})
```

Keystatic will only list branches starting with my-prefix/ in the Admin UI, and will only let you create new branches
with that prefix.

### Cloud

`cloud` — used to configure the [Keystatic Cloud](/docs/cloud) project if `storage.kind` is set to `cloud`.

### Collections

`collections` — defines repeatable content structures, such as blog posts or testimonials.

Learn more in the [Collections](/docs/collections) page.

### Locale

`locale` — defines the [locale](https://docsmill.dev/npm/@keystatic/core@latest#/.CloudConfig.locales) for the project.

### Singletons

`singletons` — defines one-off content structures, such as a settings or a contact page.

Learn more in the [Singletons](/docs/singletons) page.

### Storage

`storage` — a required property defining Keystatic's `storage` strategy.

It's `kind` can be set to:

- [local](/docs/local-mode) to store and read files directly from your local file system
- [github](/docs/github-mode) to connect to a GitHub repository and read/write files to it
- [cloud](/docs/cloud) to benefit from [Keystatic Cloud](https://keystatic.cloud)'s authentication and image hosting
  features

```typescript
// keystatic.config.ts
import { config } from '@keystatic/core'

export default config({
  storage: { kind: 'local' }
})
```

### User Interface

`ui` — allows customization of parts of the Keystatic Admin UI.

Learn more on the [User Interface](/docs/user-interface) page.

---

## Type signature

Find the latest version of the `config` type signature at:&nbsp;[*
*https://docsmill.dev/npm/@keystatic/core@latest#/.config**](https://docsmill.dev/npm/@keystatic/core@latest#/.config)

# Collections

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/collections.mdoc

---
title: Collections
summary: >-
Think of a collection as anything you'd want multiple instances of. A series
of blog posts, cooking recipes, or testimonials from happy customers.
---
Think of a `collection` as anything you'd want multiple instances of. A series of blog posts, cooking recipes, or
testimonials from happy customers.

Collections are defined within the `collections` key of the Keystatic `config`. Each collection has its own key and is
wrapped in a `collection()` function.

## Example

Here's how you'd define a `testimonial` collection, where each entry has an `author` and a `quote` fields:

```jsx
// keystatic.config.ts
import { config, collection } from '@keystatic/core';

export default config({
  // ...
  collections: {
    testimonials: collection({
      label: 'Testimonials',
      slugField: 'author',
      schema: {
        author: fields.slug({ name: { label: 'Author' } }),
        quote: fields.text({ label: 'Quote', multiline: true })
      }
    }),
  },
});
```

---

## Options

### Columns

`columns` — show additional fields in the collection list view.

By default, only the `slug` of each entry is displayed in the collection list.

You can show additional fields by passing a `columns` option, which is an array of field keys:

```ts
columns: ['title', 'publishedOn']
```

### Label

`label` — defines the name of the collection. This is used in the Admin UI to label the collection.

### Entry layout

`entryLayout` — change the layout of the Admin UI for a collection entry.

Learn more on the [Entry Layout](/docs/entry-layout) page.

### Format

`format` — provides options around the data format of your collection entries.

Learn more on the [Format Options](/docs/format-options) page.

### Path

`path` — allows you to you specify *where* to store entries for any given collection:

```tsx
path: 'custom/content/path/testimonials/*'
```

By default, Keystatic will store entries at the root of your project, in a directory that matches the collection key.

You can learn more about the `path` option on the [Content organisation page](/docs/content-organisation).

### Parse slug for sort

`parseSlugForSort` — a function to transform the `slug` of each entry into a value to be used for sorting the collection
list view.

### Preview URL

`previewURL` — used to configure [Real-time Previews](/docs/recipes/real-time-previews) of your content.

### Schema

`schema` — defines the fields that each entry in the collection should have.

### Slug field

`slugField` — defines what field in your collection `schema` should be used as the slug for each item.

It's recommended to combine it with the [slug field](/docs/fields/slug) to let users customise and regenerate each slug
in the Admin UI.

```typescript
testimonials: collection({
  label: 'Testimonials',
  schema: {
    title: fields.slug({ name: { label: 'Title' } }),
  },
  slugField: 'title',
}),
```

### Template

`template` — the path to a content file (existing collection entry or "template") to use as a starting point for new
entries.

---

## Type signature

Find the latest version of the `Collection` type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.Collection](https://docsmill.dev/npm/@keystatic/core@latest#/.Collection)

# Singletons

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/singletons.mdoc

---
title: Singletons
summary: >-
When you want a “one-of-a-kind” data entry, such as a “Settings” page or maybe
a very specific set of fields for the “Homepage” of a website, you will want to
use a singleton.
---
When you want a “one-of-a-kind” data entry, such as a “Settings” page or maybe a very specific set of fields for the
“Homepage” of a website, you will want to use a `singleton`.

## Example

Here's how you'd define a `settings` singleton:

```jsx
// keystatic.config.ts
import { config, singleton } from '@keystatic/core';

export default config({
  // ...
  singletons: {
    settings: singleton({
      label: 'Settings',
      schema: {}
    }),
  },
});
```

---

## Options

### Entry layout

`entryLayout` — change the layout of the Admin UI for the singleton data entry.

Learn more on the [Entry Layout](/docs/entry-layout) page.

### Format

`format` — provides options around the data format of your singleton.

Learn more on the [Format Options](/docs/format-options) page.

### Label

`label` — defines the name of the singleton. This is used in the Admin UI.

### Path

`path` — allows you to you specify *where* to store the singleton data:

```tsx
path: 'custom/content/path/settings'
```

Learn more about the `path` option on the [Content Organisation](/docs/content-organisation) page.

### Preview URL

`previewURL` — used to configure [Real-time Previews](/docs/recipes/real-time-previews) of your content.

### Schema

`schema` — defines the fields that the singleton should have.

---

## Type signature

Find the latest version of the `Singleton` type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.Singleton](https://docsmill.dev/npm/@keystatic/core@latest#/.Singleton)

# Fields API

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/array.mdoc
---
title: Array field
summary: >-
The array field is used to create "Add one more" scenarios where you need one
or multiple instances of a specific field schema.
---
The `array` field is used to create "Add one more" scenarios where you need *one or multiple* instances of a specific
field schema.

You can only pass a single field to the `array` field — but this field can be an [object field](/docs/fields/object) to
create complex structures.

The `label` for the `array` field can optionally be defined in the second parameter, as an options object. It's also
useful to define the `itemLabel` for each instance of the array, to give it a more meaningful label than the default
`Item 1`, `Item 2` etc.

## Example usage

### Simple

```typescript
tags: fields.array(
  fields.text({ label: 'Tag' }),
  // Labelling options
  {
    label: 'Tag',
    itemLabel: props => props.value
  }
)
```

### Complex

```typescript
complexArray: fields.array(
  fields.object({
    name: fields.text({ label: 'Name' }),
    age: fields.integer({ label: 'Age' }),
    projects: fields.array(
      fields.relationship({
        label: 'Projects',
        collection: 'projects',
        validation: {
          isRequired: true,
        },
      }),
      {
        label: 'Projects',
        itemLabel: (props) => props.value ?? 'Select a project',
      }
    ),
  }),
  // Labelling options
  {
    label: 'Complex Array',
    itemLabel: (props) => props.fields.name.value,
  }
),
```

## Slug field

The array field's `slugField` option is useful to replace indexes normally in file paths for images or documents etc.

It works similarly to the slugField option in [Collections](/docs/collections-and-singletons#collections) (including
uniqueness validation), but with the difference that the slug is still written to the YAML/JSON.

For example, to change the slug from `/authors/0/bio.mdoc` to `/authors/name/bio.mdoc` you can do the following:

```typescript
authors: fields.array(
  fields.object({
    name: fields.text({ label: 'Name' }),
    bio: fields.markdoc({
      label: 'Bio',
    }),
  }),
  {
    label: 'Authors',
    slugField: 'name',
    itemLabel: props => props.fields.name.value,
  }
),
```

---

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how the array field works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/HZw98CiX8FE?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

---

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.array](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.array)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/blocks.mdoc
---
title: Blocks field
summary: >-
The blocks field is used to create "Add one more" scenarios where you need a
separate field schema for each instance.
---
The `blocks` field is similar to the [array field](/docs/fields/array) in that you can create "Add one more" scenarios,
but with the difference that it lets you define a separate field schema for each instance.

## Usage example

```typescript
links: fields.blocks(
  {
    // First block option is a link to a Page
    page: {
      label: 'Page',
      schema: fields.relationship({
        label: 'Page',
        collection: 'pages',
      }),
    },
    // Second block option is a link to a URL
    url: {
      label: 'URL',
      schema: fields.text({ label: 'URL' }),
    },
  },
  { label: 'Links' }
),
```

---

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how the blocks field works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/Tc-GLY9l9PM?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

---

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.blocks](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.blocks)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/checkbox.mdoc
---
title: Checkbox field
summary: The checkbox field is used to store a boolean.
---
The `checkbox` field is used to store a `boolean`. In the Admin UI, it renders a single checkbox.

## Example usage

```typescript
draft: fields.checkbox({
  label: 'Draft',
  description: 'Set this post as draft to prevent it from being published'
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.checkbox](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.checkbox)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/child.mdoc
---
title: Child field
summary: >-
The child field allows you to embed an editable region inside of a component
block preview.
---
The `child` field allows you to embed an editable region inside of a component block preview.

See the [document field](/docs/fields/document) for more information about component blocks.

## Usage example

```typescript
document: fields.document({
  label: 'Document',
  formatting: true,
  links: true,
  componentBlocks: {
    quote: component({
      preview: () => null,
      label: 'Quote',
      schema: {
        // Make the quote editable
        content: fields.child({
          kind: 'block',
          placeholder: 'Quote...',
          formatting: { inlineMarks: 'inherit', softBreaks: 'inherit' },
          links: 'inherit',
        }),
        // Make the attribution editable
        attribution: fields.child({ kind: 'inline', placeholder: 'Attribution...' }),
      },
    }),
  },
}),
```

You can nest component blocks within each other by setting `componentBlocks: 'inherit'` on the child field:

```ts
document: fields.document({
  label: 'Document',
  formatting: true,
  componentBlocks: {
    sectionContainer: component({
      // A preview is needed to show the child field
      preview: ({ fields }) => (
        <div style = {
{
  padding: '1rem 0' /* styling is up to you */
}
}>
{
  fields.children.element
}
</div>
),
label: 'Section Container',
  schema
:
{
  content: fields.child({
    kind: 'block',
    componentBlocks: 'inherit'
    placeholder: 'Add component blocks here...',
  }),
}
,
}),
},
}),
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.child](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.child)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/cloud-image.mdoc
---
title: Cloud Image field
summary: The cloud image field is used to work with Keystatic Cloud Images.
---
The `cloudImage` field is used to work in conjunction with [Keystatic Cloud](/docs/cloud)'
s [Image Library](/docs/cloud#cloud-images).

Instead of storing the image itself, the field stores a reference to the image in the cloud.

{% cloud-image
src="https://thinkmill-labs.keystatic.net/keystatic-site/images/lut0do0vglkz/cleanshot-2023-11-21-at-17-08-40-2x"
alt="Screenshot of the Cloud Image field modal UI"
height=952
width=1420 /%}

## Returned value

The returned value for this field is an object with the following properties:

- **`src`**: the URL of the image
- **`alt`**: the default alt text as set in the Image Library
- **`height`**: the height of the image
- **`width`**: the width of the image

## Example usage

```typescript
avatar: fields.cloudImage({
  label: 'Avatar',
  description: 'The avatar for this user',
  validation: {
    isRequired: true
  }
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.cloudImage](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.cloudImage)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/conditional.mdoc
---
title: Conditional field
summary: >-
The conditional field is used when you need to display entirely different
fields based on a condition.
---
The `conditional` field is used when you need to display entirely different fields based on a condition.

In the first argument, define the condition by using either a `checkbox` or a `select` field.

In the second argument, define which field(s) to display for each condition by passing an object with each conditions'
value as a key:

- `true`/`false`&nbsp;if you used a&nbsp;`checkbox` field, or
- each possible value if you used a&nbsp;`select` field.

## Usage examples

### Checkbox

Let's say you want to optionally display SEO title/description fields, but only if a user checks a checkbox.

```typescript
seo: fields.conditional(
  // First, we define a checkbox to drive the yes/no condition
  fields.checkbox({ label: 'Define custom SEO tags', defaultValue: false }),
  // Then, we provide a set of fields for both the `true` and `false` scenarios
  {
    true: fields.object({
      title: fields.text({ label: 'Title' }),
      description: fields.text({ label: 'Description' }),
    }),
    // Empty fields are useful to show... no fields!
    false: fields.empty(),
  }
)
```

### Select

Here's a more complex example where you have an optional&nbsp;`Featured media`&nbsp;field for an entry.

The options for it are&nbsp;`none`,&nbsp;`image`&nbsp;and&nbsp;`video`.

```typescript
// Featured media
featuredMedia: fields.conditional(
  // First, define a `select` field with all the available "conditions"
  fields.select({
    label: 'Featured media',
    description: 'Optional image/video options for an optional hero media.',
    options: [
      { label: 'No media', value: 'none' },
      { label: 'Image', value: 'image' },
      { label: 'Video', value: 'video' },
    ],
    defaultValue: 'none',
  }),
  // Then, provide a schema for each condition
  {
    // "none" condition
    none: fields.empty(),
    // "image" condition
    image: fields.object({
      asset: fields.image({
        label: 'Image',
        directory: 'public/images/events',
        publicPath: '/images/events/',
        validation: { isRequired: true },
      }),
      alt: fields.text({ label: 'Alt', description: 'Image alt text.' }),
    }),
    // "video" condition
    video: fields.object({
      url: fields.text({
        label: 'A YouTube video URL.',
        validation: { length: { min: 1 } },
      }),
      image: fields.object({
        asset: fields.image({
          label: 'Image',
          description: 'Thumbnail image override for the video.',
          directory: 'public/images/events',
          publicPath: '/images/events/',
        }),
        alt: fields.text({ label: 'Alt', description: 'Image alt text.' }),
      }),
    }),
  }
),
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.conditional](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.conditional)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/date.mdoc
---
title: Date field
summary: The date field stores an ISO 8601 formatted date string.
---
{% field-demo field="date" /%}

The date field stores an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) formatted date string i.e. `YYYY-MM-DD`.

## Usage example

```typescript
date: fields.date({
  label: 'Event date',
  description: 'The date of the event'
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.date](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.date)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/datetime.mdoc
---
title: Datetime field
summary: The datetime field stores a Datetime string.
---
{% field-demo field="datetime" /%}

The `datetime` field stores a Datetime string, collected from an `<input type="datetime-local" />` form field.

## Usage example

```typescript
datetime: fields.datetime({
  label: 'Event date and time',
  description: 'The date and time of the event'
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.datetime](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.datetime)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/document.mdoc
---
title: Document field
summary: The document field is a highly customisable rich text editor.
---
{% aside icon="⚠️" %}
[`fields.markdoc`](/docs/fields/markdoc) has superseded this field. [`fields.mdx`](/docs/fields/mdx) is also available
if you prefer MDX.
{% /aside %}

The `document` field is a highly customisable rich text editor.

It lets content creators quickly and easily edit content in your system.

## Usage example

```ts
document: fields.document({
  label: 'Document',
  formatting: true,
  links: true,
  images: true
})
```

---

## Formatting options

The WYSIWYG toolbar can be customised to allow a range of formatting options. This is done via the `formatting` option
on the `document` field.

Setting `formatting: true` will enable all the formatting options that are available in Markdown syntax, but you can
also specify only a specific subset of options you want to allow.

The editor features built-in support for some additional common formatting features that require custom Markdoc tags to
render, including alignment, underline, subscript and superscript. These aren't included with the shorthand
`formatting: true` option, but can be enabled by passing an object with the relevant options set to `true`.

The formatting options enabled when using the shorthand are:

```ts
{
  formatting: {
    inlineMarks: {
      bold: true,
        italic
    :
      true,
        strikethrough
    :
      true,
        code
    :
      true,
    }
  ,
    listTypes: {
      ordered: true,
        unordered
    :
      true,
    }
  ,
    headingLevels: [1, 2, 3, 4, 5, 6],
      blockTypes
  :
    {
      blockquote: true,
        code
    :
      true,
    }
  ,
    softBreaks: true,
  }
,
}
```

The additional formatting options (not on by default) are:

```ts
{
  formatting: {
    // this is the same as providing `alignment: true`
    alignment: {
      center: true,
        end
    :
      true,
    }
  .
    inlineMarks: {
      keyboard: true,
        subscript
    :
      true,
        superscript
    :
      true,
        underline
    :
      true,
    }
  ,
  }
,
}
```

### Formatting options type signature

The type signature for the full list of available formatting options is available
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.document.DocumentFeaturesConfig](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.document.DocumentFeaturesConfig)

---

## Component blocks

The `document` field can register custom component blocks, which you can use to render custom UI components with props
within your document field.

Each component block has its own fields schema, and can be configured with a custom preview component.

```ts
document: fields.document({
  label: 'Document',
  formatting: true,
  componentBlocks: {
    quote: component({
      preview: () => null,
      label: 'Quote',
      schema: {
        content: fields.child({
          kind: 'block',
          placeholder: 'Quote...',
          formatting: { inlineMarks: 'inherit', softBreaks: 'inherit' },
          links: 'inherit',
        }),
        attribution: fields.child({ kind: 'inline', placeholder: 'Attribution...' }),
      },
    }),
  },
}),
```

You can nest component blocks within each other by using the [Child field](/docs/fields/child) with the
`componentBlocks` property set to `'inherit'`:

```ts
document: fields.document({
  label: 'Document',
  formatting: true,
  componentBlocks: {
    sectionContainer: component({
      // A preview is needed to show the child field
      preview: ({ fields }) => (
        <div style = {
{
  padding: '1rem 0' /* styling is up to you */
}
}>
{
  fields.children.element
}
</div>
),
label: 'Section Container',
  schema
:
{
  content: fields.child({
    kind: 'block',
    componentBlocks: 'inherit',
    placeholder: 'Add component blocks here...',
  }),
}
,
}),
},
}),
```

---

## Other configuration options

The `document` field has many more configuration options like `images`, `layouts`, `tables`, `links` or `dividers`.

Here is a more comprehensive example:

```ts
content: fields.document({
  label: 'Content',
  links: true,
  layouts: [[1], [1, 1]],
  images: {
    directory: 'src/content/blog/_images',
    publicPath: '/src/content/blog/_images/',
    schema: {
      title: fields.text({
        label: 'Caption',
        description:
          'The text to display under the image in a caption.',
      }),
    },
  },
  dividers: true,
  formatting: {
    alignment: true,
    blockTypes: true,
    headingLevels: true,
    inlineMarks: {
      code: true,
      bold: true,
      italic: true,
      underline: true,
      strikethrough: true,
    },
    listTypes: true,
  },
  tables: true,
}),
```

---

## Type signature

For the full reference, you can find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.document](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.document)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/empty-content.mdoc
---
title: Empty Content field
summary: >-
The empty content field is used to force a formats for entries without a
standard content field.
---
The `emptyContent` is a mechanism to trigger a collection or singleton to output `.mdoc`/`.mdx`/`.md` files even if
there is no real `markdoc` or `mdx` field in the schema.

Use this in conjunction with the [`format.contentField`](/docs/format-options#example-with-single-file-output) option.

## Usage example

```typescript
schema: {
  emptyContent: fields.emptyContent({ extension: 'mdoc' })
}
,
format: {
  contentField: 'emptyContent'
}
```

Instead of generating `.yaml` or `.json` files, the collection or singleton will output `.mdoc`/`.mdx`/`.md` files with
frontmatter data and an empty content body.

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/empty-document.mdoc
---
title: Empty Document field
summary: The empty document field is used to force Markdoc formats for entries without a real document field.
---
The `emptyDocument` is a mechanism to trigger a collection or singleton to output `.mdoc` files even if there is no real
`document` field in the schema.

Use this in conjunction with the [`format.contentField`](/docs/format-options#example-with-single-file-output) option.

## Usage example

```typescript
schema: {
  // Other fields (but no `document`)...
  fakeDocument: fields.emptyDocument()
}
,
format: {
  contentField: 'fakeDocument'
}
```

Instead of generating `.yaml` or `.json` files, the collection or singleton will output `.mdoc` files with frontmatter
data and an empty content body.

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/empty.mdoc
---
title: Empty field
summary: The empty field is used to not show any fields at all.
---
The `empty` field is useful in conjunction with the [conditional field](/docs/fields/conditional), in scenarios where
you want one *condition* to not show *any* fields at all.

## Usage example

```typescript
seo: fields.conditional(
  // See fields.conditional docs for details on the conditional field
  fields.checkbox({
    label: 'Define custom SEO tags',
    defaultValue: false,
  }),
  {
    // If condition is false, show… no fields!
    false: fields.empty(),

    // Otherwise, show some fields
    true: fields.object({
      title: fields.text({ label: 'Title' }),
      description: fields.text({ label: 'Description' }),
    }),
  }
),
```

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/file.mdoc
---
title: File field
summary: The file field is used to store a file.
---
{% field-demo field="file" /%}

The `file` field is used to store a file. In the Admin UI it renders a file picker component.

In [local storage mode](/docs/local-mode), the file will be saved in your repository.
In [github storage mode](/docs/github-mode), the file will be committed into the repository.

## Storage options

You can optionally specify a `directory` from your project tree to store the file in. This is useful when you want your
files in a `public` or `static` directory, to adhere to conventions for a specific framework.

There's also an optional `publicPath` that lets you define how the file path should be retrieved when reading the value
of the field.

## Example usage

```typescript
resume: fields.file({
  label: 'Resume',
  description: 'Summary of qualifications for this job applicant',
  // This will output the files in the "public" directory
  directory: 'public/files/resumes',
  publicPath: '/files/resumes/'
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.file](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.file)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/ignored.mdoc
---
title: Ignored field
summary: >-
The ignored field is used to preserve a field written in content without showing or editing it in the UI.
---
The `ignored` field is used to preserve a field written in content without showing or editing it in the UI.

## Usage example

```typescript
someField: fields.ignored()
```

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/image.mdoc
---
title: Image field
summary: The image field is used to store an image.
---

The `image` field is used to store an image. In the Admin UI it renders an image picker component:

{% field-demo field="image" /%}

Images will be stored on your local file system or GitHub repository.

For a cloud-based alternative, see the [Cloud image field](/docs/fields/cloud-image) designed
for [Keystatic Cloud](/docs/cloud).

---

## Image storage options

The default behaviour of the image field is to create a directory matching the entry `slug`, and place an image named
after the `image` field inside.

Take the following configuration:

```typescript
authors: collection({
  schema: {
    // ...
    avatar: fields.image({ label: 'Avatar' })
  }
})
```

Creating a `john-doe` author and uploading a `jpg` image for the `avatar` will generate the following:

```sh
authors
├── john-doe
    └── avatar.jpg
└── john-doe.yaml
```

The value stored in the `john-doe.yaml` file for the `avatar` will be:

```yaml
avatar: avatar.jpg
```

This is workable, but quite often you'll want to configure:

- _where_ the image is stored
- _how_ the reference path to the image is constructed

### Directory

You can specify a `directory` from your project tree.

Say you want to output images in the `public` directory:

```diff
avatar: fields.image({
  label: 'Avatar',
+ directory: 'public/images/avatars',
})
```

Uploading a `jpg` image on the `john-doe` entry would now output the following:

```sh
authors
└── john-doe.yaml
public
└── images
    └── avatars
        └── john-doe
            └── avatar.jpg
```

{% aside icon="☝️" %}
The value stored in the `john-doe` file will still be:

`avatar: avatar.jpg`

...so chances are you'll also want to configure the `publicPath` option.

{% /aside %}

### Public path

The `publicPath` option lets you control how the path to the image (as you'd use in the front end) is constructed:

```diff
avatar: fields.image({
  label: 'Avatar',
  directory: 'public/images/avatars',
+ publicPath: '/images/avatars/'
})
```

The entry slug and image field name will be composed with this `publicPath`.

Here's how the `avatar` field would now be stored with our `john-doe` example:

```yaml
avatar: /images/avatars/john-doe/avatar.jpg
```

---

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how the image field works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/yg4cJiecOhA?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

---

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.image](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.image)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/integer.mdoc
---
title: Integer field
summary: The integer field is used to store an integer.
---
{% field-demo field="integer" /%}

The `integer` field is used to store a number.

You can optionally specify a range with `validation.min` and `validation.max`.

## Usage example

```typescript
age: fields.integer({
  label: 'Age',
  description: "The person's age",
  validation: {
    min: 0,
    max: 120
  }
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.integer](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.integer)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/markdoc.mdoc
---
title: Markdoc field
summary: WYSIWYG editor for Markdoc
---

The `markdoc` is an evolution of the `document` field using a new editor. It looks and feels similar to the `document`
field, but has extended capabilities.

## Example usage

```tsx
// Keystatic config
import { fields } from '@keystatic/core'

// Inside a collection...
schema: {
  richText: fields.markdoc({
    label: 'Rich text'
  })
}
```

Keystatic will store content and retrieve it for you using the [Reader API](/docs/reader-api), but you are responsible
for rendering the Markdoc content.

You can use community tools or build your own.

---

## Use .md files instead of .mdoc

The `extension` lets you use `.md` files instead of `.mdoc` for Markdoc collections or singletons:

```diff
content: fields.markdoc({
  label: 'Content',
+  extension: 'md',
  // ...
})
```

---

## Content components

The `markdoc` field uses the new-generation and more capable [content components](/docs/content-components):

```diff
richText: fields.markdoc({
 label: 'Rich text',
+ components: {
+  // Add custom components here
+ }
})
```

Checkout the [content components](/docs/content-components) docs to learn how to create advanced editing experiences
with the `markdoc` field.

---

## Inline

By default, `fields.markdoc` will output content in a seperate file to the main data or below the main data if using
`format.contentField`. If you want to have multiple pieces of content in the same file, you can use
`fields.markdoc.inline(...)`:

```tsx
someContent: fields.markdoc.inline({
  label: 'Some content',
})
```

this will write content next to other fields like this instead of in a different file:

```yaml
someContent: |
  # Title

  Some content
```

---

## Formatting options

The editor can be customised to allow a range of formatting options. This is done via `options`.

See the type signature for `MarkdocEditorOptions` for the full set of options:
[https://docsmill.dev/npm/@keystatic/core@latest#/.fields.markdoc.MarkdocEditorOptions](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.markdoc.MarkdocEditorOptions)

---

## Image options

The directory where images are stored can be customised in the same way as [`fields.image`](/docs/fields/image) with
`directory` and `publicPath`. Though unlike [`fields.image`](/docs/fields/image) outside the editor where image
filenames are determined by the key in the schema where the field is, filenames for images in the editor can be
customised directly in the editor.

See the type signature for `MarkdocEditorOptions.image` for the full set of options:
[https://docsmill.dev/npm/@keystatic/core@latest#/.fields.markdoc.MarkdocEditorOptions](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.markdoc.MarkdocEditorOptions)

---

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core#/.fields.markdoc](https://docsmill.dev/npm/@keystatic/core#/.fields.markdoc)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/mdx.mdoc
---
title: MDX field
summary: WYSIWYG editor for MDX
---

The `mdx` field reads and writes content in MDX.

## Example usage

```tsx
// Keystatic config
import { fields } from '@keystatic/core'

// Inside a collection...
schema: {
  richText: fields.mdx({
    label: 'Rich text'
  })
}
```

Keystatic will store content and retrieve it for you using the [Reader API](/docs/reader-api), but you are responsible
for rendering the MDX content.

You can use community tools or build your own.

---

## Use .md files instead of .mdx

The `extension` lets you you to use `.md` files instead of `.mdx` for MDX collections or singletons:

```diff
content: fields.mdx({
  label: 'Content',
+  extension: 'md',
  // ...
})
```

---

## Content components

The `mdx` field uses the new-generation and more capable [content components](/docs/content-components):

```diff
richText: fields.mdx({
 label: 'Rich text',
+ components: {
+  // Add custom components here
+ }
})
```

Checkout the [content components](/docs/content-components) docs to learn how to create advanced editing experiences
with the `mdx` field.

---

## MDX limitations in Keystatic

### No import statements

Keystatic statically analyzses the MDX content. This means you cannot have `import` statements inside the MDX file.

This won't work:

```mdx
---
title: My first post
date: 2024-02-17
---

import { Card } from '../components/Card'

# Hello, world!

<Card title="This week's update" />
```

Remove the import from the MDX file. Instead, pass the components you want to import to the component responsible for
rendering the MDX content:

```tsx
import { Card } from '../components/Card'

<
MdxRenderer
components = {
{
  Card
}
}
/>
```

### No HTML tags

HTML tags in MDX are not supported by Keystatic. Replace them with their Markdown equivalent.

For example...

```diff
- Learn more on the <a href="https://keystatic.com">Keystatic website</a>.
+ Learn more on the [Keystatic website](https://keystatic.com).
```

...or

```diff
- <blockquote>Wow, this is pretty cool!</blockquote>
+ > Wow, this is pretty cool!
```

---

## Inline

By default, `fields.mdx` will output content in a seperate file to the main data or below the main data if using
`format.contentField`. If you want to have multiple pieces of content in the same file, you can use
`fields.mdx.inline(...)` instead:

```tsx
someContent: fields.mdx.inline({
  label: 'Some content',
})
```

this will write content next to other fields like this instead of in a different file:

```yaml
someContent: |
  # Title

  Some content
```

---

## Formatting options

The editor can be customised to allow a range of formatting options. This is done via `options`.

See the type signature for `MDXEditorOptions` for the full set of options:
[https://docsmill.dev/npm/@keystatic/core@latest#/.fields.mdx.MDXEditorOptions](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.mdx.MDXEditorOptions)

---

## Image options

The directory where images are stored can be customised in the same way as [`fields.image`](/docs/fields/image) with
`directory` and `publicPath`. Though unlike [`fields.image`](/docs/fields/image) outside the editor where image
filenames are determined by the key in the schema where the field is, filenames for images in the editor can be
customised directly in the editor.

See the type signature for `MDXEditorOptions.image` for the full set of options:
[https://docsmill.dev/npm/@keystatic/core@latest#/.fields.mdx.MDXEditorOptions](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.mdx.MDXEditorOptions)

---

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core#/.fields.mdx](https://docsmill.dev/npm/@keystatic/core#/.fields.mdx)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/multiselect.mdoc
---
title: Multiselect field
summary: The multiselect field allows you to select zero, one or multiple options.
---
{% field-demo field="multiselect" /%}

The `multiselect` field is similar to the [select field](/docs/fields/select) but allows you to select zero, one or
multiple options.

In the Admin UI, it renders a checkbox for each option.

You can optionally define `defaultValue` as an array of values matching the `option` values.

## Usage example

```typescript
multi: fields.multiselect({
  label: 'Interests',
  options: [
    { label: 'Surfing', value: 'surfing' },
    { label: 'Basketball', value: 'basketball' },
    { label: 'Music', value: 'music' },
    { label: 'Chess', value: 'chess' },
  ],
  defaultValue: ['surfing', 'basketball', 'music'],
}),
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.multiselect](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.multiselect)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/number.mdoc
---
title: Number field
summary: The number field is used to store a number.
---
{% field-demo field="number" /%}

The `number` field is used to store a number.

---

## Options

The `steps` property can be used to specify the step size of the number. The `hideStepper` property can be used to hide
the stepper buttons.

---

## Validation options

You can optionally specify a range with `validation.min` and `validation.max`.

To validate the step size, set `validation.validateStep` to `true`. This will validate that the value is a multiple of
the step size.

## Usage example

```typescript
cost: fields.number({
  label: 'Cost',
  description: "The cost of the item, in steps of 0.02",
  step: 0.02,
  hideStepper: false,
  validation: {
    min: 0,
    max: 150.5,
    validateStep: true
  }
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.number](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.number)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/object.mdoc
---
title: Object field
summary: >-
The object field is used to create complex object schemas that can contain any
other fields.
---
The `object` field is used to create complex object schemas that can contain any other fields.

It's particularly useful when you need a set of fields for each option in
an [array field](/docs/fields/array), [conditional field](/docs/fields/conditional)
or [blocks field](/docs/fields/blocks).

## Usage examples

### Simple

```typescript
snapshot: fields.object({
  name: fields.text({ label: 'Name' }),
  age: fields.integer({ label: 'Age' }),
})
```

### Complex

```typescript
snapshot: fields.object({
  name: fields.text({ label: 'Name' }),
  age: fields.integer({ label: 'Age' }),

  // Nested relationship array
  projects: fields.array(
    fields.relationship({
      label: 'Projects',
      collection: 'projects',
      validation: {
        isRequired: true,
      },
    }),
    {
      label: 'Projects',
      itemLabel: (props) => props.value ?? 'Please select a project',
    }
  ),
})
```

## Patterns

### Field goups

You can group fields together by providing a second "options" argument to `fields.object()`, which accepts a `label` and
`description`. This is similar to a `<fieldset>` in HTML.

```typescript
address: fields.object({
    street: fields.text({ label: 'Street' }),
    city: fields.text({ label: 'City' }),
    state: fields.text({ label: 'State' }),
    postcode: fields.text({ label: 'Postcode' }),
    country: fields.text({ label: 'Country' }),
  },
  {
    label: 'Address',
    description: 'The address of the user',
  })
```

### Layout

The options argument also accepts a `layout` property, which can be used to define the number of columns each field
should span. The grid layout supports 12 possible columns.

```typescript
address: fields.object({
    street: fields.text({ label: 'Street' }),
    city: fields.text({ label: 'City' }),
    state: fields.text({ label: 'State' }),
    postcode: fields.text({ label: 'Postcode' }),
    country: fields.text({ label: 'Country' }),
  },
  {
    label: 'Address',
    description: 'The address of the user',
    layout: [12, 6, 3, 3, 12],
  })
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.object](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.object)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/path-reference.mdoc
---
title: Path Reference field
summary: >-
The pathReference field is used to reference an existing file in the file
system.
---
The `pathReference` field is used to reference an existing file in the file system. It renders a combobox in the Admin
UI.

You can define a glob pattern option to restrict which files can be selected, as shown in the example below.

## Usage example

```typescript
videoFile: fields.pathReference({
  label: 'Video file',
  description: 'A reference to a video file in the `public` folder',
  pattern: 'public/**/*',
}),
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.pathReference](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.pathReference)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/relationship.mdoc
---
title: Relationship field
summary: >-
The relationship field is a reference to the slug of a specific collection
entry.
---
The `relationship` field is a reference to the `slug` of a specific collection entry. It renders a combobox in the Admin
UI.

To create a one-to-many relationship, wrap the `relationship` field inside an [array field](/docs/fields/array).

{% aside icon="⚠️" %}
The collection string must match one of the keys used in the collections config object.
{% /aside %}

{% aside icon="☝️" %}
Heads up: the `relationship` field will only store a static `string` representing the `slug` of the selected collection
entry.

If the slug of the entry in question changes, the stored value **will not be updated**. In other words, the relationship
will be broken.
{% /aside %}

## Usage examples

Example of `has-one` relationship:

```typescript
country: fields.relationship({
  label: 'Country',
  description: 'The country this person lives in',
  collection: 'countries'
})
```

Example of `has-many` relationship:

```typescript
authors: fields.array(
  fields.relationship({
    label: 'Authors',
    description: 'A list of authors for this post',
    collection: 'posts'
  }), {
    label: 'Authors',
    itemLabel: props => props.value
  }
)
```

---

## Screencast walk-through

This segment of
the [Keystatic Mini-Course on YouTube](https://www.youtube.com/playlist?list=PLHrxuCR-0CcSmkyLcmdV7Ruql8DTm644k) may
help understand how the relationship field works:

{% embed
mediaType="video"
embedCode="<iframe src=\"https://www.youtube.com/embed/H3zdAOaXTFI?si=mDDK52Nlhg4v1v9x\" title=\"YouTube video player\"
frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
web-share\" allowfullscreen></iframe>" /%}

---

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.relationship](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.relationship)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/select.mdoc
---
title: Select field
summary: The select field is used for single option selection.
---
{% field-demo field="select" /%}

The `select` field displays a select input for single option selection.

It needs an array of options, as well as a `defaultValue` matching one of the options.

## Example usage

```typescript
role: fields.select({
  label: 'Role',
  description: "The person's role at the company",
  options: [
    { label: 'Designer', value: 'designer' },
    { label: 'Developer', value: 'developer' },
    { label: 'Product manager', value: 'product-manager' },
  ],
  defaultValue: 'designer'
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.select](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.select)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/slug.mdoc
---
title: Slug field
summary: >-
The slug field auto-generates a URL-friendly string alongside another text
string.
---
{% field-demo field="slug" /%}

The `slug` field auto-generates a URL-friendly string alongside another text string.

Typically used in scenarios where you'd want a `text` field to define the slug of an entry — think of a post `title` or
an author `name`. You set that field to a `slug` field instead. It will store the `text` string you need, while also
generating a `slug` for you.

You will be presented with two input fields in the Admin UI. You can manually override that `slug` value, and have
control over the labels for both fields.

## Usage example

```typescript
title: fields.slug({
  name: {
    label: 'Title',
    description: 'The title of the post',
  },
  // Optional slug label overrides
  slug: {
    label: 'SEO-friendly slug',
    description: 'This will define the file/folder name for this entry'
  }
})
```

{% aside icon="📢" %}
The following components have a `slugField` option:

- [Collection](/docs/collections-and-singletons#slug-field) (use in conjunction with the `slug` field)
- [Array field](/docs/fields/array#slug-field)
  {% /aside %}

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.slug](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.slug)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/text.mdoc
---
title: Text field
summary: The text field is used to store a text string.
---
{% field-demo field="text" /%}

The `text` field is used to store a text string. It renders a single line `<input type="text">` in the Admin UI by
default.

For longer strings, add the `multiline: true` option which renders a `<textarea>` instead.

## Usage example

```typescript
quote: fields.text({
  label: 'Quote',
  multiline: true
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.text](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.text)

https://github.com/Thinkmill/keystatic/blob/main/docs/src/content/pages/fields/url.mdoc
---
title: URL field
summary: The url field stores a string that is a sanitised URL.
---
{% field-demo field="url" /%}

The `url` field stores a string that is a sanitised URL. It uses `@braintree/sanitize-url` under the hood.

## Usage example

```typescript
url: fields.url({
  label: 'URL',
  description: 'The website URL'
})
```

## Type signature

Find the latest version of this field's type signature
at: [https://docsmill.dev/npm/@keystatic/core@latest#/.fields.url](https://docsmill.dev/npm/@keystatic/core@latest#/.fields.url)


