# forgedialog-vue

The Vue binding for [Forge Dialog](https://forgedialog.konexforge.com).

`useForgeDialog()` opens dialogs through the library's `open()` and ties their lifetime to the
component's: a dialog still open when the component unmounts is destroyed rather than left mounted.

```sh
npm install forgedialog forgedialog-vue
```

```vue
<script setup lang="ts">
import { useForgeDialog } from 'forgedialog-vue';

const { open } = useForgeDialog<boolean>();

async function remove() {
  const instance = open({
    title: 'Delete this item?',
    message: 'This cannot be undone.',
    buttons: [
      { text: 'Cancel', role: 'secondary', closesDialog: true, value: false },
      { text: 'Delete', role: 'primary', closesDialog: true, value: true },
    ],
  });
  if (await instance.whenClosed()) {
    // …
  }
}
</script>

<template>
  <button @click="remove">Delete</button>
</template>
```

`useForgeDialog()` returns:

| Member   | Type                                               | Notes                                          |
| -------- | -------------------------------------------------- | ---------------------------------------------- |
| `open`   | `(options: DialogOptions<T>) => DialogInstance<T>` | Opens a dialog.                                |
| `active` | `ShallowRef<DialogInstance<T> \| null>`            | The open dialog, or `null` once it has closed. |

Every option is the core's — see the [API reference](https://forgedialog.konexforge.com/docs).
Import the stylesheet from the core as usual: `import 'forgedialog/style.css'`.

Vue is a peer dependency, so this package uses the copy your application already has.
`forgedialog` is a real dependency and is installed for you.

MIT licensed. Source, issues, and changelog: [github.com/cmm-cmm/ForgeDialog](https://github.com/cmm-cmm/ForgeDialog).
