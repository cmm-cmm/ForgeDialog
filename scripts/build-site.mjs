import { copyFile, mkdir, readFile } from 'node:fs/promises';

/**
 * Copies the built library into the static site so the page runs the code from
 * this checkout rather than a CDN. Uses only Node built-ins: the site
 * deliberately has no dependencies of its own.
 *
 * The page reads its version from the library's own `VERSION` export at
 * runtime, so nothing here rewrites source files.
 */
const root = new URL('../', import.meta.url);
const vendor = new URL('site/vendor/', root);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

await mkdir(vendor, { recursive: true });
for (const file of ['index.global.js', 'index.css']) {
  await copyFile(new URL(`dist/${file}`, root), new URL(file, vendor));
}

console.log(`site: vendored ${pkg.name}@${pkg.version} into site/vendor`);
