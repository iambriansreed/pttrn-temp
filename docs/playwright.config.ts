import { defineConfig, devices } from '@playwright/test';

/**
 * Docs site tests.
 *
 * - `npm test` runs the regular suite (console errors and examples on every page, component behavior).
 * - `npm run test:a11y` (PTTRN_A11Y=1) runs the accessibility matrix instead: axe on every component's main example, in
 *   every theme, or only the theme named by PTTRN_THEME. CI runs one job per theme.
 * - `npm run test:visual` (PTTRN_VISUAL=1) runs the visual regression suite instead: a screenshot of every component's
 *   main example in every theme against the baselines in `tests/visual/__screenshots__`. `npm run test:visual:update`
 *   rewrites the baselines (on Linux, the platform CI renders on).
 * - The site under test is `dist`, served by `vite preview`. Build it first (`npm run build:docs` at the root). Set
 *   TEST_URL to test an already running server instead (`npm run test:dev` targets the dev server).
 * - PLAYWRIGHT_CHROMIUM_EXECUTABLE points the tests at a Chromium that is already on the machine, for environments that
 *   cannot download the browser Playwright pins. CI leaves it unset and installs the pinned browser.
 */
const PORT = 8055;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const a11y = !!process.env.PTTRN_A11Y;
const visual = !!process.env.PTTRN_VISUAL;
const baseURL = process.env.TEST_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
    testDir: './tests',
    testMatch: a11y
        ? ['**/tests/intensive/**/*.spec.ts']
        : visual
          ? ['**/tests/visual/**/*.spec.ts']
          : ['**/tests/*.spec.ts', '**/tests/components/**/*.spec.ts'],
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // A visual difference is deterministic; retrying it only hides flakes in the baselines.
    retries: process.env.CI && !visual ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
    // One baseline per screenshot name, with no platform or project suffix: CI and the update workflow both render on
    // Linux, which is the only platform the baselines are valid for.
    snapshotPathTemplate: '{testDir}/visual/__screenshots__/{arg}{ext}',
    expect: {
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            scale: 'css',
            // Antialiasing differs slightly between Chromium builds; a real change moves far more pixels than this.
            maxDiffPixelRatio: 0.002,
        },
    },
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
