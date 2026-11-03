import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/PageControl/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const control = (currentPage: number, numPages: number, extra = '') =>
    `<pttrn-page-control current-page="${currentPage}" num-pages="${numPages}" ${extra}></pttrn-page-control>`;

/** Mirrors the presets in `packages/react/src/components/PageControl/PageControlExample.tsx`. */
const PRESETS = {
    '6 pages, on page 2': control(2, 6),
    '5 pages, on page 1': control(1, 5),
    '10 pages, on page 10': control(10, 10),
};

const dots = (page: Page) => page.locator('pttrn-page-control [data-dot]');
const attributes = (page: Page, name: string) =>
    dots(page).evaluateAll((list, attr) => list.map((dot) => dot.getAttribute(attr)), name);

describeBehaviors(spec, {
    'image-label': async ({ page }) => {
        await mount(page, control(2, 4));
        await expect(page.getByRole('img', { name: 'Page 2 of 4' })).toBeVisible();
        await page.locator('pttrn-page-control').evaluate((el) => el.setAttribute('current-page', '3'));
        await expect(page.getByRole('img', { name: 'Page 3 of 4' })).toBeVisible();
    },
    dots: async ({ page }) => {
        await mount(page, control(2, 4));
        await expect(dots(page)).toHaveCount(4);
        expect(await attributes(page, 'data-size')).toEqual(['medium', 'medium', 'medium', 'medium']);
        await expect(page.locator('pttrn-page-control [data-dot][data-active]')).toHaveCount(1);
        await expect(dots(page).nth(1)).toHaveAttribute('data-active');
        expect(await attributes(page, 'aria-hidden')).toEqual(['true', 'true', 'true', 'true']);
        // The active dot is the primary color, the others the light base color.
        const colors = await dots(page).evaluateAll((list) => list.map((dot) => getComputedStyle(dot).backgroundColor));
        expect(new Set(colors).size).toBe(2);
        expect(colors[1]).not.toBe(colors[0]);
    },
    window: async ({ page }) => {
        const element = page.locator('pttrn-page-control');
        await mount(page, control(5, 10));
        await expect(dots(page)).toHaveCount(5);
        expect(await attributes(page, 'data-dot')).toEqual(['2', '3', '4', '5', '6']);
        expect(await attributes(page, 'data-size')).toEqual(['x-small', 'small', 'medium', 'small', 'x-small']);
        await expect(dots(page).nth(2)).toHaveAttribute('data-active');
        expect(await dots(page).evaluateAll((list) => list.map((dot) => dot.getBoundingClientRect().width))).toEqual([
            4, 6, 8, 6, 4,
        ]);

        await element.evaluate((el) => el.setAttribute('current-page', '1'));
        await expect(dots(page).first()).toHaveAttribute('data-active');
        expect(await attributes(page, 'data-dot')).toEqual(['0', '1', '2', '3', '4']);
        expect(await attributes(page, 'data-size')).toEqual(['medium', 'medium', 'medium', 'small', 'x-small']);

        await element.evaluate((el) => el.setAttribute('current-page', '10'));
        await expect(dots(page).nth(4)).toHaveAttribute('data-active');
        expect(await attributes(page, 'data-dot')).toEqual(['5', '6', '7', '8', '9']);
        expect(await attributes(page, 'data-size')).toEqual(['x-small', 'small', 'medium', 'medium', 'medium']);
    },
    invalid: async ({ page }) => {
        for (const html of [control(1, 1), control(0, 3), control(4, 3), '<pttrn-page-control></pttrn-page-control>']) {
            await mount(page, html);
            await expect(page.getByRole('img')).toHaveCount(0);
            expect(await page.locator('pttrn-page-control').evaluate((el) => el.shadowRoot!.children.length)).toBe(0);
        }
    },
    variants: async ({ page }) => {
        await mount(page, control(1, 3));
        await expect(page.locator('pttrn-page-control')).toHaveAttribute('variant', 'flat');
        await expect(page.locator('pttrn-page-control [data-pttrn="page-control"]')).toHaveAttribute(
            'data-variant',
            'flat',
        );
        await expect(page.getByRole('img')).toHaveCSS('box-shadow', 'none');

        await mount(page, control(1, 3, 'variant="floating"'));
        await expect(page.locator('pttrn-page-control [data-pttrn="page-control"]')).toHaveAttribute(
            'data-variant',
            'floating',
        );
        await expect(page.getByRole('img')).not.toHaveCSS('box-shadow', 'none');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-page-control').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
