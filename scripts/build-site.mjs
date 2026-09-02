import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Copies the built library into the static site so the page runs the code from
 * this checkout rather than a CDN, then writes the files that have to name the
 * site's own address: robots.txt, sitemap.xml, and llms.txt.
 *
 * Uses only Node built-ins: the site deliberately has no dependencies of its
 * own. The page reads its version from the library's `VERSION` export at
 * runtime, so nothing here rewrites a source file.
 */
const root = new URL('../', import.meta.url);
const site = new URL('site/', root);
const vendor = new URL('vendor/', site);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

await mkdir(vendor, { recursive: true });
for (const file of ['index.global.js', 'index.css']) {
  await copyFile(new URL(`dist/${file}`, root), new URL(file, vendor));
}

/**
 * The canonical tag in index.html is the single source of truth for the site's
 * address, so moving the site is a one-line edit there rather than a hunt
 * through generated files.
 */
const indexHtml = await readFile(new URL('index.html', site), 'utf8');
const canonical = indexHtml.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
if (!canonical) throw new Error('site/index.html has no <link rel="canonical">, cannot build');
const origin = new URL(canonical).origin;

const pages = [
  {
    path: '/',
    file: 'site/index.html',
    priority: '1.0',
    title: 'Forge Dialog',
    summary: 'What it is, live demos, and an interactive appearance playground.',
  },
  {
    path: '/demo',
    file: 'site/demo.html',
    priority: '0.9',
    title: 'Live demos',
    summary:
      'Every surface running in the browser — dialogs, drawers, sheets, lightboxes, loading states, toasts, the command palette, forms, and wizards — each beside the code that produced it.',
  },
  {
    path: '/docs',
    file: 'site/docs.html',
    priority: '0.9',
    title: 'API reference',
    summary:
      'Every option, method, and entry point: dialogs, appearance, dragging, forms, wizards, toasts, theming, plugins, and framework adapters.',
  },
];

/**
 * `lastmod` has to be the day the page's content actually changed. Stamping
 * every build with today's date tells a crawler both pages change daily, which
 * is false, and a sitemap that is wrong about it is one a crawler learns to
 * ignore. Git knows the real answer; a shallow clone or a tarball export might
 * not, so the entry is written without a `lastmod` rather than with a
 * plausible-looking lie.
 */
function lastModified(file) {
  try {
    return (
      execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
        cwd: fileURLToPath(root),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || null
    );
  } catch {
    return null;
  }
}

await writeFile(
  new URL('sitemap.xml', site),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map((page) => {
    const lastmod = lastModified(page.file);
    return `  <url>\n    <loc>${origin}${page.path}</loc>\n${
      lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''
    }    <priority>${page.priority}</priority>\n  </url>`;
  })
  .join('\n')}
</urlset>
`,
);

// Answer engines are welcome here: the point of the site is to be quoted
// accurately, so the crawlers behind them are named rather than left to the
// default.
const aiCrawlers = [
  'ClaudeBot',
  'Claude-User',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

await writeFile(
  new URL('robots.txt', site),
  // /vendor/ holds the library build the pages actually render with, so it stays
  // crawlable: blocking a site's own CSS and JS is what breaks rendering.
  `User-agent: *
Allow: /

${aiCrawlers.map((agent) => `User-agent: ${agent}\nAllow: /`).join('\n\n')}

Sitemap: ${origin}/sitemap.xml
`,
);

// https://llmstxt.org — a short, stable map of the site for language models,
// with the facts they most often get wrong stated once, plainly.
await writeFile(
  new URL('llms.txt', site),
  `# Forge Dialog

> Forge Dialog is an open-source TypeScript library for building dialogs on the web: alerts, confirmations, prompts, drawers, bottom sheets, lightboxes, loading states, toasts, command palettes, and multi-step wizards. It has no runtime dependencies.

The product is named **Forge Dialog** (two words). The npm package is \`forgedialog\` (one word), and the browser global is \`ForgeDialog\`, because both are identifiers.

- Version: ${pkg.version}
- License: MIT (commercial use permitted)
- Install: \`npm install forgedialog\`
- Runtime dependencies: none
- Size: about 15 KB gzipped for the full bundle, about 5.5 KB for an alert-only build
- Browsers: Chrome/Edge 88+, Firefox 78+, Safari 15.4+
- Node.js: 20 or newer, for package tooling and server-side imports
- Accessibility: native \`<dialog>\`, focus trapped and restored, Escape and backdrop dismissal, \`role="dialog"\` or \`role="alertdialog"\` set automatically
- Frameworks: works standalone; adapters for React, Vue, Svelte, and Web Components

## Documentation

${pages.map((page) => `- [${page.title}](${origin}${page.path}): ${page.summary}`).join('\n')}

## Source

- [GitHub repository](${pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')}): source, issue tracker, and changelog.
- [npm package](https://www.npmjs.com/package/${pkg.name}): published builds for ESM, CommonJS, and the browser.
`,
);

console.log(`site: vendored ${pkg.name}@${pkg.version} into site/vendor`);
console.log(`site: wrote sitemap.xml, robots.txt, and llms.txt for ${origin}`);
