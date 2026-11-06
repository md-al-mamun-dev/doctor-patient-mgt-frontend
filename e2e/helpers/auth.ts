import { type Page } from '@playwright/test';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  // Fill credentials if login form fields are available
  const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
  const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
  const submitButton = page.getByRole('button', { name: /sign in|log in/i });

  if (await emailInput.count() > 0 && await submitButton.count() > 0) {
    await emailInput.fill('admin@doctortracker.dev');
    await passwordInput.fill('ChangeMe123!');
    await submitButton.click();
  }
}

