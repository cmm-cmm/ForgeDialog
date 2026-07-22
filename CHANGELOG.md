# Changelog

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
