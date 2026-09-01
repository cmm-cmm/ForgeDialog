# Changelog

## 0.7.0

- Added per-component appearance controls: `surfaceColor`, `titleColor`, `titleOpacity`,
  `contentColor`, `contentOpacity`, and `borderOpacity`, so color and transparency can be set on the
  title, body, and border instead of only on the dialog surface and backdrop.
- Added composable shadows: `appearance.shadow` now also accepts `angle`, which chooses the
  direction the shadow falls, alongside `distance`, `blur`, `spread`, `color`, `opacity`, and
  `inset`. Presets and raw CSS `box-shadow` values keep working unchanged.
- Added `appearance.hover`, applied only while the pointer is over the dialog and only for dialogs
  that opt in, accepting the same color and shadow options plus `lift`, `scale`, and `duration`.
- Hover transforms honour `prefers-reduced-motion` and are suspended while a dialog is being
  dragged, so a hover lift or scale can no longer push a dragged dialog outside its bounds.
- Added a `forgedialog/appearance` entry point. The richer appearance options are an opt-in
  capability, like dragging and animations: the main `forgedialog` entry enables them automatically,
  while `forgedialog/core` and the single-purpose entries keep a lightweight applier covering
  surface opacity, backdrop, border, and shadow presets, so the alert-only bundle stays under its
  budget.
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
