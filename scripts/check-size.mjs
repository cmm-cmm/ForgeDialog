import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const budgets = {
  'dist/core.cjs': 6.5 * 1024,
  'dist/index.cjs': 14 * 1024,
  'dist/interactions.cjs': 2 * 1024,
  'dist/style-core.css': 2.5 * 1024,
  'dist/style-forms.css': 0.9 * 1024,
  'dist/style-workflows.css': 0.7 * 1024,
};

let failed = false;
for (const [file, budget] of Object.entries(budgets)) {
  const size = gzipSync(readFileSync(file)).byteLength;
  console.log(
    `${file}: ${(size / 1024).toFixed(2)} KiB gzip / ${(budget / 1024).toFixed(1)} KiB budget`,
  );
  if (size > budget) failed = true;
}
if (failed) process.exitCode = 1;
