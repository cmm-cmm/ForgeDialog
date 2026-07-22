import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const budgets = {
  'dist/core.cjs': 6 * 1024,
  'dist/index.cjs': 14 * 1024,
};

let failed = false;
for (const [file, budget] of Object.entries(budgets)) {
  const size = gzipSync(readFileSync(file)).byteLength;
  console.log(
    `${file}: ${(size / 1024).toFixed(2)} KiB gzip / ${(budget / 1024).toFixed(0)} KiB budget`,
  );
  if (size > budget) failed = true;
}
if (failed) process.exitCode = 1;
