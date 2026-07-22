import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';

for (const [name, entry] of [
  ['core', 'src/core-entry.ts'],
  ['alert', 'src/alert-entry.ts'],
  ['animations', 'src/animations-entry.ts'],
  ['interactions', 'src/interactions-entry.ts'],
  ['full', 'src/index.ts'],
]) {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    metafile: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2019',
    external: ['*.css'],
    write: false,
  });
  const output = result.outputFiles[0].contents;
  const inputs = Object.entries(result.metafile.inputs)
    .sort(([, a], [, b]) => b.bytes - a.bytes)
    .slice(0, 5)
    .map(([file, data]) => `${file} (${data.bytes} B)`)
    .join(', ');
  console.log(`${name}: ${(gzipSync(output).byteLength / 1024).toFixed(2)} KiB gzip`);
  console.log(`  largest inputs: ${inputs}`);
}
