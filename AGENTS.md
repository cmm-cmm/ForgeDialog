# Repository Guidelines

## Project Structure & Module Organization

ForgeDialog is a framework-agnostic TypeScript dialog library. Public exports begin in `src/index.ts`. High-level helpers live in `src/api/`, dialog behavior and accessibility primitives in `src/core/`, plugin support in `src/plugins/`, localization defaults in `src/i18n/`, and CSS plus theme helpers in `src/theme/`. Shared public types are in `src/types.ts`, while small internal helpers belong in `src/utils/`.

Tests mirror these areas under `tests/` and use the `*.test.ts` suffix. Global test setup is in `tests/setup.ts`. `demo/index.html` is the manual browser demo. Generated output goes to `dist/`; do not edit or commit generated files unless a release workflow explicitly requires it.

## Build, Test, and Development Commands

- `npm install`: install the locked development dependencies.
- `npm run dev`: rebuild continuously with tsup while editing.
- `npm run build`: produce ESM, CJS, browser, declaration, and CSS artifacts in `dist/`.
- `npm test`: run the complete Vitest suite once in jsdom.
- `npm run test:watch`: rerun affected tests during development.
- `npm run typecheck`: validate strict TypeScript without emitting files.
- `npm run lint`: lint `src/` and `tests/` with ESLint.
- `npm run format`: format the repository with Prettier.
- `npm run demo`: build and serve the example page locally.

## Coding Style & Naming Conventions

Use TypeScript with two-space indentation, single quotes, semicolons, trailing commas, and a 100-character line width, as configured in `.prettierrc.json`. Keep the code compatible with ES2019 and strict compiler settings. Use `PascalCase` for classes and exported type-like symbols (`DialogStack`), `camelCase` for functions and variables (`setTheme`), and descriptive lowercase CSS class names consistent with the existing theme files. Avoid unused values; prefix intentionally unused parameters with `_`.

## Testing Guidelines

Vitest runs in jsdom and discovers `tests/**/*.test.ts`. Place focused tests beside the corresponding test area, for example `tests/core/Dialog.test.ts` or `tests/api/confirm.test.ts`. Cover observable behavior, keyboard and focus handling, ARIA state, cleanup, and promise results. There is no fixed coverage threshold; every behavior change should include a regression test. Run `npm test`, `npm run typecheck`, and `npm run lint` before submitting.

## Commit & Pull Request Guidelines

Existing commits use concise, imperative summaries such as `Add ForgeDialog core: ...`. Keep each commit scoped and explain the user-visible outcome. Pull requests should include a clear description, relevant issue links, verification commands, and tests. Add screenshots or a short recording for visual, animation, or demo changes, and call out API or accessibility impacts explicitly.
