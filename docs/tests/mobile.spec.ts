import { test, expect } from '@playwright/test';

import { components, gotoUrl } from './utils';

/**
 * The docs work on a phone: no page scrolls sideways at 375px wide, and the menu opens the navigation. A failure names
 * the element that widens the page, found by hiding elements top-down until the page fits.
 */
const PAGES = [
    '/',
    '/get-started',
    '/components',
    '/icons',
    '/tokens',
    '/styles',
    '/typography',
    '/figma-plugin',
    '/contributing',
    '/guidelines',
    '/colors',
    '/hooks',
    ...components.map((component) => `/${component.slug}`),
];

test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

for (const path of PAGES) {
    test(`${path} fits a 375px screen`, async ({ page }) => {
        await gotoUrl(page, path);
        await page.waitForLoadState('networkidle');

        const overflow = await page.evaluate(() => {
            const fits = () => document.documentElement.scrollWidth <= document.documentElement.clientWidth;
            if (fits()) return null;
            const describe = (el: Element) =>
                el.tagName.toLowerCase() +
                [...el.attributes]
                    .filter((a) => a.name.startsWith('data-') || a.name === 'id')
                    .map((a) => `[${a.name}${a.value && a.value !== 'true' ? `="${a.value.slice(0, 30)}"` : ''}]`)
                    .join('');
            const chain: string[] = [];
            let node: Element = document.body;
            for (;;) {
                const culprit = [...node.children].find((child) => {
                    const element = child as HTMLElement;
                    const previous = element.style.display;
                    element.style.display = 'none';
                    const fixed = fits();
                    element.style.display = previous;
                    return fixed;
                });
                if (!culprit) break;
                chain.push(describe(culprit));
                node = culprit;
            }
            return `page is ${document.documentElement.scrollWidth}px wide; widened by ${chain.join(' > ')}`;
        });

        expect(overflow, 'no horizontal scrolling').toBeNull();
    });
}

test('the menu opens the navigation on a phone', async ({ page }) => {
    await gotoUrl(page, '/');

    await page.getByRole('button', { name: 'Menu' }).click();
    const navigation = page.getByRole('dialog', { name: 'Navigation' });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole('menuitem').first()).toBeVisible();
});
