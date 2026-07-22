import { defineConfig, type Options } from 'tsup';
import packageJson from './package.json';

const shared: Options = {
  target: 'es2019',
  dts: true,
  sourcemap: true,
  minify: true,
  define: { __FORGEDIALOG_VERSION__: JSON.stringify(packageJson.version) },
  outExtension({ format }) {
    if (format === 'esm') return { js: '.mjs' };
    if (format === 'cjs') return { js: '.cjs' };
    if (format === 'iife') return { js: '.global.js' };
    return {};
  },
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs', 'iife'],
    globalName: 'ForgeDialog',
    clean: true,
  },
  {
    ...shared,
    entry: {
      core: 'src/core-entry.ts',
      alert: 'src/alert-entry.ts',
      confirm: 'src/confirm-entry.ts',
      prompt: 'src/prompt-entry.ts',
      interactions: 'src/interactions-entry.ts',
      animations: 'src/animations-entry.ts',
      presentation: 'src/presentation-entry.ts',
      workflows: 'src/workflows-entry.ts',
      react: 'src/adapters/react.ts',
      vue: 'src/adapters/vue.ts',
      svelte: 'src/adapters/svelte.ts',
      'web-component': 'src/adapters/web-component.ts',
    },
    format: ['esm', 'cjs'],
    external: ['react', 'vue'],
    clean: false,
  },
  {
    ...shared,
    entry: {
      'style-core': 'src/style-core.ts',
      'style-forms': 'src/style-forms.ts',
      'style-workflows': 'src/style-workflows.ts',
      'style-toast': 'src/style-toast.ts',
      'style-lightbox': 'src/style-lightbox.ts',
      'style-command': 'src/style-command.ts',
      'style-draggable': 'src/style-draggable.ts',
    },
    format: ['esm'],
    dts: false,
    sourcemap: false,
    clean: false,
  },
]);
