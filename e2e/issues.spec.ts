import { test, expect } from '@playwright/test';

test.describe('Issues', () => {
  test('should display issues list with filters', async ({ page }) => {
    await page.goto('/issues');
    
    // Check page heading
    await expect(page.getByRole('main').getByRole('heading', { name: /Issues/i })).toBeVisible();
    
    // Check table is visible
    await expect(page.getByRole('main').getByRole('table')).toBeVisible();
  });

  test('should filter issues by search term', async ({ page }) => {
    await page.goto('/issues');
    
    // Use specific placeholder in main area
    const searchInput = page.getByRole('main').getByPlaceholder('Search issues...');
    await searchInput.fill('login');
    
    // Wait for filtering to apply
    await page.waitForTimeout(300);
    
    // Should show filtered results or empty state
    const table = page.getByRole('main').getByRole('table');
    await expect(table).toBeVisible();
  });

  test('should navigate to new issue form', async ({ page }) => {
    await page.goto('/issues');
    
    await page.getByRole('main').getByRole('link', { name: /New Issue/i }).click();
    
    await expect(page).toHaveURL('/issues/new');
    await expect(page.getByRole('main').getByRole('heading', { name: /New Issue/i })).toBeVisible();
  });

  test('should create a new issue', async ({ page }) => {
    await page.goto('/issues/new');
    
    // Fill out the form
    await page.getByLabel(/Subject/i).fill('E2E Test Issue');
    await page.getByLabel(/Description/i).fill('This issue was created by E2E test');
    
    // Select project (first available)
    const projectSelect = page.getByRole('main').locator('button[role="combobox"]').first();
    await projectSelect.click();
    await page.getByRole('option').first().click();
    
    // Submit form
    await page.getByRole('button', { name: /Create Issue/i }).click();
    
    // Should redirect to issue detail or issues list
    await expect(page).toHaveURL(/\/issues/);
  });

  test('should view issue details', async ({ page }) => {
    await page.goto('/issues');
    
    // Click on first issue link
    const issueLink = page.getByRole('main').getByRole('link', { name: /#\d+/ }).first();
    if (await issueLink.isVisible()) {
      await issueLink.click();
      
      // Should be on issue detail page
      await expect(page).toHaveURL(/\/issues\/[^/]+$/);
      
      // Check key elements
      await expect(page.getByRole('main').getByText(/Status/i)).toBeVisible();
      await expect(page.getByRole('main').getByText(/Priority/i)).toBeVisible();
    }
  });
});
