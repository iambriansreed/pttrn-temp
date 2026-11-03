import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Pagination/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const pagination = (numPages: number, value = 1, extra = '') =>
    `<pttrn-pagination num-pages="${numPages}" value="${value}" ${extra}></pttrn-pagination>`;

/** The React component has no example presets; these are the two layouts its suite checks with axe. */
const PRESETS = {
    'Page buttons': pagination(4, 1, 'aria-label="Results"'),
    'Page field': pagination(20, 5, 'aria-label="Results"'),
};

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

/** Records `pttrn-change` values on the page. */
const recordChanges = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { changes: number[] }).changes = [];
        document.addEventListener('pttrn-change', (event) =>
            (window as unknown as { changes: number[] }).changes.push((event as CustomEvent).detail.value),
        );
    });
const changes = (page: Page) => page.evaluate(() => (window as unknown as { changes: number[] }).changes);

test.describe('pttrn-pagination', () => {
    test('the current page button is primary and 32px square', async ({ page }) => {
        await mount(page, pagination(4, 2));
        const current = button(page, 'Page 2');
        const other = button(page, 'Page 1');
        expect(await current.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
            await other.evaluate((el) => getComputedStyle(el).backgroundColor),
        );
        const box = await current.boundingBox();
        expect([box!.width, box!.height]).toEqual([32, 32]);
    });

    test('previous and next show their label as a tooltip', async ({ page }) => {
        await mount(page, `<div style="padding: 60px">${pagination(4, 2)}</div>`);
        await button(page, 'Next page (3)').hover();
        await expect(page.getByRole('tooltip')).toHaveCount(1);
        await expect(page.getByText('Next page (3)')).toBeVisible();
    });

    test('updates value, and the field follows it', async ({ page }) => {
        await mount(page, pagination(20, 5));
        await button(page, 'Next page (6)').click();
        await expect(page.locator('pttrn-pagination')).toHaveAttribute('value', '6');
        await expect(page.getByRole('spinbutton')).toHaveValue('6');
        await page.locator('pttrn-pagination').evaluate((el) => el.setAttribute('value', '12'));
        await expect(page.getByRole('spinbutton')).toHaveValue('12');
    });

    test('text that is not a number restores the field', async ({ page }) => {
        await mount(page, pagination(20, 5));
        await recordChanges(page);
        const field = page.getByRole('spinbutton');
        await field.fill('');
        await field.press('Enter');
        await expect(field).toHaveValue('5');
        expect(await changes(page)).toEqual([]);
    });
});

describeBehaviors(spec, {
    'renders-pages': async ({ page }) => {
        await mount(page, pagination(4, 2));
        await expect(page.getByRole('group')).toBeVisible();
        for (const n of [1, 2, 3, 4]) await expect(button(page, `Page ${n}`)).toBeVisible();
        await expect(button(page, 'Page 2')).toHaveAttribute('aria-current', 'page');
        await expect(button(page, 'Page 1')).not.toHaveAttribute('aria-current');
        await expect(page.getByRole('spinbutton')).toHaveCount(0);
    },
    'previous-next': async ({ page }) => {
        await mount(page, pagination(4, 1));
        await recordChanges(page);
        await expect(button(page, 'First page')).toBeDisabled();
        await button(page, 'Next page (2)').click();
        expect(await changes(page)).toEqual([2]);

        await mount(page, pagination(4, 4));
        await recordChanges(page);
        await expect(button(page, 'Last page')).toBeDisabled();
        await button(page, 'Previous page (3)').click();
        expect(await changes(page)).toEqual([3]);
    },
    'click-page': async ({ page }) => {
        await mount(page, pagination(4, 1));
        await recordChanges(page);
        await button(page, 'Page 3').click();
        expect(await changes(page)).toEqual([3]);
        await expect(button(page, 'Page 3')).toHaveAttribute('aria-current', 'page');
    },
    'page-field': async ({ page }) => {
        await mount(page, `${pagination(20, 1)}<button type="button">After</button>`);
        await recordChanges(page);
        await expect(button(page, 'Page 1')).toHaveCount(0);
        const field = page.getByRole('spinbutton', { name: 'Page number' });
        await expect(field).toHaveValue('1');
        await expect(page.getByText('of 20')).toBeVisible();

        await field.fill('7');
        await field.press('Enter');
        expect((await changes(page)).at(-1)).toBe(7);

        await field.fill('99');
        await field.press('Enter');
        expect((await changes(page)).at(-1)).toBe(20);
        await expect(field).toHaveValue('20');

        await field.fill('3');
        await page.keyboard.press('Tab');
        expect((await changes(page)).at(-1)).toBe(3);

        await field.fill('-4');
        await field.press('Enter');
        expect((await changes(page)).at(-1)).toBe(1);
    },
    announces: async ({ page }) => {
        await mount(page, pagination(4, 1));
        await button(page, 'Page 3').click();
        const region = page.locator('[data-pttrn-aria-live]');
        await expect(region).toHaveText('Page 3 of 4');
        await expect(region).toHaveAttribute('aria-live', 'polite');
        await button(page, 'Next page (4)').click();
        await expect(region).toHaveCount(1);
        await expect(region).toHaveText('Page 4 of 4');
    },
    'single-page': async ({ page }) => {
        await mount(page, pagination(1, 1));
        await expect(page.getByRole('group')).toHaveCount(0);
        await expect(page.getByRole('button')).toHaveCount(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-pagination').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
