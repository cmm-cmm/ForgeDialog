# Website

The marketing site lives in `site/`. It is hand-written HTML, CSS, and browser JavaScript with no
dependencies and no framework, matching the library it advertises.

## Running it locally

```sh
npm run site
```

That builds the library, copies `dist/index.global.js` and `dist/index.css` into `site/vendor/`, and
serves `site/`. Use `npm run site:build` on its own if you only need the files.

`site/vendor/` is generated and git-ignored: the page runs the code from this checkout rather than a
CDN, so what you see is always the build you have.

## How it is put together

| File              | Role                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `site/index.html` | The page. No templating, no placeholders to substitute.              |
| `site/styles.css` | Site styling. Its dark mode reads the same `data-fd-theme` attribute |
|                   | that the library's `setTheme()` sets, so both switch together.       |
| `site/site.js`    | Demos, the appearance playground, copy buttons, theme toggle.        |
| `site/_headers`   | Cloudflare Pages response headers, including a strict CSP.           |

The version badge is read from the library's own `VERSION` export at runtime, so nothing has to be
kept in sync by hand and no build step rewrites source files.

The playground calls `instance.update()` on every control change, which is why the dialog restyles
while it is open rather than needing to be reopened.

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

### Response headers

`site/_headers` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and a strict
`Content-Security-Policy` limited to same-origin scripts and styles. The library contains no `eval`
or `new Function` — `npm run test:csp` enforces that — so it runs cleanly under that policy.

If you add a third-party script, an analytics snippet, or a web font, the CSP has to be widened to
match or the browser will silently block it.
