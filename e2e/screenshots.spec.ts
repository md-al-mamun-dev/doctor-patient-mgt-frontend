import { test, expect } from './fixtures/test';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/assets/screenshots');

test.describe('Generate Visual Evidence Screenshots', () => {
  test('Capture Desktop Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Clinical Overview' })).toBeVisible();
    await page.waitForTimeout(500); // Allow charts/animations to settle
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-dashboard.png'),
      fullPage: false,
    });

    // 2. Doctors Directory
    await page.goto('/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors Directory' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-doctors.png'),
      fullPage: false,
    });

    // 3. Add Doctor Modal
    await page.getByTestId('btn-add-doctor').click();
    const dialog = page.getByRole('dialog', { name: 'Add Doctor' });
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-modal-doctor.png'),
      fullPage: false,
    });
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 4. Patients Directory
    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: 'Patient Directory' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'desktop-patients.png'),
      fullPage: false,
    });
  });

  test('Capture Mobile Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // 1. Mobile Dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Clinical Overview' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-dashboard.png'),
      fullPage: false,
    });

    // 2. Mobile Doctors Directory
    await page.goto('/doctors');
    await expect(page.getByRole('heading', { name: 'Doctors Directory' })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'mobile-doctors.png'),
      fullPage: false,
    });
  });
});
