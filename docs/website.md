# Website

The marketing site lives in `site/`. It is hand-written HTML, CSS, and browser JavaScript with no
dependencies and no framework, matching the library it advertises.

## Running it locally

```sh
npm run site
```

That builds the library, copies `dist/index.global.js` and `dist/index.css` into `site/vendor/`,
writes `robots.txt`, `sitemap.xml`, and `llms.txt`, and serves `site/`. Use `npm run site:build` on
its own if you only need the files.

`site/vendor/` is generated and git-ignored: the page runs the code from this checkout rather than a
CDN, so what you see is always the build you have.

## How it is put together

| File              | Role                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `site/index.html` | The landing page: demos, appearance playground, facts table, and FAQ. |
| `site/docs.html`  | The API reference, written against the reviewed report in `etc/`.     |
| `site/styles.css` | Site styling. Its dark mode reads the same `data-fd-theme` attribute  |
|                   | that the library's `setTheme()` sets, so both switch together.        |
| `site/common.js`  | Shared chrome: version badge, theme toggle, copy buttons.             |
| `site/site.js`    | Landing-page demos and the appearance playground.                     |
| `site/docs.js`    | Highlights the sidebar entry for the section being read.              |
| `site/icon.svg`   | The mark, and the favicon browsers actually load.                     |
| `site/_headers`   | Cloudflare Pages response headers, including a strict CSP.            |

The version badge is read from the library's own `VERSION` export at runtime, so nothing has to be
kept in sync by hand and no build step rewrites source files.

The playground calls `instance.update()` on every control change, which is why the dialog restyles
while it is open rather than needing to be reopened.

### Naming

The product is **Forge Dialog**, two words, and that is how every page, heading, and document
refers to it. The npm package (`forgedialog`), the browser global (`ForgeDialog`), the custom
element (`forge-dialog`), and the repository name stay as they are: they are identifiers, not
prose.

## Icons

`site/icon.svg` is the source of truth and is what browsers load as the favicon. Two bitmaps are
committed beside it because SVG is not enough everywhere:

| File                        | Size     | Used by                        |
| --------------------------- | -------- | ------------------------------ |
| `site/apple-touch-icon.png` | 180×180  | iOS home screens               |
| `site/og-image.png`         | 1200×630 | Link previews and social cards |

Both are rendered from `icon.svg` through Chromium, which is already a dev dependency:

```sh
npm run site:icons
```

Run it only when the icon changes; neither the site build nor a deploy runs it. The apple-touch
variant squares off the mark's ground (via `#ground { rx: 0 }`) because iOS applies its own rounded
mask and would otherwise round it twice.

## SEO and answer engines

The canonical origin is declared once, in the `<link rel="canonical">` tag of `site/index.html`.
`scripts/build-site.mjs` reads it back to generate every other absolute URL, so **moving the site
to another domain means editing the canonical tags in `index.html` and `docs.html` and nothing
else** — the sitemap, `robots.txt`, and `llms.txt` follow automatically.

Generated on each build, and git-ignored:

- **`sitemap.xml`** — both pages with a `lastmod` date.
- **`robots.txt`** — allows everything, names the sitemap, and explicitly allows the answer-engine
  crawlers (ClaudeBot, GPTBot, PerplexityBot, Google-Extended, and friends). It deliberately does
  **not** disallow `/vendor/`: blocking a site's own CSS and JavaScript is what breaks rendering
  for search crawlers.
- **`llms.txt`** — the [llmstxt.org](https://llmstxt.org) convention. A short, factual summary a
  language model can quote: version, licence, install command, size, browser support, and links to
  both pages. The version comes from `package.json`, so it cannot drift.

Both pages carry JSON-LD structured data. The landing page describes itself as a `WebSite`, a
`SoftwareApplication`, and an `FAQPage`; the reference page as a `TechArticle` with a
`BreadcrumbList`. The FAQ entries are generated from the visible questions and answers, so the
markup and the page cannot disagree.

The FAQ and the "At a glance" table exist for the same reason: they state the facts about Forge
Dialog in self-contained sentences, which is what both search snippets and answer engines quote.

## Deploying to Cloudflare Pages

Connect the repository in the Cloudflare dashboard (**Workers & Pages → Create → Pages → Connect to
Git**) and use:

| Setting                | Value                |
| ---------------------- | -------------------- |
| Framework preset       | None                 |
| Build command          | `npm run site:build` |
| Build output directory | `site`               |
| Node version           | `20` or newer        |

Cloudflare runs `npm ci` before the build command, so no install step is needed. Set the Node
version through a `NODE_VERSION` environment variable if the default is older than 20, which the
package's `engines` field requires.

The build runs the library's own `npm run build` first, so a broken build fails the deploy rather
than shipping a stale `site/vendor/`.

Point the custom domain at the project in **Pages → Custom domains**. It has to match the canonical
tags, or search engines will be told the page lives somewhere it does not.

### Response headers

`site/_headers` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a strict
`Content-Security-Policy` limited to same-origin scripts and styles. The library contains no `eval`
or `new Function` — `npm run test:csp` enforces that — so it runs cleanly under that policy. The
inline JSON-LD is a data block rather than an executable script, so `script-src 'self'` does not
block it.

If you add a third-party script, an analytics snippet, or a web font, the CSP has to be widened to
match or the browser will silently block it.
