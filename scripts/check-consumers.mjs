import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { build as viteBuild } from 'vite';

const require = createRequire(import.meta.url);
const webpack = require('webpack');
const output = '.consumer-builds';
await rm(output, { recursive: true, force: true });

await viteBuild({
  configFile: false,
  logLevel: 'error',
  build: {
    lib: { entry: 'tests/consumers/esm.js', formats: ['es'], fileName: 'consumer' },
    outDir: `${output}/vite`,
  },
});

await new Promise((resolve, reject) => {
  webpack(
    {
      mode: 'production',
      entry: './tests/consumers/esm.js',
      output: { path: `${process.cwd()}/${output}/webpack`, filename: 'consumer.js' },
    },
    (error, stats) => {
      if (error || stats?.hasErrors()) reject(error ?? new Error(stats?.toString('errors-only')));
      else resolve();
    },
  );
});

const cjs = spawnSync(process.execPath, ['tests/consumers/cjs.cjs'], { stdio: 'inherit' });
const ssr = spawnSync(process.execPath, ['tests/consumers/ssr.mjs'], { stdio: 'inherit' });
await rm(output, { recursive: true, force: true });
if (cjs.status !== 0 || ssr.status !== 0) throw new Error('Node SSR consumer failed');
console.log('Vite, Webpack, Node CommonJS, and no-DOM ESM consumers passed');
