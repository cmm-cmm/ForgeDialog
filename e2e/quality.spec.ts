import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('open dialog has no detectable WCAG A/AA violations', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Show Prompt' }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('dialog remains distinguishable in Windows forced-colors mode', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium provides the canonical emulation');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Show Alert' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Heads up' });
  await expect(dialog).toHaveCSS('border-top-style', 'solid');
  await expect(dialog).toHaveCSS('box-shadow', 'none');
});

test('alert visual remains stable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Uses the canonical Chromium snapshot');
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Show Alert' }).click();
  await expect(page).toHaveScreenshot('alert-dialog.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.05,
  });
});

test('open and close latency and DOM cleanup stay within budgets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Records the canonical performance budget');
  await page.goto('/demo/');
  const metrics = await page.evaluate(async () => {
    const api = (window as typeof window & { ForgeDialog: typeof import('../src/index') })
      .ForgeDialog;
    const samples: number[] = [];
    for (let index = 0; index < 200; index += 1) {
      const start = performance.now();
      const instance = api.open({ animation: 'none', closable: false });
      await instance.close();
      samples.push(performance.now() - start);
    }
    samples.sort((left, right) => left - right);
    return {
      p50: samples[Math.floor(samples.length * 0.5)],
      p95: samples[Math.floor(samples.length * 0.95)],
      remainingDialogs: document.querySelectorAll('.fd-overlay').length,
    };
  });
  await testInfo.attach('runtime-metrics', {
    body: JSON.stringify(metrics, null, 2),
    contentType: 'application/json',
  });
  expect(metrics.p50).toBeLessThan(12);
  expect(metrics.p95).toBeLessThan(24);
  expect(metrics.remainingDialogs).toBe(0);
});
