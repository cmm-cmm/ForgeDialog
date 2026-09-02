import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Rasterizes `site/icon.svg` into the bitmap icons the web still needs.
 *
 * The SVG is the source of truth and is what browsers actually load as the
 * favicon; only iOS home screens and link-preview scrapers need PNGs. Those
 * PNGs are committed, so neither the site build nor a Cloudflare deploy runs
 * this — run it by hand (`npm run site:icons`) whenever the icon changes.
 *
 * Rendering goes through Chromium, which is already a dev dependency for the
 * end-to-end tests, rather than a hand-rolled rasterizer.
 */
const root = new URL('../', import.meta.url);
const site = new URL('site/', root);
const icon = await readFile(new URL('icon.svg', site), 'utf8');

const browser = await chromium.launch();

/** Renders `html` at exactly `width`×`height` and writes it out as a PNG. */
async function render(name, width, height, html) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(
    `<!doctype html><meta charset="utf-8">
     <style>html,body{margin:0;padding:0}</style>${html}`,
    { waitUntil: 'load' },
  );
  const buffer = await page.screenshot({ type: 'png' });
  await page.close();
  await writeFile(new URL(name, site), buffer);
  console.log(`icons: ${name} (${width}×${height}, ${buffer.length} bytes)`);
}

// iOS applies its own rounded mask to home-screen icons, so this variant
// squares off the ground the mark sits on rather than being rounded twice.
await render(
  'apple-touch-icon.png',
  180,
  180,
  `<style>svg{display:block;width:180px;height:180px}#ground{rx:0}</style>${icon}`,
);

// The link preview: the mark, the name, and what the thing is. The ground is
// a flat colour rather than a gradient — it looks the same at preview size and
// costs a fraction of the bytes in a repository that advertises being small.
await render(
  'og-image.png',
  1200,
  630,
  `<style>
     body{
       width:1200px;height:630px;display:flex;flex-direction:column;
       align-items:center;justify-content:center;gap:30px;box-sizing:border-box;
       background:#141728;color:#fff;font-family:'Liberation Sans',Arial,sans-serif;
       border-top:10px solid #ff9f1c;
     }
     .row{display:flex;align-items:center;gap:28px}
     svg{display:block;width:112px;height:112px}
     h1{margin:0;font-size:82px;letter-spacing:-2px}
     p{margin:0;font-size:34px;color:#aeb4cc}
     code{
       font-family:'Liberation Mono',monospace;font-size:27px;
       background:#1f2338;border:1px solid #333955;
       border-radius:10px;padding:13px 22px;color:#e6e8ef;
     }
   </style>
   <div class="row">${icon}<h1>Forge Dialog</h1></div>
   <p>Accessible, dependency-free dialogs for the web.</p>
   <code>npm install forgedialog</code>`,
);

await browser.close();
