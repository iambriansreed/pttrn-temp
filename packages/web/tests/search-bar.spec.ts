import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/SearchBar/spec';
import { mount } from './mount';
import { describeBehaviors } from './spec';

const ITEMS = ['Apple Pie', 'Apple Tart', 'Banana Split', 'Cherry Tart'];

/** A search bar named "Desserts" with the four items, plus `attributes`. */
const searchBar = (attributes = '', items = ITEMS) =>
    `<div style="width: 320px"><pttrn-search-bar aria-label="Desserts" name="dessert" ${attributes}>${items
        .map((label) => `<pttrn-search-bar-item label="${label}"></pttrn-search-bar-item>`)
        .join('')}</pttrn-search-bar></div>`;

const DESSERTS = [
    'Apple Pie',
    'Banana Split',
    'Cherry Tart',
    'Dragonfruit Sorbet',
    'Elderberry Jam',
    'Fig Newton',
    'Grape Soda',
    'Honeydew Smoothie',
    'Ice Cream Sandwich',
    'Jackfruit Pudding',
];

/** Mirrors `packages/react/src/components/SearchBar/SearchBarExample.tsx` (its default items) and the field case. */
const PRESETS = {
    Default: searchBar('aria-label="search bar aria-label"', DESSERTS),
    Field: `<div style="width: 320px"><pttrn-search-bar label="Dessert" helper-text="Search the menu" name="dessert">${DESSERTS.map(
        (label) => `<pttrn-search-bar-item label="${label}"></pttrn-search-bar-item>`,
    ).join('')}</pttrn-search-bar></div>`,
};

const field = (page: Page) => page.getByRole('combobox', { name: 'Desserts' });
const listbox = (page: Page) => page.getByRole('listbox', { name: 'Search results' });
const active = (page: Page) =>
    page.locator('pttrn-search-bar').evaluate((host) => {
        const input = host.shadowRoot!.querySelector('input')!;
        const id = input.getAttribute('aria-activedescendant');
        return id ? host.shadowRoot!.getElementById(id)?.textContent?.trim() : null;
    });
const options = (page: Page) => page.getByRole('option').filter({ hasNot: page.locator('[aria-disabled]') });

/** Collects the `detail` of every `pttrn-change`. */
async function recordChanges(page: Page) {
    await page.evaluate(() => {
        const seen: unknown[] = [];
        (window as unknown as { seen: unknown[] }).seen = seen;
        document.addEventListener('pttrn-change', (event) => seen.push((event as CustomEvent).detail));
    });
    return () => page.evaluate(() => (window as unknown as { seen: { value: string; item?: object }[] }).seen);
}

test.describe('pttrn-search-bar', () => {
    test('submits the text with a form', async ({ page }) => {
        await mount(page, `<form>${searchBar()}</form>`);
        await field(page).fill('Apple');
        expect(await page.evaluate(() => [...new FormData(document.querySelector('form')!).entries()])).toEqual([
            ['dessert', 'Apple'],
        ]);
    });

    test('the list sits under the field at its width, and closes when focus leaves', async ({ page }) => {
        await mount(page, `<button>Before</button>${searchBar()}`);
        await field(page).pressSequentially('a');
        await expect(listbox(page)).toBeVisible();
        const box = (await page.locator('pttrn-search-bar [data-pttrn="input"]').boundingBox())!;
        const list = (await listbox(page).boundingBox())!;
        expect(list.width).toBeCloseTo(box.width, 0);
        expect(list.y).toBeCloseTo(box.y + box.height + 4, 0);

        await page.getByRole('button', { name: 'Before' }).click();
        await expect(field(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(listbox(page)).toBeHidden();
    });

    test('the list opens above the field when there is no room below', async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 400 });
        await mount(page, `<div style="position: fixed; bottom: 8px; left: 8px">${searchBar()}</div>`);
        await field(page).pressSequentially('a');
        const box = (await page.locator('pttrn-search-bar [data-pttrn="input"]').boundingBox())!;
        const list = (await listbox(page).boundingBox())!;
        expect(list.y + list.height).toBeCloseTo(box.y - 4, 0);
    });

    test('ArrowDown opens every result from an empty field', async ({ page }) => {
        await mount(page, searchBar());
        await field(page).focus();
        await expect(field(page)).toHaveAttribute('aria-expanded', 'false');
        await page.keyboard.press('ArrowDown');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(options(page)).toHaveCount(4);
        expect(await active(page)).toBe('Apple Pie');
    });

    test('scroll-limit caps the list height', async ({ page }) => {
        await mount(page, searchBar('scroll-limit="2"'));
        await field(page).focus();
        await page.keyboard.press('ArrowDown');
        const list = (await listbox(page).boundingBox())!;
        expect(list.height).toBeLessThanOrEqual(2 * 52 + 2);
        expect(await listbox(page).evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    });
});

describeBehaviors(spec, {
    combobox: async ({ page }) => {
        await mount(page, searchBar());
        await expect(field(page)).toHaveAttribute('aria-autocomplete', 'list');
        await expect(field(page)).toHaveAttribute('aria-haspopup', 'listbox');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(field(page)).not.toHaveAttribute('aria-controls');
        await expect(field(page)).toHaveAttribute('placeholder', 'Search');
    },
    filters: async ({ page }) => {
        await mount(page, searchBar());
        await field(page).pressSequentially('TART');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(listbox(page)).toBeVisible();
        await expect(field(page)).toHaveAttribute('aria-controls', (await listbox(page).getAttribute('id'))!);
        await expect(options(page)).toHaveText(['Apple Tart', 'Cherry Tart']);
        expect(await active(page)).toBe('Apple Tart');
    },
    'text-editing': async ({ page }) => {
        await mount(page, searchBar());
        await field(page).pressSequentially('Apple Pie');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.type('X');
        await expect(field(page)).toHaveValue('Apple XPie');
        await page.keyboard.press('Space');
        await expect(field(page)).toHaveValue('Apple X Pie');
    },
    'arrow-keys': async ({ page }) => {
        await mount(page, searchBar());
        await field(page).pressSequentially('a');
        expect(await active(page)).toBe('Apple Pie');
        await page.keyboard.press('ArrowDown');
        expect(await active(page)).toBe('Apple Tart');
        await page.keyboard.press('ArrowUp');
        expect(await active(page)).toBe('Apple Pie');
        await page.keyboard.press('ArrowUp');
        expect(await active(page)).toBe('Cherry Tart');
    },
    choose: async ({ page }) => {
        await mount(page, searchBar());
        const log = await recordChanges(page);
        await field(page).pressSequentially('cher');
        expect(await active(page)).toBe('Cherry Tart');
        await page.keyboard.press('Enter');
        await expect(field(page)).toHaveValue('Cherry Tart');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'false');
        expect((await log()).at(-1)).toEqual({ value: 'Cherry Tart', item: { label: 'Cherry Tart' } });

        await field(page).fill('');
        await field(page).pressSequentially('ban');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'true');
        await page.getByRole('option', { name: 'Banana Split' }).click();
        await expect(field(page)).toHaveValue('Banana Split');
        await expect(field(page)).toBeFocused();
        await expect(field(page)).toHaveAttribute('aria-expanded', 'false');
        expect((await log()).at(-1)).toEqual({ value: 'Banana Split', item: { label: 'Banana Split' } });
    },
    'escape-closes': async ({ page }) => {
        await mount(page, searchBar());
        await field(page).pressSequentially('a');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'true');
        await page.keyboard.press('Escape');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(field(page)).toBeFocused();
        await page.keyboard.type('p');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'true');
    },
    'no-results': async ({ page }) => {
        await mount(page, searchBar('no-results-message="Try another dessert"'));
        await field(page).pressSequentially('zzz');
        await expect(field(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(listbox(page).getByText('No results found')).toBeVisible();
        await expect(listbox(page).getByText('Try another dessert')).toBeVisible();
        const row = page.getByRole('option', { name: /No results found/ });
        await expect(row).toHaveAttribute('aria-disabled', 'true');
        expect(await active(page)).toContain('No results found');
        const live = page.locator('pttrn-search-bar [aria-live]');
        await expect(live).toHaveText('No results found');
        await expect(live).toHaveAttribute('aria-live', 'assertive');
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            let results = await new AxeBuilder({ page }).include('pttrn-search-bar').analyze();
            expect(results.violations).toEqual([]);

            await page.getByRole('combobox').pressSequentially('a');
            await expect(page.getByRole('listbox')).toBeVisible();
            results = await new AxeBuilder({ page }).include('pttrn-search-bar').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
