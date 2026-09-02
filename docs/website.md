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
| `site/demo.html`  | Live demos: every surface running, each beside its code.              |
| `site/docs.html`  | The API reference, written against the reviewed report in `etc/`.     |
| `site/404.html`   | Served for any unmatched path. Carries `noindex`.                     |
| `site/styles.css` | Site styling. Its dark mode reads the same `data-fd-theme` attribute  |
|                   | that the library's `setTheme()` sets, so both switch together.        |
| `site/common.js`  | Shared chrome: version badge, theme toggle, copy buttons.             |
| `site/site.js`    | Landing-page demos and the appearance playground.                     |
| `site/docs.js`    | Highlights the sidebar entry for the section being read.              |
| `site/demo.js`    | Runs the demos. One delegated listener, no inline handlers.           |
| `site/icon.svg`   | The mark: the favicon, and the logo in every page header.             |
| `wrangler.jsonc`  | Cloudflare deployment config. Points at `site/`, not `dist/`.         |
| `site/_headers`   | Cloudflare response headers, including a strict CSP.                  |

### URLs

The demo and docs pages are served at **`/demo`** and **`/docs`**, not `/demo.html` and
`/docs.html`, and their Vietnamese counterparts at `/vi/demo` and `/vi/docs`. Both Cloudflare's static-asset routing
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

## The demo page

`site/demo.html` runs every surface the library ships — the four dialog entry points, `open()`,
stacking, animations, drawers, bottom sheets, toasts, the lightbox, loading states, the command
palette, the notification centre, `form()`, `wizard()`, and `formWizard()` — against the same
vendored build the rest of the site uses.

Each card pairs a control that really runs with the snippet of the call being made, so the page
cannot drift from what it documents: if a snippet were wrong, the button beside it would misbehave.
A plugin registered on the page logs `afterOpen` and `afterClose`, and every demo prints its return
value, so the result log doubles as evidence that the hooks fire.

`demo.js` uses one delegated listener on `document` keyed by `data-demo`, because the site's CSP is
`script-src 'self'` and inline `onclick` attributes would be blocked. A demo that throws prints the
failure into the log rather than only the console.

This is separate from `demo/index.html` at the repository root, which is the manual verification
page the visual regression test drives. That one loads `../dist/` directly and is not deployed.

## Icons

`site/icon.svg` is the source of truth. It is what browsers load as the favicon and what every page
header shows beside the wordmark — with `alt=""`, since the adjacent text already names the product
and a screen reader should not announce it twice. Two bitmaps are committed beside it because SVG
is not enough everywhere:

| File                        | Size     | Used by                                        |
| --------------------------- | -------- | ---------------------------------------------- |
| `site/favicon.ico`          | 32×32    | Clients that request `/favicon.ico` regardless |
| `site/apple-touch-icon.png` | 180×180  | iOS home screens                               |
| `site/og-image.png`         | 1200×630 | Link previews and social cards                 |

Both are rendered from `icon.svg` through Chromium, which is already a dev dependency:

```sh
npm run site:icons
```

Run it only when the icon changes; neither the site build nor a deploy runs it. The apple-touch
variant squares off the mark's ground (via `#ground { rx: 0 }`) because iOS applies its own rounded
mask and would otherwise round it twice. The `.ico` is a 32×32 PNG wrapped in an ICO container,
which every browser since Vista accepts and which needs no bitmap encoder — the whole file is about
1.2 KB.

## Vietnamese

All three pages are published in Vietnamese under `/vi/`, as translations of the English pages
rather than different content. `site/vi/index.html`, `site/vi/demo.html`, and `site/vi/docs.html`
mirror their English counterparts section for section, keeping the same element ids so
`site.js`, `demo.js`, and `docs.js` drive both languages without a second copy.

### How the strings work

Those three scripts are shared, so nothing user-visible is hard-coded in them. Each page carries a
JSON data block, and the script reads it with English as the fallback:

```html
<script type="application/json" id="fd-strings">
  { "alertTitle": "Lưu ý", "labels": { "cancel": "Huỷ", "submit": "Gửi" } }
</script>
```

A data block is not an executable script, so `script-src 'self'` allows it — an inline `<script>`
of real code would be blocked. The id is prefixed because `i18n` alone is already a section id on
the docs page, and `getElementById` would find that section instead.

`labels` is passed to the library's own `setLabels()` by `common.js`, so the buttons inside the
dialogs are in the same language as the page around them. The theme toggle and copy buttons read
their four strings from `data-` attributes for the same reason.

The code shown beside each demo is translated too: the snippet has to be the call that is actually
made, or the page stops documenting itself.

### hreflang

Each page declares `en`, `vi`, and `x-default`, and the sitemap repeats the same set as
`xhtml:link` alternates on every entry. `x-default` points at the English page, since this is a
static site with no language negotiation.

Both sides have to name each other. `npm run site:check` fails the build on a one-way annotation,
on a missing `x-default`, and on a page whose hreflang set leaves out its own canonical — those
are the three ways this goes wrong, and none of them is visible in a browser.

Assets on a `/vi/` page are linked root-relative (`/styles.css`, not `./styles.css`), because the
page sits a directory down and a relative path would resolve inside `/vi/`.

## Checking the site

`npm run site:build` ends with `node scripts/check-site.mjs`, so a broken site fails the Cloudflare
deploy rather than reaching the domain. Run it alone with `npm run site:check`.

It fails the build on:

- a link or asset that resolves to nothing, following the same rules the server does (a directory
  means its `index.html`, an extensionless path means the `.html` file of that name);
- a `#fragment` naming an id that does not exist on the page it lands on;
- a one-way, incomplete, or self-omitting hreflang set;
- a link written in the `.html` form, which the server answers with a redirect;
- JSON-LD that does not parse, and an `FAQPage` whose questions have drifted from the visible ones;
- a page with no canonical, title, description, or `og:image`, a `404.html` that declares a
  canonical or forgets `noindex`, and any disagreement between pages about the canonical origin.

Every one of those is a failure this site shipped or nearly shipped. They are checked rather than
eyeballed because a page can look right in a browser and still be wrong in all of them.

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
