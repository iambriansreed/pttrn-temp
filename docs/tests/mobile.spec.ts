import { test, expect } from '@playwright/test';

import { components, gotoUrl } from './utils';

/**
 * The docs and the components work on a phone, at the 320px width WCAG's reflow criterion uses:
 *
 * - No page scrolls sideways. A failure names the element that widens the page, found by hiding elements top-down until
 *   the page fits.
 * - Every main example and variant fits its own box, so a component that cannot shrink fails even where its demo box
 *   would scroll. Components that scroll their content by design (Table, Carousel, a scrolling ChipGroup, code) are
 *   exempt, and so are touch targets, the invisible hit areas that may extend past a control.
 * - Segmented control labels stay inside their segments: a control that runs out of room wraps to another row instead of
 *   shrinking segments until labels overlap or get cut off.
 * - The menu opens the navigation.
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

test.use({ viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true });

for (const path of PAGES) {
    test(`${path} fits a 320px screen`, async ({ page }) => {
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
            const by = chain.length
                ? `widened by ${chain.join(' > ')}`
                : 'no element widens it, so look for a min-width on html or body';
            return `page is ${document.documentElement.scrollWidth}px wide; ${by}`;
        });

        // Soft, so a page that scrolls still reports which demos do not fit.
        expect.soft(overflow, 'no horizontal scrolling').toBeNull();

        const tooWide = await page.evaluate(() => {
            const describe = (el: Element) =>
                el.tagName.toLowerCase() +
                [...el.attributes]
                    .filter(
                        (a) => a.name.startsWith('data-pttrn') || a.name === 'data-size' || a.name === 'data-variant',
                    )
                    .map((a) => `[${a.name}="${a.value}"]`)
                    .join('');
            const exempt = (el: Element) =>
                el.matches('[data-touch-target]') ||
                !!el.closest(
                    '[data-pttrn="table"], [data-pttrn="carousel"], [data-pttrn="chip-group"][data-scroll], pre',
                );
            const problems: string[] = [];
            for (const box of document.querySelectorAll('[data-example-render], [data-option-render]')) {
                const edge = box.getBoundingClientRect().right;
                const widest = [...box.querySelectorAll('*')]
                    .filter((el) => !exempt(el) && getComputedStyle(el).position !== 'fixed')
                    .map((el) => ({ el, over: el.getBoundingClientRect().right - edge }))
                    .filter(({ over }) => over > 1)
                    .sort((a, b) => b.over - a.over)[0];
                if (widest) problems.push(`${describe(widest.el)} is ${Math.round(widest.over)}px wider than its demo`);
            }
            return problems;
        });

        expect.soft(tooWide, 'every demo fits its box').toEqual([]);

        const clippedLabels = await page.evaluate(() =>
            [...document.querySelectorAll('[data-pttrn="segmented-control"] li')]
                .filter((li) => {
                    const label = li.querySelector('[data-label]');
                    if (!label) return false;
                    const segment = li.getBoundingClientRect();
                    const text = label.getBoundingClientRect();
                    const cutOff = label.scrollWidth > label.clientWidth + 1;
                    return cutOff || text.left < segment.left - 1 || text.right > segment.right + 1;
                })
                .map((li) => li.textContent?.trim()),
        );

        expect(clippedLabels, 'segmented control labels fit their segments').toEqual([]);
    });
}

test('the menu opens the navigation on a phone', async ({ page }) => {
    await gotoUrl(page, '/');

    await page.getByRole('button', { name: 'Menu' }).click();
    const navigation = page.getByRole('dialog', { name: 'Navigation' });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole('menuitem').first()).toBeVisible();
});
