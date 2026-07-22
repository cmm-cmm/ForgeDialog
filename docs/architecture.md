# ForgeDialog Architecture

ForgeDialog is split into a dependency-free runtime and optional presentation, workflow, and
framework entry points. `src/core/Dialog.ts` owns the state machine and native `<dialog>` lifecycle;
`DialogStack` coordinates Escape handling and scroll locking. DOM construction remains isolated in
`domBuilder` so render behavior can evolve independently from orchestration.

Public consumers should import only what they need:

- `forgedialog/core` for alert, confirm, prompt, and typed `open()`.
- `forgedialog/presentation` for drawers, sheets, lightboxes, loading, toast, and commands.
- `forgedialog/workflows` for branching async wizards.
- `forgedialog/react`, `/vue`, `/svelte`, or `/web-component` for lifecycle adapters.

The main `forgedialog` entry includes the complete API and default CSS. Subpath entries are
side-effect free; styles can be loaded explicitly from `forgedialog/style.css`.

Performance is protected by gzip budgets in `scripts/check-size.mjs`. Correctness is checked at
three levels: Vitest/jsdom unit tests, Playwright browser behavior, and Axe plus screenshot and
interaction-latency gates.
