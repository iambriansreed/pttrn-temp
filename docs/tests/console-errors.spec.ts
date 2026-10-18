import { Page, test, expect } from '@playwright/test';

import { components, componentsWithDemo, gotoUrl } from './utils';

/** Collects console errors on a page, ignoring the 404s that missing optional assets produce. */
function collectConsoleErrors(page: Page) {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        if (msg.text().includes('404')) return;
        errors.push(msg.text());
    });
    return errors;
}

test('home page has no console errors', async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await gotoUrl(page, '/');

    expect(errors).toEqual([]);
});

for (const component of components) {
    test(`${component.name} page has no console errors`, async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await gotoUrl(page, `/${component.slug}`);

        expect(errors).toEqual([]);
    });
}

for (const component of componentsWithDemo) {
    test(`${component.name} page renders its demo`, async ({ page }) => {
        await gotoUrl(page, `/${component.slug}`);

        await expect(page.locator('[data-main-example] [data-example-render]').first()).toBeAttached();
    });
}
