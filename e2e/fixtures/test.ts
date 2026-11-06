import { test as base, expect } from '@playwright/test';

export const test = base.extend<{
  resetStorage: void;
}>({
  resetStorage: [
    async ({ context }, use) => {
      // Provide valid session cookie for tests to access protected portal routes
      await context.addCookies([
        {
          name: 'dt_session',
          value: '1',
          domain: 'localhost',
          path: '/',
        },
        {
          name: 'dt_session',
          value: '1',
          domain: '127.0.0.1',
          path: '/',
        },
      ]);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
