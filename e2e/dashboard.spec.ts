import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display dashboard with stats and issues table', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Redmine Clone/);
    
    // Check stat cards are visible (use first() to avoid duplicates from table)
    await expect(page.getByText('Open Issues').first()).toBeVisible();
    await expect(page.getByText('Due This Week').first()).toBeVisible();
    await expect(page.getByText('Active Projects').first()).toBeVisible();
    
    // Check issues table is visible
    await expect(page.getByRole('main').getByRole('table')).toBeVisible();
  });

  test('should navigate to issues list from sidebar', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /Issues/i }).first().click();
    
    await expect(page).toHaveURL('/issues');
    await expect(page.getByRole('main').getByRole('heading', { name: /Issues/i })).toBeVisible();
  });

  test('should navigate to projects from sidebar', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /Projects/i }).first().click();
    
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('main').getByRole('heading', { name: /Projects/i })).toBeVisible();
  });
});
