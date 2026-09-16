import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle('Tailspin Toys - Crowdfunding your new favorite game!');
  });

  test('should display the main heading', async ({ page }) => {
    // Check that the main page heading is present
    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Toys', exact: true })).toBeVisible();
  });

  test('should display the site branding in header', async ({ page }) => {
    // Check that the site branding is present in the header (no longer an h1)
    await expect(page.getByText('Tailspin Toys').first()).toBeVisible();
  });

  test('should display the welcome message', async ({ page }) => {
    // Check that the welcome message is present using more specific locator
    await expect(page.getByText('Find your next game! And maybe even back one! Explore our collection!')).toBeVisible();
  });
  
  test('should persist high contrast mode across reloads and navigation', async ({ page }) => {
    const contrastToggle = page.getByTestId('high-contrast-toggle');

    await test.step('Enable high contrast mode', async () => {
      await expect(contrastToggle).toHaveAttribute('aria-pressed', 'false');
      await contrastToggle.click();
      await expect(contrastToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
    });

    await test.step('Restore high contrast mode after a reload', async () => {
      await page.reload();
      await expect(page.getByTestId('high-contrast-toggle')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
    });

    await test.step('Keep high contrast mode while navigating', async () => {
      await page.getByRole('link', { name: 'About' }).click();
      await expect(page).toHaveURL(/\/about$/);
      await expect(page.getByTestId('high-contrast-toggle')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
    });
  });

  test('should persist light mode independently from high contrast mode', async ({ page }) => {
    const contrastToggle = page.getByTestId('high-contrast-toggle');
    const lightModeToggle = page.getByTestId('light-mode-toggle');

    await test.step('Enable both modes', async () => {
      await expect(contrastToggle).toHaveAttribute('aria-pressed', 'false');
      await expect(lightModeToggle).toHaveAttribute('aria-pressed', 'false');
      await contrastToggle.click();
      await lightModeToggle.click();
      await expect(contrastToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(lightModeToggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
      await expect(page.locator('html')).toHaveClass(/light-mode/);
    });

    await test.step('Restore both modes after a reload', async () => {
      await page.reload();
      await expect(page.getByTestId('high-contrast-toggle')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('light-mode-toggle')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
      await expect(page.locator('html')).toHaveClass(/light-mode/);
    });

    await test.step('Disable light mode without disabling high contrast', async () => {
      await page.getByTestId('light-mode-toggle').click();
      await expect(page.getByTestId('light-mode-toggle')).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('high-contrast-toggle')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).not.toHaveClass(/light-mode/);
      await expect(page.locator('html')).toHaveClass(/high-contrast/);
    });
  });
});
