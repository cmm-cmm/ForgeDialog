# Contributing to ForgeDialog

Thanks for helping out. ForgeDialog is a dependency-free TypeScript dialog library, so most
contributions touch `src/`, its tests, and the checks that keep the published package honest.

## Getting set up

Node 20 or newer is required (see `engines` in `package.json`).

```sh
npm install
npm run dev     # rebuild with tsup while editing
npm test        # vitest in jsdom
npm run demo    # build and serve demo/index.html for manual checks
```

## Where things live

| Path             | What it holds                                                      |
| ---------------- | ------------------------------------------------------------------ |
| `src/api/`       | High-level helpers: `alert`, `confirm`, `prompt`, `form`, and more |
| `src/core/`      | Dialog lifecycle, focus trap, appearance, dragging, stacking       |
| `src/theme/`     | CSS, split into the sheets exposed under `forgedialog/style/*`     |
| `src/*-entry.ts` | Published entry points, including opt-in capabilities              |
| `tests/`         | Vitest suites, mirroring the `src/` layout                         |
| `e2e/`           | Playwright suites that need a real browser                         |
| `scripts/`       | The packaging and budget checks that run in `validate`             |

## Before you open a pull request

```sh
npm run validate
```

That is the same gate CI runs: typecheck, lint, coverage, gzip budgets, tree-shaking, `publint` and
`attw`, API reports, consumer builds, capability registration, a CSP scan, and the tarball size.
Run `npm run validate:all` to add the browser suite, which needs `npx playwright install` first.

Individual pieces are also available on their own — `npm run typecheck`, `npm run lint`,
`npm run format`, `npm run test:coverage`.

## Things that trip people up

**Public API changes need refreshed reports.** `npm run api:check` compares `dist/` against the
committed snapshots in `etc/`. When you intentionally change the public surface, regenerate them:

```sh
npm run api:update
npm run api:subpaths:update
```

**User-facing changes need a changeset.** Run `npm run changeset` and describe the change the way a
consumer would read it. Version bumps come from `npm run version-packages`, not by hand.

**Capabilities register through side-effectful imports.** `forgedialog/appearance`,
`/interactions`, and `/animations` work by running a `register*` call on import. A bundler only
keeps such an import when the file it resolves to is listed in `sideEffects` in `package.json`, and
a shared chunk emitted by code splitting cannot be named there. That is why entries are published
unsplit. `npm run test:capabilities` bundles the published entries and fails if a registration gets
dropped — if you touch `tsup.config.ts`, `sideEffects`, or an entry file, expect it to have an
opinion.

**Bundle budgets are enforced.** `scripts/check-size.mjs` and `scripts/check-treeshaking.mjs` cap
the gzipped output, including an alert-only fixture that must stay small. If a change genuinely
needs more room, raise the budget in the same pull request and say why.

**The visual baseline lives in the repo.** `e2e/quality.spec.ts` compares against
`e2e/quality.spec.ts-snapshots/`. When a demo-page change legitimately shifts the screenshot,
refresh it with `npx playwright test --update-snapshots` and mention it in the pull request, so a
reviewer can tell a fixture change from a rendering regression.

## Style

Prettier and ESLint own formatting and lint rules; run `npm run format` rather than hand-aligning.
Two-space indentation, single quotes, semicolons, trailing commas, 100-character lines. `PascalCase`
for classes and exported types, `camelCase` for functions and variables, `fd-`-prefixed CSS class
names. Prefix intentionally unused parameters with `_`.

Keep comments for things the code cannot say itself — a constraint, a workaround, the reason behind
a non-obvious choice.

## Tests

Vitest runs in jsdom and discovers `tests/**/*.test.ts`. Cover observable behavior: keyboard and
focus handling, ARIA state, cleanup, and promise results. Every behavior change should come with a
regression test.

jsdom has no layout or cascade, so anything that depends on computed styles — radii, shadows,
hover, drag bounds — belongs in `e2e/` instead, where a real browser can measure it.

## Commits and pull requests

Commit summaries are short and imperative, describing the user-visible outcome
(`Fix focus trapping, className updates, and toast lifetimes`). Explain the why in the body when it
is not obvious from the diff.

Pull requests should say what changed, how you verified it, and call out API or accessibility
impact explicitly. Screenshots or a short recording help for visual, animation, or demo changes.

## Reporting problems

Bugs and feature ideas go to [issues](https://github.com/cmm-cmm/ForgeDialog/issues). Security
vulnerabilities do not — see [SECURITY.md](SECURITY.md).
