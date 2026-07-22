import { readdir, readFile } from 'node:fs/promises';

for (const file of (await readdir('dist')).filter((name) => /\.(cjs|mjs|js)$/.test(name))) {
  const source = await readFile(`dist/${file}`, 'utf8');
  if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(source)) {
    throw new Error(`CSP-unsafe dynamic code found in dist/${file}`);
  }
}
console.log('Distribution contains no eval() or new Function() usage');
