# ForgeDialog

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
import { alert, confirm, prompt, form, wizard, open } from 'forgedialog';
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

// Form — a versatile sub-form dialog with a declarative field set.
// Field configs are inferred literally (no `as const` needed), so `values` is typed as
// `{ name: string; email: string; newsletter: boolean } | null` — not a loose Record.
const values = await form([
  { type: 'text', name: 'name', label: 'Full name', required: true },
  { type: 'email', name: 'email', label: 'Email', required: true },
  { type: 'checkbox', name: 'newsletter', label: 'Subscribe to the newsletter' },
], { title: 'Create account' });

// Wizard — a multi-step sub-form with a progress stepper and per-step validation
const account = await wizard([
  {
    id: 'profile',
    title: 'Profile',
    fields: [{ type: 'text', name: 'name', label: 'Full name', required: true }],
  },
  {
    id: 'plan',
    title: 'Plan',
    fields: [
      {
        type: 'radio',
        name: 'plan',
        label: 'Choose a plan',
        options: [
          { label: 'Free', value: 'free' },
          { label: 'Pro', value: 'pro' },
        ],
      },
    ],
  },
]);
// account -> { name, plan } merged across every step, or null if cancelled at any step

// Drag-and-drop file upload as a form field
const upload = await form([
  { type: 'text', name: 'title', label: 'Title', required: true },
  { type: 'file', name: 'attachments', label: 'Attachments', multiple: true, maxSizeBytes: 5e6 },
]);
// upload.attachments -> File[]

// Draggable dialog
await confirm('Drag me by the header.', { draggable: true, animation: 'bounce' });

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

| Function                                | Returns                        | Description                                                                |
| ---------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| `alert(message, options?)`              | `Promise<void>`                 | Single-button informational dialog.                                       |
| `confirm(message, options?)`            | `Promise<boolean>`              | OK/Cancel dialog; resolves `false` on Escape/overlay close.               |
| `prompt(message, options?)`             | `Promise<string\|null>`         | Text-input dialog with optional `validate()`.                             |
| `form(fields, options?)`                | `Promise<InferFormValues<F>\|null>`   | Versatile, type-inferred sub-form dialog — declarative field set, validation. |
| `wizard(steps, options?)`               | `Promise<InferWizardValues<S>\|null>` | Multi-step sub-form with an animated progress stepper and per-step validation. |
| `open(options)`                         | `DialogInstance`                | Low-level API for fully custom dialogs.                                   |
| `setTheme('light'\|'dark'\|'system')`   | `void`                          | Overrides the OS color-scheme preference.                                 |
| `getTheme()`                            | `ThemeMode`                     | Reads the current theme override.                                         |
| `setLabels(overrides)` / `getLabels()`  | `void` / `DialogLabels`         | Overrides default button labels (`ok`, `cancel`, `close`, `submit`...).   |
| `registerPlugin(plugin)`                | `void`                          | Registers a plugin (`{ name, install?, hooks? }`).                        |
| `on(hookName, fn)` / `off(...)`         | `void`                          | Shorthand for a single lifecycle hook without a full plugin.              |

`DialogInstance` exposes `open()`, `close(result?)`, `whenClosed()`, `update(partialOptions)`, and `isOpen()`.

Lifecycle hooks: `beforeOpen`, `afterOpen`, `beforeClose`, `afterClose`, `beforeDestroy`.

### Form fields

`form(fields, options?)` renders a dialog from a declarative list of `FormFieldConfig` entries
and resolves with an object of collected values (or `null` if cancelled). Supported field
`type`s: `text`, `password`, `email`, `number`, `date`, `textarea`, `select`, `checkbox`,
`radio`, `file`. Each field accepts `label`, `required`, `defaultValue`, `placeholder`,
`helpText`, and a per-field `validate(value, allValues)`. `options.validate(allValues)` runs
whole-form, cross-field validation after every field passes.

`form()`'s return type is inferred directly from the `fields` array literal — no `as const`
needed (TypeScript 5's `const` type parameters do the work) — so `checkbox` fields type as
`boolean`, `number` fields as `number`, `file` fields as `File[]`, multi-`select` as `string[]`,
and everything else as `string`, all keyed by each field's own `name`.

### Drag-and-drop file upload

`{ type: 'file', name, accept?, multiple?, maxFiles?, maxSizeBytes? }` renders a real drop zone —
drag files onto it or click to browse, with image thumbnail previews, per-file remove buttons,
and client-side `accept`/`maxFiles`/`maxSizeBytes` validation. The collected value is a plain
`File[]`; actually uploading them (to S3, an API route, etc.) is left to your own code after the
dialog resolves — this is a zero-dependency UI library, not a network/transport layer.

### Wizard (multi-step dialogs)

`wizard(steps, options?)` renders an animated multi-step sub-form: a progress stepper across the
top (numbered, with completed/current/upcoming states and a filling connector line), Back/Next
buttons that swap to "Finish" on the last step, and per-step validation that blocks advancing
until it passes. Each `WizardStep` is either declarative (`fields: FormFieldConfig[]`, reusing
the same field types as `form()`) or fully custom (`content(container, valuesSoFar)`, for intro
screens, summaries, etc.). Values from every `fields`-based step are merged into one result
object on Finish; a `content`-only step doesn't contribute values. Buttons are disabled for the
duration of each step transition so a double-click can't be silently dropped mid-animation.

### Draggable dialogs

Set `draggable: true` on any `alert`/`confirm`/`prompt`/`form`/`open()` call to let the user drag
the dialog by its header, like a desktop window. Position is clamped so the dialog can't be
dragged off-screen.

### Animation presets

`options.animation`: `'fade'` (default) | `'scale'` | `'slide'` | `'bounce'` | `'blur'` | `'none'`.
`'blur'` animates the overlay's backdrop blur alongside the dialog; `'bounce'` adds a spring-like
overshoot on entry.

## Development

```sh
npm install
npm run build       # emit dist/ (ESM, CJS, IIFE, .d.ts, CSS)
npm run test         # vitest + jsdom
npm run typecheck
npm run lint
npm run demo         # build and serve the demo/ page
```

## Roadmap / out of scope for this release

This release covers a solid core dialog engine — `alert`/`confirm`/`prompt`/`form`/`wizard`/
`open()`, type-inferred sub-forms with a drag-and-drop file upload field, draggable dialogs, and
an extended animation preset set. The following dialog types are planned as follow-ups on top of
the same `Dialog` + `DialogStack` + `PluginManager` architecture, and are not included yet:

- Full-screen modal
- Side drawer
- Image preview
- Loading dialog
- Toast notification

## License

MIT
