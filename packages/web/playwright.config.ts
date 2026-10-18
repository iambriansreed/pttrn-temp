import { defineConfig, devices } from '@playwright/test';

/**
 * PLAYWRIGHT_CHROMIUM_EXECUTABLE points the tests at a Chromium that is already on the machine, for environments that
 * cannot download the browser Playwright pins. CI leaves it unset and installs the pinned browser.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
