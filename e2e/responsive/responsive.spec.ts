import { test, expect } from '../fixtures/test';

test.describe('Responsive Navigation & Layout', () => {
  test('W21: Page renders cleanly on mobile screen without horizontal blowout', async ({ page }) => {
    await page.goto('/');
    const viewportSize = page.viewportSize();
    expect(viewportSize).toBeDefined();

    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Verify page scrollWidth is roughly within viewportWidth
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 5;
    });
    expect(isOverflowing).toBe(false);
  });
});

