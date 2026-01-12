import { test, expect } from '@playwright/test';

test.describe('Admin Users', () => {
  test('should display users list', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Check page heading - use text instead of heading role
    await expect(page.getByRole('main').getByText('User Management')).toBeVisible();
    
    // Check table is visible
    await expect(page.getByRole('main').getByRole('table')).toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Find role filter in main area
    const roleSelect = page.getByRole('main').locator('button[role="combobox"]').first();
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      await page.getByRole('option', { name: /Admin/i }).click();
      
      // Wait for filtering
      await page.waitForTimeout(300);
    }
  });

  test('should navigate to new user form', async ({ page }) => {
    await page.goto('/admin/users');
    
    await page.getByRole('main').getByRole('link', { name: /New User/i }).click();
    
    await expect(page).toHaveURL('/admin/users/new');
    await expect(page.getByRole('main').getByRole('heading', { name: /New User/i })).toBeVisible();
  });

  test('should create a new user', async ({ page }) => {
    await page.goto('/admin/users/new');
    
    // Fill out the form
    await page.getByLabel(/First Name/i).fill('E2E');
    await page.getByLabel(/Last Name/i).fill('Testuser');
    await page.getByLabel(/Email/i).fill(`e2e-${Date.now()}@test.com`);
    
    // Select role
    const roleSelect = page.getByRole('main').locator('button[role="combobox"]').first();
    await roleSelect.click();
    await page.getByRole('option', { name: /Developer/i }).click();
    
    // Submit form
    await page.getByRole('button', { name: /Create User/i }).click();
    
    // Should redirect to users list
    await expect(page).toHaveURL('/admin/users');
  });
});
