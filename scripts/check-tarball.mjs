import { execSync } from 'node:child_process';

const output = JSON.parse(execSync('npm pack --dry-run --json', { encoding: 'utf8' }));
const result = Array.isArray(output) ? output[0] : output.files ? output : Object.values(output)[0];
if (!result?.files) throw new Error('npm pack did not return a file manifest');
const empty = result.files.filter((file) => file.size === 0);
console.log(`tarball: ${(result.size / 1024).toFixed(1)} KiB, ${result.entryCount} files`);
if (result.size > 100 * 1024) throw new Error('Tarball exceeds the 100 KiB budget');
if (empty.length)
  throw new Error(`Empty tarball artifacts: ${empty.map((file) => file.path).join(', ')}`);
