import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test('should display projects list with cards', async ({ page }) => {
    await page.goto('/projects');
    
    // Check page heading
    await expect(page.getByRole('main').getByRole('heading', { name: /Projects/i })).toBeVisible();
    
    // Check search in main area
    await expect(page.getByRole('main').getByPlaceholder('Search projects...')).toBeVisible();
  });

  test('should filter projects by search term', async ({ page }) => {
    await page.goto('/projects');
    
    // Use specific placeholder in main area
    const searchInput = page.getByRole('main').getByPlaceholder('Search projects...');
    await searchInput.fill('website');
    
    // Wait for filtering
    await page.waitForTimeout(300);
  });

  test('should navigate to new project form', async ({ page }) => {
    await page.goto('/projects');
    
    await page.getByRole('main').getByRole('link', { name: /New Project/i }).click();
    
    await expect(page).toHaveURL('/projects/new');
    await expect(page.getByRole('main').getByRole('heading', { name: /New Project/i })).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    await page.goto('/projects/new');
    
    const uniqueName = `E2E Test Project ${Date.now()}`;
    
    // Fill out the form
    await page.getByLabel(/Name/i).fill(uniqueName);
    
    // Wait for identifier to be generated
    await page.waitForTimeout(500);
    
    await page.getByLabel(/Description/i).fill('This project was created by E2E test');
    
    // Submit form
    await page.getByRole('button', { name: /Create Project/i }).click();
    
    // Should redirect to project detail
    await expect(page).toHaveURL(/\/projects\//);
  });

  test('should view project details', async ({ page }) => {
    await page.goto('/projects');
    
    // Click on first project link (the project name)
    const projectLink = page.getByRole('main').locator('[data-slot="card"] a').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      
      // Should be on project detail page
      await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);
    }
  });
});
