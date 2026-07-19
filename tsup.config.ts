import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs', 'iife'],
  globalName: 'ForgeDialog',
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  outExtension({ format }) {
    if (format === 'esm') return { js: '.mjs' };
    if (format === 'cjs') return { js: '.cjs' };
    if (format === 'iife') return { js: '.global.js' };
    return {};
  },
});
