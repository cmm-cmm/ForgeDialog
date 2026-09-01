import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

// Budgets are guard rails against unintended growth, not targets to sit on.
// They were widened in 0.7.0 so the full appearance applier ships from both the
// main and core entries, and so routine changes have room before a budget trips.
const budgets = {
  'dist/core.cjs': 8 * 1024,
  'dist/index.cjs': 16 * 1024,
  'dist/interactions.cjs': 2.5 * 1024,
  'dist/style-core.css': 3 * 1024,
  'dist/style-forms.css': 1.1 * 1024,
  'dist/style-workflows.css': 0.9 * 1024,
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
