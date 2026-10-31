import { test, expect } from '@playwright/test';

import { gotoUrl } from './utils';

/**
 * The USWDS fonts load. The console test ignores 404s, so a font stylesheet the browser cannot resolve would leave the
 * whole site in the fallback serif without failing anything; this test fails instead.
 */
test('the site loads Public Sans and uses it for body text', async ({ page }) => {
    const missing: string[] = [];
    page.on('response', (response) => {
        if (response.status() === 404 && /fontsource|\.woff2?($|\?)/.test(response.url())) missing.push(response.url());
    });

    await gotoUrl(page, '/');

    const loaded = await page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts]
            .filter((face) => face.status === 'loaded')
            .map((face) => face.family.replace(/"/g, ''));
    });

    expect(missing).toEqual([]);
    expect(loaded).toContain('Public Sans');
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Public Sans');
});
