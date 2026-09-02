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
| `site/404.html`   | Served for any unmatched path. Carries `noindex`.                     |
| `site/styles.css` | Site styling. Its dark mode reads the same `data-fd-theme` attribute  |
|                   | that the library's `setTheme()` sets, so both switch together.        |
| `site/common.js`  | Shared chrome: version badge, theme toggle, copy buttons.             |
| `site/site.js`    | Landing-page demos and the appearance playground.                     |
| `site/docs.js`    | Highlights the sidebar entry for the section being read.              |
| `site/icon.svg`   | The mark, and the favicon browsers actually load.                     |
| `wrangler.jsonc`  | Cloudflare deployment config. Points at `site/`, not `dist/`.         |
| `site/_headers`   | Cloudflare response headers, including a strict CSP.                  |

### URLs

The docs page is served at **`/docs`**, not `/docs.html`. Both Cloudflare's static-asset routing
(`html_handling: "auto-trailing-slash"`, the default) and the `serve` used by `npm run site` drop
the `.html` and redirect the extension form, so the extensionless URL is the one that answers with
a `200`. Every link, canonical tag, sitemap entry, and `llms.txt` link uses it — a canonical or a
sitemap entry that redirects is a conflicting signal to a search engine.

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

- **`sitemap.xml`** — both pages, each with the date its HTML file was last committed, read from
  `git log`. A build that cannot reach git history (a shallow clone, a tarball export) writes the
  entry with no `lastmod` rather than stamping today's date on a page that did not change: a
  sitemap that is wrong about `lastmod` is one a crawler learns to ignore.
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

## Deploying to Cloudflare

The site ships as a [Workers static-assets](https://developers.cloudflare.com/workers/static-assets/)
project: no Worker script, every request answered straight from `site/`. `wrangler.jsonc` at the
repository root is the whole configuration, so a deploy is just:

```sh
npm run site:build
npx wrangler deploy
```

Note that the assets directory is **`site/`, not `dist/`**. `dist/` is the compiled library —
`.mjs`, `.cjs`, `.d.ts`, and `.css` with no `index.html` in it — so deploying that directory
uploads ninety-odd files and still serves nothing at `/`.

### Workers Builds

To deploy on push, connect the repository under **Workers & Pages → Create → Workers → Import a
repository** and set:

| Setting        | Value                 |
| -------------- | --------------------- |
| Build command  | `npm run site:build`  |
| Deploy command | `npx wrangler deploy` |
| Node version   | `20` or newer         |

Cloudflare runs `npm ci` before the build command, so no install step is needed. Set the Node
version through a `NODE_VERSION` environment variable if the default is older than 20, which the
package's `engines` field requires.

Leave the deploy command without an `--assets` flag: the flag overrides `wrangler.jsonc`, which is
how a project ends up shipping the wrong directory. The build runs the library's own `npm run
build` first, so a broken build fails the deploy rather than shipping a stale `site/vendor/`.

### Custom domain

Attach the domain under the Worker's **Settings → Domains & Routes**. It has to match the canonical
tags in `index.html` and `docs.html`, or search engines will be told the page lives somewhere it
does not.

The `*.workers.dev` URL stays enabled as a way to check a deploy. It serves the same pages, but
every page carries an absolute canonical pointing at the custom domain, so search engines
consolidate the two rather than treating them as duplicates. Set `"workers_dev": false` in
`wrangler.jsonc` if you would rather it not answer at all.

### Unmatched paths

`not_found_handling: "404-page"` in `wrangler.jsonc` makes Workers serve `site/404.html` with a
`404` status for anything that does not match a file, instead of the platform's bare response. That
page links its stylesheets and scripts with root-relative paths (`/styles.css`, not `./styles.css`)
because it answers for nested addresses too, where a relative path would resolve against the
missing directory. It carries `noindex` and no canonical tag, since it has no URL of its own.

### Response headers

`site/_headers` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a strict
`Content-Security-Policy` limited to same-origin scripts and styles. The library contains no `eval`
or `new Function` — `npm run test:csp` enforces that — so it runs cleanly under that policy. The
inline JSON-LD is a data block rather than an executable script, so `script-src 'self'` does not
block it.

If you add a third-party script, an analytics snippet, or a web font, the CSP has to be widened to
match or the browser will silently block it.
