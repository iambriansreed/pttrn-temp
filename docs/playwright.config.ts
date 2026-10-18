import { defineConfig, devices } from '@playwright/test';

/**
 * Docs site tests.
 *
 * - `npm test` runs the regular suite (console errors and examples on every page, component behavior).
 * - `npm run test:a11y` (PTTRN_A11Y=1) runs the accessibility matrix instead: axe on every component's main example, in
 *   every theme, or only the theme named by PTTRN_THEME. CI runs one job per theme.
 * - The site under test is `dist`, served by `vite preview`. Build it first (`npm run build:docs` at the root). Set
 *   TEST_URL to test an already running server instead (`npm run test:dev` targets the dev server).
 * - PLAYWRIGHT_CHROMIUM_EXECUTABLE points the tests at a Chromium that is already on the machine, for environments that
 *   cannot download the browser Playwright pins. CI leaves it unset and installs the pinned browser.
 */
const PORT = 8055;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const a11y = !!process.env.PTTRN_A11Y;
const baseURL = process.env.TEST_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
    testDir: './tests',
    testMatch: a11y ? ['**/tests/intensive/**/*.spec.ts'] : ['**/tests/*.spec.ts', '**/tests/components/**/*.spec.ts'],
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
    use: {
        baseURL,
        trace: 'on-first-retry',
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
    },
    webServer: process.env.TEST_URL
        ? undefined
        : {
              command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
              url: baseURL,
              reuseExistingServer: !process.env.CI,
              timeout: 60_000,
          },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
