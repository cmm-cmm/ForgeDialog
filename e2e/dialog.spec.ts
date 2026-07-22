import { expect, test } from '@playwright/test';

test('alert traps focus, closes with Escape, and restores focus', async ({ page }) => {
  await page.goto('/demo/');
  const trigger = page.getByRole('button', { name: 'Show Alert' });
  await trigger.click();

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
