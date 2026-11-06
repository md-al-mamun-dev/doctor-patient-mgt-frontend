import { type Page, expect } from '@playwright/test';

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

export async function verifyActivePage(page: Page, expectedHeadingRegex: RegExp): Promise<void> {
  const heading = page.getByRole('heading', { name: expectedHeadingRegex });
  await expect(heading).toBeVisible();
}

