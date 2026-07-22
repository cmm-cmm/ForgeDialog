import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  target: 'es2019',
  dts: true,
  sourcemap: true,
  minify: true,
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
]);
