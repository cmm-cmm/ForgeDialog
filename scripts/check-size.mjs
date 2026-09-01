import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const budgets = {
  'dist/core.cjs': 6.5 * 1024,
  // Raised in 0.7.0: the main entry auto-enables the full appearance applier
  // (per-component colors, composed shadows, hover). Focused entries such as
  // forgedialog/alert keep the lightweight applier and their former budgets.
  'dist/index.cjs': 14.6 * 1024,
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
