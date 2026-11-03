import { test, expect, Page } from '@playwright/test';

import { components, gotoUrl } from './utils';

/**
 * Every page renders its content as content:
 *
 * - No page prints "[object Object]", the mark of an element passed where text was expected. Pages with a Web Component
 *   tab are checked on that tab too, since its content renders only once the tab is open.
 * - Prose lists (markdown pages, descriptions, the typography page) hang their markers in a gutter inside the text
 *   column, as USWDS prose does: padding on the list and markers outside the text. A list with no padding pushes its
 *   bullets out past the column; an inside marker leaves wrapped lines flush with the number.
 */
const PAGES = [
    '/',
    '/get-started',
    '/components',
    '/tokens',
    '/styles',
    '/typography',
    '/figma-plugin',
    '/ai-readiness',
    '/contributing',
    '/guidelines',
    '/governance',
    '/changelog',
    '/hooks',
    ...components.map((component) => `/${component.slug}`),
];

async function objectObjectText(page: Page) {
    return page.evaluate(() =>
        [...document.querySelectorAll('[data-main] *')]
            .filter((element) =>
                [...element.childNodes].some(
                    (child) => child.nodeType === Node.TEXT_NODE && child.textContent?.includes('[object Object]'),
                ),
            )
            .map((element) => element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '')),
    );
}

for (const path of PAGES) {
    test(`${path} renders its content`, async ({ page }) => {
        await gotoUrl(page, path);

        expect.soft(await objectObjectText(page), 'no "[object Object]"').toEqual([]);

        // Components without a web component show the tab disabled.
        const webComponentTab = page.locator('[role="tab"][data-value="web-component"]:not([aria-disabled="true"])');
        if (await webComponentTab.count()) {
            await webComponentTab.first().click();
            await expect(webComponentTab.first()).toHaveAttribute('aria-selected', 'true');
            await page.waitForLoadState('networkidle');
            expect.soft(await objectObjectText(page), 'no "[object Object]" on the Web Component tab').toEqual([]);
        }

        const badLists = await page.evaluate(() =>
            [...document.querySelectorAll('[data-prose] > ul, [data-prose] > ol')]
                .filter((list) => {
                    const style = getComputedStyle(list);
                    return parseFloat(style.paddingLeft) < 8 || style.listStylePosition !== 'outside';
                })
                .map((list) => `${list.tagName.toLowerCase()}: ${list.textContent?.trim().slice(0, 40)}`),
        );

        expect(badLists, 'prose lists hang their markers inside the text column').toEqual([]);
    });
}
