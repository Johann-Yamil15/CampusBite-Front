import { test, expect } from '@playwright/test';

test('la aplicación CampusBite carga correctamente', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});