import { test, expect } from '@playwright/test';

import reactPackage from '../../packages/react/package.json' with { type: 'json' };
import { gotoUrl } from './utils';

/**
 * The site header says which version of the library the site documents, read from the package at build time, and links
 * to the changelog. On a phone the version stays, under the site name, without crowding the buttons.
 */
const documented = `@ptrn/react ${reactPackage.version}`;

test('the header names the documented version and links to the changelog', async ({ page }) => {
    await gotoUrl(page, '/get-started');

    await expect(page.locator('[data-version]')).toHaveText(`Documents ${documented}`);

    await page.getByRole('link', { name: documented }).click();

    await expect(page).toHaveURL(/\/changelog$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Changelog' })).toBeVisible();
    await expect(page.locator('[data-main] table').getByRole('row', { name: /@ptrn\/react/ })).toContainText(
        reactPackage.version,
    );
});

test.describe('on a 320px screen', () => {
    test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true });

    test('the header keeps the name, the version and its buttons apart', async ({ page }) => {
        await gotoUrl(page, '/get-started');

        const version = page.getByRole('link', { name: documented });
        await expect(version).toBeVisible();
        await expect(page.locator('[data-brand]')).toBeVisible();

        const boxes = await page.evaluate(() =>
            [
                '[data-header] > [data-pttrn="button"]',
                '[data-brand]',
                '[data-version]',
                '[data-navbar-right] > [data-pttrn="button"]',
            ].flatMap((selector) =>
                [...document.querySelectorAll(selector)]
                    .filter((element) => element.getBoundingClientRect().width > 0)
                    .map((element) => {
                        const { left, right, top, bottom } = element.getBoundingClientRect();
                        return { selector, left, right, top, bottom };
                    }),
            ),
        );

        const overlaps = boxes.flatMap((a, i) =>
            boxes
                .slice(i + 1)
                .filter(
                    (b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1,
                )
                .map((b) => `${a.selector} overlaps ${b.selector}`),
        );
        expect(overlaps).toEqual([]);
        expect(Math.max(...boxes.map((box) => box.right)), 'nothing runs past the screen').toBeLessThanOrEqual(320);
    });
});
