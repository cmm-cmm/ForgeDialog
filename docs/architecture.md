# ForgeDialog Architecture

ForgeDialog is split into a dependency-free runtime and optional presentation, workflow, and
framework entry points. `src/core/Dialog.ts` owns the state machine and native `<dialog>` lifecycle;
`DialogStack` coordinates Escape handling and scroll locking. DOM construction remains isolated in
`domBuilder` so render behavior can evolve independently from orchestration.

Per-instance appearance is translated into scoped CSS custom properties by `core/appearance.ts`.
`core/draggable.ts` owns pointer and keyboard movement, viewport/container constraints, and optional
position persistence. `Dialog` talks to an interaction capability registry: core supplies a small
pointer implementation, while `interactions` registers resize-aware, persisted, keyboard-capable
dragging. The main entry enables that capability automatically.
`core/animationRegistry.ts` follows the same model: core closes immediately by default, while the
`animations` capability registers Web Animations runners and presets. The main entry registers both
capabilities for backward-compatible behavior. Styling is
split into dialog, form/upload, and workflow modules and bundled as one public stylesheet.
The same layers are also emitted as `style/core.css`, `style/forms.css`, and
`style/workflows.css`, with additional toast, lightbox, command, and draggable component sheets.
All rules use ordered cascade layers. Direct interaction utilities are isolated behind the
`interactions` entry.

Public consumers should import only what they need:

- `forgedialog/core` for the lightweight dialog runtime.
- `forgedialog/alert`, `/confirm`, or `/prompt` for a single helper.
- `forgedialog/interactions` and `/animations` to opt into advanced runtime capabilities.
- `forgedialog/presentation` for drawers, sheets, lightboxes, loading, toast, and commands.
- `forgedialog/workflows` for branching async wizards.
- `forgedialog/react`, `/vue`, `/svelte`, or `/web-component` for lifecycle adapters.

The main `forgedialog` entry includes the complete API and default CSS. Subpath entries are
side-effect free; styles can be loaded explicitly from `forgedialog/style.css`.

Performance is protected by gzip budgets in `scripts/check-size.mjs`. Correctness is checked at
three levels: Vitest/jsdom unit tests, Playwright browser behavior, and Axe plus screenshot and
interaction-latency gates.
`scripts/analyze-bundle.mjs` reports dominant modules, while the tree-shaking fixture rejects
optional form, toast, or wizard code leaking into an alert-only consumer. Publint and ATTW validate
that every ESM/CJS subpath resolves to matching declarations.
API Extractor records the public surface in `etc/forgedialog.api.md`; Vite, Webpack, and CJS consumer
fixtures validate real package resolution. Pull requests receive a gzip artifact comparison against
their base branch. Changesets and the release workflow provide reviewed versions, CycloneDX SBOMs,
and provenance-backed npm publishing.
