import { readdir, stat, unlink } from 'node:fs/promises';

for (const file of await readdir('dist')) {
  const path = `dist/${file}`;
  if ((await stat(path)).size === 0) await unlink(path);
}
