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

test('alert visual remains stable', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Show Alert' }).click();
  await expect(page).toHaveScreenshot('alert-dialog.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.05,
  });
});

test('average open and close scripting time stays below budget', async ({ page }) => {
  await page.goto('/demo/');
  const average = await page.evaluate(async () => {
    const api = (window as typeof window & { ForgeDialog: typeof import('../src/index') })
      .ForgeDialog;
    const start = performance.now();
    for (let index = 0; index < 50; index += 1) {
      const instance = api.open({ animation: 'none', closable: false });
      await instance.close();
    }
    return (performance.now() - start) / 50;
  });
  expect(average).toBeLessThan(16);
});
