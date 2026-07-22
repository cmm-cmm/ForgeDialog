import { expect, test } from '@playwright/test';

test('alert traps focus, closes with Escape, and restores focus', async ({ page }) => {
  await page.goto('/demo/');
  const trigger = page.getByRole('button', { name: 'Show Alert' });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('alertdialog', { name: 'Heads up' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'OK' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('confirm defaults focus to the safe cancel action', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Show Confirm' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Please confirm' });
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
});

test('prompt exposes a labelled textbox and validation error state', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Prompt with validation' }).click();
  const input = page.getByRole('textbox', { name: 'Enter an even number:' });
  await expect(input).toBeFocused();
  await input.fill('3');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Number must be even')).toBeVisible();
});

test('closing a stacked dialog restores focus to the dialog below', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Two Stacked Dialogs' }).click();
  const dialogs = page.getByRole('alertdialog');
  await expect(dialogs).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(dialogs).toHaveCount(1);
  await expect(dialogs.first().getByRole('button', { name: 'Cancel' })).toBeFocused();
});

test('appearance builder applies scoped styling and keeps dragging inside the viewport', async ({
  page,
}) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Open interactive preview' }).click();
  const dialog = page.getByRole('dialog', { name: 'Interactive appearance preview' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS('--fd-dialog-opacity', '90%');
  await expect(dialog).toHaveCSS('--fd-dialog-border-color', '#7c5cff');

  await page.locator('#appearance-opacity').fill('0.6');
  await expect(dialog).toHaveCSS('--fd-dialog-opacity', '60%');

  const header = dialog.locator('.fd-dialog__header');
  const box = await header.boundingBox();
  if (!box) throw new Error('Dialog header is not measurable');
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(10_000, 10_000);
  await page.mouse.up();
  const moved = await dialog.boundingBox();
  if (!moved) throw new Error('Dialog is not measurable after dragging');
  expect(moved.x + moved.width).toBeLessThanOrEqual((await page.viewportSize())!.width + 1);
  expect(moved.y + moved.height).toBeLessThanOrEqual((await page.viewportSize())!.height + 1);

  await page.getByRole('button', { name: 'Reset position' }).click();
  await expect(dialog).toHaveCSS('--fd-drag-x', '0px');
  await expect(dialog).toHaveCSS('--fd-drag-y', '0px');
});

test('touch pointer dragging stays constrained after a mobile viewport resize', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Runs with a touch-enabled device');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Open interactive preview' }).click();
  const dialog = page.getByRole('dialog', { name: 'Interactive appearance preview' });
  const header = dialog.locator('.fd-dialog__header');
  const box = await header.boundingBox();
  if (!box) throw new Error('Dialog header is not measurable');
  await header.dispatchEvent('pointerdown', {
    button: 0,
    pointerId: 7,
    pointerType: 'touch',
    clientX: box.x + 20,
    clientY: box.y + 20,
  });
  await page.locator('body').dispatchEvent('pointermove', {
    pointerId: 7,
    pointerType: 'touch',
    clientX: 380,
    clientY: 820,
  });
  await page.locator('body').dispatchEvent('pointerup', {
    pointerId: 7,
    pointerType: 'touch',
    clientX: 380,
    clientY: 820,
  });
  await page.setViewportSize({ width: 360, height: 640 });
  await expect
    .poll(async () => {
      const moved = await dialog.boundingBox();
      return moved ? moved.x + moved.width : Infinity;
    })
    .toBeLessThanOrEqual(361);
  await expect
    .poll(async () => {
      const moved = await dialog.boundingBox();
      return moved ? moved.y + moved.height : Infinity;
    })
    .toBeLessThanOrEqual(641);
});

test('dialog remains operable with reduced motion and RTL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo/');
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  await page.getByRole('button', { name: 'Show Confirm' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Please confirm' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.fd-dialog__footer')).toHaveCSS('flex-direction', 'row-reverse');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('a negative draggable initialPosition is applied instead of being clamped to zero', async ({
  page,
}) => {
  await page.goto('/demo/');
  const position = await page.evaluate(() => {
    const forgeDialog = (window as unknown as { ForgeDialog: typeof import('../src/index') })
      .ForgeDialog;
    const instance = forgeDialog.open({
      title: 'Negative position',
      message: 'Opens offset to the top-left of center.',
      draggable: { initialPosition: { x: -80, y: -40 } },
    });
    return instance.getPosition();
  });
  expect(position).toEqual({ x: -80, y: -40 });
});
