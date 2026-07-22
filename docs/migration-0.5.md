# Migrating to ForgeDialog 0.5

Version 0.5 keeps the main `forgedialog` entry backward compatible. Existing imports continue to
include advanced dragging and animation presets, so most applications need no code changes.

## Use focused entry points

Applications that only need one helper can reduce their JavaScript bundle:

```ts
import { alert } from 'forgedialog/alert';
import 'forgedialog/style/core.css';
```

The `core`, `alert`, `confirm`, and `prompt` entries use immediate animation runners and lightweight
dragging by default. Add only the richer capabilities the application needs:

```ts
import 'forgedialog/animations';
import 'forgedialog/interactions';
import { open } from 'forgedialog/core';
```

Capability imports are side effects and should appear before dialogs are opened. The main
`forgedialog` entry registers both automatically.

## Compose styles

`forgedialog/style.css` remains supported. For smaller pages, import `style/core.css` first and add
component sheets such as `style/forms.css`, `style/workflows.css`, or `style/draggable.css` as used.

## Adopt appearance and position APIs

Move one-off dialog styling into `appearance` options. Use `setPosition()`, `getPosition()`, and
`resetPosition()` instead of mutating transforms directly; this keeps constraints, persistence, and
runtime updates synchronized.
