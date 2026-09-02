import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Checks the built site before it ships.
 *
 * Every failure listed here is one this repository actually shipped or nearly
 * shipped: links that pointed at `docs.html` when the server answers at
 * `/docs`, a sidebar entry aimed at a section that had been renamed, an FAQ
 * whose structured data could drift from the visible questions, and a
 * translated page whose hreflang set did not match its counterpart's. A page
 * can look right in a browser and still be wrong in every one of those ways,
 * so they are checked rather than eyeballed.
 *
 * Runs at the end of `npm run site:build`, so a broken link fails the deploy
 * instead of reaching the site.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');
const failures = [];

function fail(file, message) {
  failures.push(`${path.relative(site, file)}: ${message}`);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else files.push(target);
  }
  return files;
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves a site URL the way Workers static assets does: a directory means
 * its index.html, and an extensionless path means the .html file of that name.
 */
async function resolveTarget(fromFile, url) {
  const base = url.startsWith('/') ? site : path.dirname(fromFile);
  const relative = url.startsWith('/') ? `.${url}` : url;
  const target = path.resolve(base, relative);
  for (const candidate of [target, path.join(target, 'index.html'), `${target}.html`]) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

const files = (await walk(site)).filter((entry) => entry.endsWith('.html'));

const ids = new Map();
for (const file of files) {
  const html = await readFile(file, 'utf8');
  ids.set(file, new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1])));
}

const origins = new Set();
/** canonical URL -> its declared hreflang set, for the reciprocity check. */
const hreflang = new Map();

for (const file of files) {
  const html = await readFile(file, 'utf8');

  // Links and assets: the target has to exist, and an anchor has to name a
  // real id on the page it lands on.
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|data:|\/\/)/.test(url)) continue;
    const [pathPart, anchor] = url.split('#');
    const target = pathPart === '' ? file : await resolveTarget(file, pathPart);
    if (!target) {
      fail(file, `link goes nowhere: ${url}`);
      continue;
    }
    if (anchor && target.endsWith('.html') && !ids.get(target)?.has(anchor)) {
      fail(file, `anchor #${anchor} does not exist in ${path.relative(site, target)}`);
    }
    // A page the server answers at /docs must not be linked as /docs.html: the
    // extension form is a redirect, and a redirecting link is a wasted hop.
    if (/\.html$/.test(pathPart)) {
      fail(file, `link uses the .html form, which redirects: ${url}`);
    }
  }

  // Structured data has to parse, or a search engine silently ignores it.
  for (const [, body] of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (error) {
      fail(file, `JSON-LD does not parse: ${error.message}`);
      continue;
    }

    // The FAQ schema is hand-written beside the visible questions, so it can
    // drift from them. It must not.
    const faq = (parsed['@graph'] ?? [parsed]).find((node) => node['@type'] === 'FAQPage');
    if (!faq) continue;
    const asked = faq.mainEntity.map((entry) => entry.name);
    const shown = [...html.matchAll(/<h3>([^<]*\?)<\/h3>/g)].map((match) =>
      match[1].replaceAll('&#39;', "'").replaceAll('&amp;', '&').trim(),
    );
    if (asked.join(' | ') !== shown.join(' | ')) {
      fail(
        file,
        `FAQ schema and visible questions disagree\n    schema: ${asked.join(' | ')}\n    page:   ${shown.join(' | ')}`,
      );
    }
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];

  // hreflang has to be reciprocal: a page that names a translation must be
  // named back by it, or a search engine discards the whole annotation. That
  // is the usual way a bilingual site gets this wrong, and it is invisible in
  // a browser.
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
  if (alternates.length) {
    hreflang.set(canonical, new Map(alternates.map(([, code, href]) => [code, href])));
    if (!alternates.some(([, code]) => code === 'x-default')) {
      fail(file, 'declares hreflang alternates but no x-default');
    }
    if (canonical && !alternates.some(([, , href]) => href === canonical)) {
      fail(file, `hreflang set does not include this page's own canonical (${canonical})`);
    }
  }

  if (path.basename(file) === '404.html') {
    // A 404 answers for any address, so it has no canonical URL of its own and
    // nothing on it is worth indexing.
    if (canonical) fail(file, 'a 404 page must not declare a canonical URL');
    if (!html.includes('name="robots" content="noindex"')) fail(file, 'missing noindex');
  } else if (!canonical) {
    fail(file, 'missing <link rel="canonical">');
  } else {
    origins.add(new URL(canonical).origin);
    for (const tag of ['<title>', 'name="description"', 'property="og:image"']) {
      if (!html.includes(tag)) fail(file, `missing ${tag}`);
    }
  }
}

for (const [canonical, set] of hreflang) {
  for (const [code, href] of set) {
    if (code === 'x-default' || href === canonical) continue;
    const other = hreflang.get(href);
    if (!other) {
      failures.push(
        `${canonical} names ${href} as its "${code}" alternate, but that page declares no hreflang`,
      );
    } else if (![...other.values()].includes(canonical)) {
      failures.push(`${canonical} names ${href} as its "${code}" alternate, but is not named back`);
    }
  }
}

// One origin, or the generated sitemap and llms.txt describe a different site
// from the one the pages claim to be.
if (origins.size > 1) {
  failures.push(`pages disagree about the canonical origin: ${[...origins].join(', ')}`);
}

if (failures.length) {
  console.error(`site check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`site: ${files.length} pages checked — links, anchors, structured data, canonicals`);
