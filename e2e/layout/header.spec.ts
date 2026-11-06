import { test, expect } from '../fixtures/test';

test.describe('Header & Navigation parity', () => {
  test('Breadcrumbs display route title and track navigation', async ({ page }) => {
    await page.goto('/dashboard');
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Dashboard')).toBeVisible();

    await page.goto('/doctors');
    await expect(breadcrumb.getByText('Doctors')).toBeVisible();

    await page.goto('/patients');
    await expect(breadcrumb.getByText('Patients')).toBeVisible();

    await page.goto('/overlays');
    await expect(breadcrumb.getByText('Dialogs & States')).toBeVisible();
  });

  test('Theme switcher toggles dark mode class on document and persists', async ({ page }) => {
    await page.goto('/dashboard');

    // Locate theme toggle button in header
    const themeBtn = page.getByRole('button', { name: /Switch to (dark|light) theme/i }).first();
    await expect(themeBtn).toBeVisible();

    // Read initial dark class
    const initialIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Click theme button
    await themeBtn.click();

    // Verify dark class toggled
    const afterFirstClick = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterFirstClick).toBe(!initialIsDark);

    // Verify localStorage persistence
    const themeStorage = await page.evaluate(() => localStorage.getItem('theme'));
    expect(themeStorage).toBe(afterFirstClick ? 'dark' : 'light');

    // Toggle back
    await themeBtn.click();
    const afterSecondClick = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterSecondClick).toBe(initialIsDark);
  });

  test('User menu dropdown opens, displays details, and handles dismissals', async ({ page }) => {
    await page.goto('/dashboard');

    const userMenuBtn = page.getByRole('button', { name: 'Open user menu' });
    await expect(userMenuBtn).toBeVisible();

    // Initially menu is closed
    const menu = page.getByRole('menu', { name: 'Account' });
    await expect(menu).not.toBeVisible();

    // Open user menu
    await userMenuBtn.click();
    await expect(menu).toBeVisible();

    // Verify user details and actions inside menu
    await expect(menu.getByText(/Nadia Islam|Admin User/i)).toBeVisible();
    await expect(menu.getByText(/admin@/i)).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /Log out/i })).toBeVisible();

    // Dismiss with Escape key
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();

    // Open again and dismiss by clicking outside
    await userMenuBtn.click();
    await expect(menu).toBeVisible();
    await page.getByRole('main').click({ position: { x: 10, y: 10 } });
    await expect(menu).not.toBeVisible();
  });

  test('Mobile navigation drawer operates cleanly on small screens', async ({ page }) => {
    // Set viewport to mobile size (< 1024px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    const openDrawerBtn = page.getByRole('button', { name: 'Open navigation' });
    await expect(openDrawerBtn).toBeVisible();

    // Open drawer
    await openDrawerBtn.click();

    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText('Doctor Tracker')).toBeVisible();

    // Verify solid white background and full viewport height
    const bgColor = await drawer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe('rgb(255, 255, 255)');

    const boundingBox = await drawer.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(667);

    // Check links and badges inside drawer
    const doctorsLink = drawer.getByRole('link', { name: /Doctors/i });
    await expect(doctorsLink).toBeVisible();

    // Close via close button
    const closeBtn = drawer.getByRole('button', { name: 'Close navigation' });
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();

    // Open again and click a link to navigate
    await openDrawerBtn.click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: /Patients/i }).click();

    await expect(page).toHaveURL(/\/patients/);
    await expect(drawer).not.toBeVisible();
  });
});

