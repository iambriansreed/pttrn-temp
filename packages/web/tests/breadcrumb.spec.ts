import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/Breadcrumb/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const trail = (count: number, attributes = '') =>
    `<pttrn-breadcrumb ${attributes}>${Array.from(
        { length: count },
        (_, index) =>
            `<pttrn-breadcrumb-item label="Item ${index + 1}" href="#link-${index + 1}"></pttrn-breadcrumb-item>`,
    ).join('')}</pttrn-breadcrumb>`;

/** Mirrors the presets in `packages/react/src/components/Breadcrumb/BreadcrumbExample.tsx`. */
const PRESETS = {
    '1 Item (nothing visible)': trail(1),
    '2 Items (minimum)': trail(2),
    '5 Items': trail(5),
    '6 Items': trail(6),
    'NOT recommended': trail(15),
};

const overflow = (page: Page) => page.getByRole('button', { name: /more pages/ });

test.describe('pttrn-breadcrumb', () => {
    test('a click outside closes the menu', async ({ page }) => {
        await mount(page, trail(7));
        await overflow(page).click();
        await expect(page.getByRole('menu')).toBeVisible();
        await page.mouse.click(600, 400);
        await expect(page.getByRole('menu')).toHaveCount(0);
        await expect(overflow(page)).toHaveAttribute('aria-expanded', 'false');
    });

    test('tabbing out of the menu closes it', async ({ page }) => {
        await mount(page, `${trail(7)}<button type="button">After</button>`);
        await overflow(page).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('menuitem').first()).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('menu')).toHaveCount(0);
    });

    test('opens the menu under the button', async ({ page }) => {
        await mount(page, trail(7));
        await overflow(page).click();
        const [button, menu] = await Promise.all([overflow(page).boundingBox(), page.getByRole('menu').boundingBox()]);
        expect(menu!.y).toBeCloseTo(button!.y + button!.height + 4, 0);
        expect(menu!.x).toBeCloseTo(button!.x, 0);
    });

    test('scroll-limit caps the menu at that many items', async ({ page }) => {
        await mount(page, trail(15, 'scroll-limit="3"'));
        await overflow(page).click();
        const [menu, item] = await Promise.all([
            page.getByRole('menu').boundingBox(),
            page.getByRole('menuitem').first().boundingBox(),
        ]);
        expect(menu!.height).toBeCloseTo(item!.height * 3, 0);
    });

    test('follows changes to its items', async ({ page }) => {
        await mount(page, trail(3));
        await page
            .locator('pttrn-breadcrumb-item')
            .nth(1)
            .evaluate((el) => el.setAttribute('label', 'Renamed'));
        await expect(page.getByRole('link', { name: 'Renamed' })).toBeVisible();
        await page.locator('pttrn-breadcrumb').evaluate((el) => el.lastElementChild!.remove());
        await expect(page.getByRole('link')).toHaveCount(1);
        await expect(page.getByText('Renamed')).toBeVisible();
    });

    test('variant="subtle" draws the links as body text, underlined only on hover', async ({ page }) => {
        await mount(page, trail(3, 'variant="subtle"'));
        const link = page.getByRole('link').first();
        const body = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--theme-body-text-color').trim(),
        );
        await expect(link).toHaveCSS('text-decoration-line', 'none');
        const color = await link.evaluate((el) => getComputedStyle(el).color);
        const expected = await page.evaluate((value) => {
            const probe = document.createElement('span');
            probe.style.color = value;
            document.body.append(probe);
            return getComputedStyle(probe).color;
        }, body);
        expect(color).toBe(expected);
        await link.hover();
        await expect(link).toHaveCSS('text-decoration-line', 'underline');
    });
});

describeBehaviors(spec, {
    'needs-two': async ({ page }) => {
        await mount(page, PRESETS['1 Item (nothing visible)']);
        await expect(page.getByRole('navigation')).toHaveCount(0);
        await expect(page.getByText('Item 1')).toBeHidden();
    },
    landmark: async ({ page }) => {
        await mount(page, trail(3));
        const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
        await expect(nav).toBeVisible();
        await expect(nav.getByRole('list')).toBeVisible();
        await expect(nav.getByRole('listitem')).toHaveCount(3);
    },
    'links-and-current': async ({ page }) => {
        await mount(page, trail(3));
        await expect(page.getByRole('link', { name: 'Item 1' })).toHaveAttribute('href', '#link-1');
        await expect(page.getByRole('link', { name: 'Item 2' })).toHaveAttribute('href', '#link-2');
        await expect(page.getByRole('link', { name: 'Item 3' })).toHaveCount(0);
        await expect(page.getByRole('listitem').filter({ hasText: 'Item 3' })).toHaveAttribute('aria-current', 'true');
    },
    'overflow-menu': async ({ page }) => {
        await mount(page, trail(7));
        await expect(page.getByRole('link')).toHaveCount(1);
        await expect(overflow(page)).toHaveAccessibleName('Show 5 more pages');
        await expect(overflow(page)).toHaveAttribute('aria-haspopup', 'menu');
        await expect(overflow(page)).toHaveAttribute('aria-expanded', 'false');

        await overflow(page).click();
        const menu = page.getByRole('menu', { name: '5 more pages' });
        await expect(menu).toBeVisible();
        await expect(overflow(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(overflow(page)).toHaveAttribute('aria-controls', (await menu.getAttribute('id'))!);
        const items = page.getByRole('menuitem');
        await expect(items).toHaveText(['Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']);
        await expect(items.first()).toHaveAttribute('href', '#link-2');
    },
    'overflow-keyboard': async ({ page }) => {
        await mount(page, trail(7));
        await overflow(page).focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('menu')).toBeVisible();
        const items = page.getByRole('menuitem');
        await expect(items.nth(0)).toBeFocused();

        await page.keyboard.press('ArrowDown');
        await expect(items.nth(1)).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await expect(items.nth(0)).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await expect(items.nth(4)).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(items.nth(0)).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(page.getByRole('menu')).toHaveCount(0);
        await expect(overflow(page)).toBeFocused();

        for (const key of ['Enter', 'Space']) {
            await page.keyboard.press(key);
            await expect(items.nth(0)).toBeFocused();
            await page.keyboard.press('Escape');
            await expect(overflow(page)).toBeFocused();
        }
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-breadcrumb').analyze();
            expect(results.violations).toEqual([]);
        }

        await mount(page, trail(7));
        await overflow(page).click();
        await expect(page.getByRole('menu')).toBeVisible();
        const results = await new AxeBuilder({ page }).include('pttrn-breadcrumb').analyze();
        expect(results.violations).toEqual([]);
    },
});
