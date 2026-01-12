import { test, expect } from '@playwright/test';

test.describe('Time Tracking', () => {
  test('should display time entries list', async ({ page }) => {
    await page.goto('/time');
    
    // Check page heading
    await expect(page.getByRole('main').getByRole('heading', { name: /Time/i })).toBeVisible();
    
    // Check table is visible
    await expect(page.getByRole('main').getByRole('table')).toBeVisible();
  });

  test('should navigate to log time form', async ({ page }) => {
    await page.goto('/time');
    
    await page.getByRole('main').getByRole('link', { name: /Log Time/i }).click();
    
    await expect(page).toHaveURL('/time/new');
    await expect(page.getByRole('main').getByRole('heading', { name: /Log Time/i })).toBeVisible();
  });

  test('should fill log time form', async ({ page }) => {
    await page.goto('/time/new');
    
    // Select an issue (first available)
    const issueSelect = page.getByRole('main').locator('button[role="combobox"]').first();
    await issueSelect.click();
    await page.getByRole('option').first().click();
    
    // Fill hours
    await page.getByLabel(/Hours/i).fill('2');
    
    // Fill comments
    await page.getByLabel(/Comments/i).fill('E2E test time entry');
    
    // Form should be filled (we don't submit to avoid test data pollution)
    await expect(page.getByLabel(/Hours/i)).toHaveValue('2');
  });
});
