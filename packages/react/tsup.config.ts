import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  target: 'es2019',
  dts: true,
  sourcemap: true,
  clean: true,
  // The framework and the core stay external: a wrapper that bundled either
  // would ship a second copy of it into every consumer.
  external: ['react', 'react-dom', 'vue', 'forgedialog'],
});
