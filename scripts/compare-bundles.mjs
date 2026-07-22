import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const [beforeDir, afterDir] = process.argv.slice(2);
const selected = (name) => /\.(cjs|mjs|css)$/.test(name) && !name.endsWith('.map');
async function sizes(directory) {
  const files = (await readdir(directory)).filter(selected);
  return Object.fromEntries(
    await Promise.all(
      files.map(async (file) => [
        file,
        gzipSync(await readFile(`${directory}/${file}`)).byteLength,
      ]),
    ),
  );
}
const before = await sizes(beforeDir);
const after = await sizes(afterDir);
const rows = Object.keys(after)
  .filter((file) => before[file] !== undefined)
  .map((file) => [file, before[file], after[file], after[file] - before[file]]);
const report = [
  '## Bundle gzip diff',
  '',
  '| Artifact | Base | PR | Delta |',
  '|---|---:|---:|---:|',
  ...rows.map(
    ([file, base, current, delta]) =>
      `| ${file} | ${(base / 1024).toFixed(2)} KiB | ${(current / 1024).toFixed(2)} KiB | ${delta >= 0 ? '+' : ''}${(delta / 1024).toFixed(2)} KiB |`,
  ),
].join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
}
