import { build } from 'esbuild';

/**
 * Capabilities register themselves through a bare, side-effectful import. A
 * bundler will drop that import unless the file it resolves to is covered by
 * `sideEffects` in package.json, and shared chunks emitted by code splitting
 * cannot be named there. This checks the published ESM actually keeps each
 * registration, so `import 'forgedialog/appearance'` is not silently a no-op.
 */
const cases = [
  {
    name: 'forgedialog',
    contents: "import { open } from './dist/index.mjs'; globalThis.o = open;",
    markers: ['title-color', 'fd-dialog--dragging', 'prefers-reduced-motion'],
  },
  {
    name: 'forgedialog/core',
    contents: "import { open } from './dist/core.mjs'; globalThis.o = open;",
    markers: ['title-color'],
  },
  {
    name: 'forgedialog/appearance + /alert',
    contents:
      "import './dist/appearance.mjs'; import { alert } from './dist/alert.mjs'; globalThis.a = alert;",
    markers: ['title-color'],
  },
  {
    name: 'forgedialog/interactions + /alert',
    contents:
      "import './dist/interactions.mjs'; import { alert } from './dist/alert.mjs'; globalThis.a = alert;",
    markers: ['fd-dialog--dragging'],
  },
  {
    name: 'forgedialog/animations + /alert',
    contents:
      "import './dist/animations.mjs'; import { alert } from './dist/alert.mjs'; globalThis.a = alert;",
    markers: ['prefers-reduced-motion'],
  },
];

let failed = false;
for (const { name, contents, markers } of cases) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd() },
    bundle: true,
    minify: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  const missing = markers.filter((marker) => !code.includes(marker));
  if (missing.length) {
    failed = true;
    console.error(`${name}: capability dropped by the bundler (missing ${missing.join(', ')})`);
  } else {
    console.log(`${name}: capabilities registered`);
  }
}

// The lightweight entries must stay lightweight: importing only forgedialog/alert
// must not drag the full appearance applier in.
const lean = await build({
  stdin: {
    contents: "import { alert } from './dist/alert.mjs'; globalThis.a = alert;",
    resolveDir: process.cwd(),
  },
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'esm',
  write: false,
  logLevel: 'silent',
});
if (lean.outputFiles[0].text.includes('title-color')) {
  failed = true;
  console.error('forgedialog/alert: pulled in the full appearance applier');
} else {
  console.log('forgedialog/alert: stays on the lightweight applier');
}

if (failed) process.exitCode = 1;
