# Changelog

## 0.8.0

### Breaking

- The React and Vue adapters are no longer part of this package. `forgedialog/react` and
  `forgedialog/vue` are gone; install [`forgedialog-react`](https://www.npmjs.com/package/forgedialog-react)
  or [`forgedialog-vue`](https://www.npmjs.com/package/forgedialog-vue) instead. The hook itself is
  unchanged, so the migration is the import:

  ```diff
  - import { useForgeDialog } from 'forgedialog/react';
  + import { useForgeDialog } from 'forgedialog-react';
  ```

  ```sh
  npm install forgedialog-react   # or forgedialog-vue
  ```

- `forgedialog` no longer declares `react` or `vue` as peer dependencies. They were optional, but
  they still put two frameworks in the dependency tree of a library that advertises having none,
  and every tool that reads peer dependencies had to be told to ignore them.

`forgedialog/svelte` and `forgedialog/web-component` are unchanged and stay in the core: neither
needs a framework runtime, so neither costs a peer dependency.

### Other

- The published tarball is smaller: 63 files and 117.6 KiB, down from 71 files and 120.3 KiB,
  because the React and Vue builds are no longer in it.
- `npm run check:release` now checks every package a release publishes, including that each
  wrapper's dependency range on the core is one this release satisfies.
- `homepage` now points at the documentation site rather than the README anchor, so the npm page
  links to the reference instead of back to GitHub.

## 0.7.0

- Added per-component appearance controls: `surfaceColor`, `titleColor`, `titleBackground`,
  `titleOpacity`, `contentColor`, `contentOpacity`, and `borderOpacity`, so color and transparency
  can be set on the title, body, and border instead of only on the dialog surface and backdrop.
- Added `appearance.radius` for corner rounding, which was previously fixed to the global
  `--fd-radius` token. It takes one value for every corner, any CSS `border-radius` value, or a
  per-corner object whose omitted corners keep the theme radius. Drawers and bottom sheets keep
  their shapes unless a radius is given explicitly.
- Added composable shadows: `appearance.shadow` now also accepts `angle`, which chooses the
  direction the shadow falls, alongside `distance`, `blur`, `spread`, `color`, `opacity`, and
  `inset`. Presets and raw CSS `box-shadow` values keep working unchanged.
- Added `appearance.hover`, applied only while the pointer is over the dialog and only for dialogs
  that opt in, accepting the same color and shadow options plus `lift`, `scale`, and `duration`.
- Hover transforms honour `prefers-reduced-motion` and are suspended while a dialog is being
  dragged, so a hover lift or scale can no longer push a dragged dialog outside its bounds.
- Added a `forgedialog/appearance` entry point. Both `forgedialog` and `forgedialog/core` ship the
  full appearance applier, so the richer options need no extra import; the single-purpose entries
  (`forgedialog/alert`, `/confirm`, `/prompt`) keep a lightweight applier covering surface opacity,
  backdrop, border, and shadow presets, and can be upgraded by importing `forgedialog/appearance`.
- Fixed capability imports being dropped by bundlers. Entries are published unsplit, because ESM
  code splitting moved the `registerAppearanceApplier` call into a shared chunk that `sideEffects`
  cannot name, so a bundler discarded the bare import and `import 'forgedialog/appearance'` was
  silently a no-op. `forgedialog/interactions` and `forgedialog/animations` happened to escape this
  only through how their code was chunked.
- Added `npm run test:capabilities`, which bundles the published entries and asserts each capability
  actually registers while `forgedialog/alert` stays on the lightweight applier.
- Widened the gzip and tarball budgets. Several artifacts sat within 0.1 KiB of their limits, so
  ordinary changes tripped them; the budgets now carry real headroom and cover both the full
  appearance applier in the core entry and the unsplit output.
- Expanded the demo's appearance builder with per-component color, shadow direction, and hover
  controls, and refreshed the visual regression baseline for the taller page.

## 0.6.0

- Fixed focus trapping skipping over targets that cannot receive focus: hidden inputs and anything
  inside a `[hidden]`, `[inert]`, or `aria-hidden="true"` subtree. A dialog whose form started with a
  hidden field, such as a CSRF token, previously left focus on `<body>` so the trap never engaged.
- Added `summary`, `iframe`, `audio[controls]`, `video[controls]`, and `contenteditable` elements to
  focus detection.
- Fixed `update({ className })` throwing `SyntaxError` when the class string was padded, empty, or
  contained repeated whitespace.
- Fixed `toast()` dismissing immediately for a duration of `0` or `Infinity`; both now keep the toast
  until it is dismissed explicitly.
- Fixed the toast auto-dismiss timer leaking when a toast was dismissed through its action button.
- Added a `notifications` label so the toast region name can be localized with `setLabels()`.
- Fixed `resetForTests()` on the dialog stack leaving the body scroll locked.
- Pinned generated API reports to LF endings and normalized line endings repository-wide so the
  checked-in snapshots stop churning on Windows checkouts.
- Updated development dependencies to clear all reported advisories.

## 0.5.0

- Added scoped surface/backdrop opacity, backdrop blur, border, and shadow appearance controls.
- Expanded draggable dialogs with axis and bounds constraints, custom handles, keyboard movement,
  position persistence, lifecycle callbacks, and programmatic position APIs.
- Added an interactive appearance/drag builder and browser coverage for viewport constraints.
- Split form and workflow styling into focused CSS modules while retaining one public stylesheet.
- Added interaction and layered CSS entry points, CSS-backed shadow presets, tree-shaking fixtures,
  per-artifact gzip budgets, bundle analysis, and automated package export/type validation.
- Added lightweight alert/confirm/prompt entries and capability-based advanced interactions,
  reducing the alert-only fixture below 6 KiB gzip.
- Added animation-frame drag batching, resize-aware bounds, mobile visual viewport constraints,
  component CSS layers, API reports, consumer builds, Changesets, bundle diffs, SBOM generation,
  and npm provenance release automation.
- Split animation runners into an opt-in capability so focused entries avoid unused presets while
  the main entry retains the complete behavior.
- Added sanitizer-gated HTML rendering, reactive Web Component attributes, adapter cleanup tests,
  cross-browser/mobile coverage, forced-colors styling, and p50/p95 runtime cleanup budgets.
- Moved release automation to Node 24 actions, separated Changesets from tag publishing, and
  removed duplicate CI and release work.

## 0.4.0

- Rebuilt modal rendering on native `<dialog>` with a fallback path.
- Added typed results, close reasons, cancellable lifecycle hooks, `AbortSignal`, portals, and
  explicit destruction.
- Added drawers, bottom sheets, lightboxes, loading dialogs, toast history, notification center,
  command palette, theme presets, spring animation, and RTL-aware styles.
- Added persisted, branching, asynchronous typed wizards.
- Added tree-shakable core/presentation/workflow entry points and React, Vue, Svelte, and Web
  Component adapters.
- Added bundle budgets, Axe checks, browser performance tests, and visual regression coverage.
