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

| Function                               | Returns                 | Description                                                  |
| -------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `alert(message, options?)`             | `Promise<void>`         | Single-button informational dialog.                          |
| `confirm(message, options?)`           | `Promise<boolean>`      | OK/Cancel dialog; resolves `false` on Escape/overlay close.  |
| `prompt(message, options?)`            | `Promise<string\|null>` | Text-input dialog with optional `validate()`.                |
| `open(options)`                        | `DialogInstance`        | Low-level API for fully custom dialogs.                      |
| `setTheme('light'\|'dark'\|'system')`  | `void`                  | Overrides the OS color-scheme preference.                    |
| `getTheme()`                           | `ThemeMode`             | Reads the current theme override.                            |
| `setLabels(overrides)` / `getLabels()` | `void` / `DialogLabels` | Overrides default button labels (`ok`, `cancel`, `close`).   |
| `registerPlugin(plugin)`               | `void`                  | Registers a plugin (`{ name, install?, hooks? }`).           |
| `on(hookName, fn)` / `off(...)`        | `void`                  | Shorthand for a single lifecycle hook without a full plugin. |

`DialogInstance` exposes `open()`, `close(result?)`, `whenClosed()`, `update(partialOptions)`, and `isOpen()`.

Lifecycle hooks: `beforeOpen`, `afterOpen`, `beforeClose`, `afterClose`, `beforeDestroy`.

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

This release focuses on a solid core dialog engine plus `alert`/`confirm`/`prompt`/`open()`. The following dialog types are planned as follow-ups on top of the same `Dialog` + `DialogStack` + `PluginManager` architecture, and are not included yet:

- Full-screen modal
- Side drawer
- Image preview
- Loading dialog
- Toast notification
- Multi-step wizard dialog

## License

MIT
