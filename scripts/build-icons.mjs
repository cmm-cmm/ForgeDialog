import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Rasterizes `site/icon.svg` into the bitmap icons the web still needs.
 *
 * The SVG is the source of truth and is what modern browsers load as the
 * favicon; iOS home screens, link-preview scrapers, and clients that request
 * `/favicon.ico` regardless of the `<link rel="icon">` need bitmaps. Those are
 * committed, so neither the site build nor a Cloudflare deploy runs this — run
 * it by hand (`npm run site:icons`) whenever the icon changes.
 *
 * Rendering goes through Chromium, which is already a dev dependency for the
 * end-to-end tests, rather than a hand-rolled rasterizer.
 */
const root = new URL('../', import.meta.url);
const site = new URL('site/', root);
const icon = await readFile(new URL('icon.svg', site), 'utf8');

const browser = await chromium.launch();

/** Renders `html` at exactly `width`×`height` and writes it out as a PNG. */
async function render(name, width, height, html, { transparent = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.setContent(
    `<!doctype html><meta charset="utf-8">
     <style>html,body{margin:0;padding:0}</style>${html}`,
    { waitUntil: 'load' },
  );
  const buffer = await page.screenshot({ type: 'png', omitBackground: transparent });
  await page.close();
  if (name.endsWith('.png')) await writeFile(new URL(name, site), buffer);
  console.log(`icons: ${name} (${width}×${height}, ${buffer.length} bytes)`);
  return buffer;
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

// Some clients ask for /favicon.ico whatever the <link rel="icon"> says, and a
// 404 for it shows up in logs and in crawlers' reports.
//
// An .ico is a 6-byte header, one 16-byte directory entry per image, then the
// payloads — and since Vista a payload may be a PNG verbatim. Writing it that
// way needs no bitmap encoder and keeps the file near a kilobyte.
const ico = await render(
  'favicon.ico',
  32,
  32,
  `<style>svg{display:block;width:32px;height:32px}</style>${icon}`,
  { transparent: true },
);
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(1, 4); // one image in the file
const entry = Buffer.alloc(16);
entry[0] = 32; // width
entry[1] = 32; // height
entry.writeUInt16LE(1, 4); // colour planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(ico.length, 8); // payload size
entry.writeUInt32LE(header.length + entry.length, 12); // payload offset
await writeFile(new URL('favicon.ico', site), Buffer.concat([header, entry, ico]));

await browser.close();
