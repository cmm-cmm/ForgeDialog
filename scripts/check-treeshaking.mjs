import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';

const result = await build({
  stdin: {
    contents: "import { alert } from './src/alert-entry.ts'; window.showAlert = alert;",
    resolveDir: process.cwd(),
  },
  bundle: true,
  minify: true,
  metafile: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2019',
  write: false,
});

const forbidden = ['src/api/toast.ts', 'src/api/form.ts', 'src/workflow/wizard.ts'];
const included = Object.keys(result.metafile.inputs).map((path) => path.replaceAll('\\', '/'));
const leaked = forbidden.filter((path) => included.some((input) => input.endsWith(path)));
const gzipBytes = gzipSync(result.outputFiles[0].contents).byteLength;
console.log(`alert-only fixture: ${(gzipBytes / 1024).toFixed(2)} KiB gzip`);
if (leaked.length) throw new Error(`Tree-shaking regression: ${leaked.join(', ')}`);
if (gzipBytes > 5.5 * 1024) throw new Error('Alert-only fixture exceeds the 5.5 KiB gzip budget');
