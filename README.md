# ForgeDialog 0.7

_A modern, lightweight, and highly customizable JavaScript dialog library for alerts, confirmations, modals, drawers, and interactive workflows._

ForgeDialog is a next-generation dialog component built for modern web applications. It provides beautiful animations, flexible layouts, accessibility, and a powerful API while remaining lightweight, dependency-free, and framework-agnostic.

Designed to replace traditional browser dialogs and heavy modal libraries, ForgeDialog makes it easy to build elegant user interactions — from simple alert boxes to complex multi-step workflows.

## Highlights

- 🚀 Lightweight and fast
- 🎨 Fully customizable appearance
- 📱 Responsive and mobile-friendly
- ♿ Accessibility (ARIA) compliant
- 🌙 Dark mode support
- 🌐 Internationalization (i18n)
- ✨ Smooth animations and transitions
- 🔌 Plugin architecture
- 📦 Zero dependency
- 📜 TypeScript support

## Install

```sh
npm install forgedialog
```

```js
import { alert, confirm, prompt, open } from 'forgedialog';
import 'forgedialog/style.css';
```

Or via a plain `<script>` tag (UMD/IIFE global `ForgeDialog`):

```html
<link rel="stylesheet" href="https://unpkg.com/forgedialog/dist/index.css" />
<script src="https://unpkg.com/forgedialog/dist/index.global.js"></script>
<script>
  ForgeDialog.alert('Hello!');
</script>
```

## Quick start

```js
import { alert, confirm, prompt, open } from 'forgedialog';

// Alert
await alert('Saved successfully.', { title: 'Success' });

// Confirm
const ok = await confirm('Delete this item?', { title: 'Please confirm' });

// Prompt
const name = await prompt('What is your name?', {
  defaultValue: 'Ada Lovelace',
  validate: (value) => (value.trim().length > 0 ? true : 'Name is required'),
});

// Fully custom dialog
const instance = open({
  title: 'Custom dialog',
  content: (container) => {
    const p = document.createElement('p');
    p.textContent = 'Anything can go here.';
    container.appendChild(p);
  },
  buttons: [{ text: 'Close', role: 'primary', autoFocus: true, onClick: (i) => i.close() }],
});
const result = await instance.whenClosed();
```

## API

| Function                               | Returns                 | Description                                                          |
| -------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| `alert(message, options?)`             | `Promise<void>`         | Single-button informational dialog.                                  |
| `confirm(message, options?)`           | `Promise<boolean>`      | OK/Cancel dialog; resolves `false` on Escape/overlay close.          |
| `prompt(message, options?)`            | `Promise<string\|null>` | Text-input dialog with optional `validate()`.                        |
| `open(options)`                        | `DialogInstance`        | Low-level API for fully custom dialogs.                              |
| `setTheme('light'\|'dark'\|'system')`  | `void`                  | Overrides the OS color-scheme preference.                            |
| `getTheme()`                           | `ThemeMode`             | Reads the current theme override.                                    |
| `setLabels(overrides)` / `getLabels()` | `void` / `DialogLabels` | Overrides default labels (`ok`, `cancel`, `close`, `notifications`). |
| `registerPlugin(plugin)`               | `void`                  | Registers a plugin (`{ name, install?, hooks? }`).                   |
| `on(hookName, fn)` / `off(...)`        | `void`                  | Shorthand for a single lifecycle hook without a full plugin.         |

`DialogInstance` exposes `open()`, `close(result?)`, `whenClosed()`, `update(partialOptions)`,
`isOpen()`, and the position methods `getPosition()`, `setPosition()`, and `resetPosition()`.

Lifecycle hooks: `beforeOpen`, `afterOpen`, `beforeClose`, `afterClose`, `beforeDestroy`.

`content` strings are rendered as text. For untrusted markup, provide an explicit sanitizer:

```ts
open({ html: userContent, sanitizeHtml: (html) => DOMPurify.sanitize(html) });
```

For markup already guaranteed to be trusted, `unsafeHtml` remains available. Lifecycle failures
are cleaned up automatically and may be observed with `onError(error, instance)`.

## Per-dialog appearance and dragging

Appearance overrides are scoped to one dialog and can be updated at runtime. Numeric opacity values
are clamped to `0..1`; numeric widths and blur values are interpreted as pixels.

```ts
const dialog = open({
  title: 'Movable inspector',
  message: 'Drag the header or focus it and use the arrow keys.',
  appearance: {
    opacity: 0.9,
    overlayOpacity: 0.55,
    backdropBlur: 12,
    surfaceColor: '#12141a',
    radius: { topLeft: 24, topRight: 24, bottomRight: 4, bottomLeft: 4 },
    titleColor: '#ffd166',
    titleBackground: '#1b1740',
    titleOpacity: 0.95,
    contentColor: '#c8ccd4',
    contentOpacity: 0.8,
    borderColor: '#7c5cff',
    borderOpacity: 0.6,
    borderWidth: 2,
    // A preset, any CSS box-shadow, or a shadow composed from its parts.
    shadow: { angle: 135, distance: 24, blur: 60, color: '#000', opacity: 0.45 },
    hover: {
      borderColor: '#9f7bff',
      titleColor: '#ffffff',
      shadow: 'xl',
      lift: 6,
      scale: 1.02,
      duration: 150,
    },
  },
  draggable: {
    axis: 'both',
    bounds: 'viewport',
    persistKey: 'inspector',
    keyboardStep: 8,
    onDragEnd: ({ position }) => console.log(position),
  },
});

dialog.setPosition({ x: 40, y: 24 });
dialog.update({ appearance: { opacity: 1, shadow: 'md' } });
```

`draggable: true` remains supported. A selector or element can be supplied as `handle`; movement can
be constrained to `x`, `y`, the viewport, an element, or a `DOMRect`. Bottom sheets keep their
dedicated swipe-to-dismiss gesture and ignore general dragging.

Colors and opacity are scoped per component, so the surface, title, body, and border can each be
tuned on their own. `titleBackground` paints the header, which is transparent by default and is
clipped by the dialog's corners. `radius` takes one value for every corner, any CSS `border-radius`
value, or a per-corner object; corners left out of that object keep the theme radius. Drawers stay
square and bottom sheets keep rounding only their top corners unless `radius` says otherwise.

`shadow` accepts a preset name, a raw CSS `box-shadow`, or the parts of one:
`angle` picks the direction the shadow falls (`0` up, `90` right, `180` down, `270` left), while
`distance`, `blur`, `spread`, `color`, `opacity`, and `inset` control its shape and strength.

`hover` restyles the dialog only while the pointer is over it, and only for dialogs that ask for it,
so every other dialog stays completely static. It reuses the same color and shadow options and adds
`lift`, `scale`, and `duration`. Hover transforms honour `prefers-reduced-motion` and are suspended
while a dialog is being dragged so they cannot push it outside its bounds.

Both `forgedialog` and `forgedialog/core` ship the full appearance applier, so none of this needs an
extra import. The single-purpose entries (`forgedialog/alert`, `/confirm`, `/prompt`) stay on a
lightweight applier that covers surface opacity, backdrop, border, and shadow presets, and ignore
the richer options; import `forgedialog/appearance` alongside one of them to upgrade it:

```ts
import 'forgedialog/appearance';
import { alert } from 'forgedialog/alert';
```

## Advanced UI and workflows

ForgeDialog uses the native `<dialog>` top layer and adds typed outcomes, close reasons,
`AbortSignal`, drawers, bottom sheets, lightboxes, loading states, toast notifications, command
palettes, and persisted branching wizards.

```ts
import { drawer, toast, wizard } from 'forgedialog';

toast('Saved', { tone: 'success' });
// A duration of 0 or Infinity keeps the toast until dismiss() is called.
const upload = toast('Uploading…', { duration: 0 });
upload.dismiss();

drawer({ title: 'Settings', side: 'right', content: renderSettings });

const flow = wizard({
  initialData: { email: '' },
  steps: [
    { id: 'account', title: 'Account', render: renderAccount, validate: validateAccount },
    { id: 'review', title: 'Review', render: renderReview },
  ],
});
const data = await flow.result;
```

Tree-shakable entry points are available at `forgedialog/core`, `forgedialog/interactions`,
`forgedialog/animations`, `forgedialog/appearance`,
`forgedialog/presentation`, and `forgedialog/workflows`. `forgedialog/interactions` exposes the
standalone draggable controller without pulling in dialog APIs. Framework integrations are exported from `forgedialog/react`,
`forgedialog/vue`, `forgedialog/svelte`, and `forgedialog/web-component`.

Single-purpose entry points minimize simple dialogs further:

```ts
import { alert } from 'forgedialog/alert';
import { confirm } from 'forgedialog/confirm';
import { prompt } from 'forgedialog/prompt';
```

The main `forgedialog` entry automatically enables advanced dragging and animations. A core-only
application can opt into either capability without importing presentation or workflow APIs:

```ts
import 'forgedialog/interactions';
import 'forgedialog/animations';
import { open } from 'forgedialog/core';
```

For the smallest stylesheet, compose only the layers a page uses:

```js
import 'forgedialog/style/core.css';
import 'forgedialog/style/forms.css'; // form fields and file dropzones
import 'forgedialog/style/workflows.css'; // wizard stepper
import 'forgedialog/style/toast.css';
import 'forgedialog/style/lightbox.css';
import 'forgedialog/style/command.css';
import 'forgedialog/style/draggable.css';
```

`forgedialog/style.css` remains the all-in-one compatibility stylesheet.

## Development

```sh
npm install
npm run build       # emit dist/ (ESM, CJS, IIFE, .d.ts, CSS)
npm run test         # vitest + jsdom
npm run test:coverage # unit tests with enforced coverage thresholds
npm run test:e2e      # Chromium, Firefox, WebKit, and mobile browser checks
npm run typecheck
npm run lint
npm run size          # enforce runtime and CSS gzip budgets
npm run analyze       # report gzip size and largest source modules
npm run test:treeshake # verify an alert-only consumer excludes optional features
npm run check:package # validate ESM/CJS exports and declarations
npm run api:check     # reject unreviewed public API changes
npm run api:update    # intentionally refresh the reviewed API report
npm run test:consumers # build Vite, Webpack, and Node CJS fixtures
npm run validate      # run every non-browser quality and packaging gate
npm run validate:all  # run validate plus the cross-browser suite
npm run demo         # build and serve the demo/ page
```

Releases use Changesets (`npm run changeset`) and the protected GitHub release workflow. The
workflow generates a CycloneDX SBOM and publishes with npm provenance through trusted publishing;
local development and pull requests never publish packages. The process, and the one-time npm setup
it depends on, are in [docs/releasing.md](docs/releasing.md).

Supported baselines are Chrome/Edge 88+, Firefox 78+, Safari 15.4+, and Node.js 20+ for package
tooling and SSR imports.

## Contributing

Setup, the checks CI runs, and the gotchas worth knowing are in
[CONTRIBUTING.md](CONTRIBUTING.md). Participation is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md).

Found a security issue? Please report it privately — see [SECURITY.md](SECURITY.md).

## License

MIT
