import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spec } from '../../react/src/components/ListItem/spec';
import { mount as mountQuirks } from './mount';
import { describeBehaviors } from './spec';

/**
 * Mounts in standards mode: the row is `height: 100%`, as in React, which in quirks mode (a page with no doctype)
 * stretches to the viewport.
 */
const mount = (page: Page, html: string) => mountQuirks(page, `<!doctype html>${html}`);

const AVATAR =
    '<span slot="leading" style="display:inline-block;width:40px;height:40px;border-radius:50%;background:#ccc"></span>';
const CHECKBOX = '<input slot="trailing" type="checkbox" aria-label="Checkbox demo" />';

/**
 * Mirrors the presets in `packages/react/src/components/ListItem/ListItemExample.tsx`, with plain HTML for the avatar
 * and checkbox.
 */
const PRESETS = {
    'Long Label': `<div style="width: 300px"><pttrn-list-item label="This is a really long label that should be truncated if it exceeds the width of the ListItem" sub-text="See below for other leading and trailing examples">${AVATAR}${CHECKBOX}</pttrn-list-item></div>`,
    'As Div':
        '<pttrn-list-item label="role = &quot;button&quot;" sub-text="aria-disabled = {true}" role="button" aria-disabled="true" clickable></pttrn-list-item>',
    'As Button':
        '<pttrn-list-item label="as=&quot;button&quot;" sub-text="Button example" clickable></pttrn-list-item>',
    'As Button Disabled':
        '<pttrn-list-item label="as=&quot;button&quot;" sub-text="Disabled button example" clickable disabled></pttrn-list-item>',
    'As Button Read Only':
        '<pttrn-list-item label="as=&quot;button&quot;" sub-text="Read only button example" clickable readonly></pttrn-list-item>',
};

const row = (page: Page) => page.locator('pttrn-list-item [data-pttrn="list-item"]');

/** Counts `click` events that reach a listener on the element. */
const countClicks = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { clicks: number }).clicks = 0;
        document.querySelector('pttrn-list-item')!.addEventListener('click', () => {
            (window as unknown as { clicks: number }).clicks += 1;
        });
    });
const clicks = (page: Page) => page.evaluate(() => (window as unknown as { clicks: number }).clicks);

test.describe('pttrn-list-item', () => {
    test('is 52px tall with 8px padding, as React', async ({ page }) => {
        await mount(page, '<pttrn-list-item label="File 13"></pttrn-list-item>');
        expect((await row(page).boundingBox())!.height).toBe(52);
        await expect(row(page)).toHaveCSS('padding', '8px');
    });

    test('a cut-short label shows whole in a tooltip on hover', async ({ page }) => {
        await mount(page, PRESETS['Long Label']);
        await page.locator('pttrn-list-item [data-item-label] [data-text]').hover();
        await expect(page.locator('pttrn-list-item [data-pttrn="tooltip"]')).toBeVisible();
    });

    test('a label that fits shows no tooltip', async ({ page }) => {
        await mount(page, '<pttrn-list-item label="Short"></pttrn-list-item>');
        await page.locator('pttrn-list-item [data-item-label] [data-text]').hover();
        await expect(page.locator('pttrn-list-item [data-pttrn="tooltip"]')).toBeHidden();
    });

    test('active and aria-selected highlight the row', async ({ page }) => {
        await mount(page, '<pttrn-list-item label="Open" clickable active></pttrn-list-item>');
        const base = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        await expect(row(page)).not.toHaveCSS('background-color', base);
        await mount(page, '<pttrn-list-item label="Option" role="option" aria-selected="true"></pttrn-list-item>');
        await expect(row(page)).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    });

    test('aria-label names the link or button', async ({ page }) => {
        await mount(page, '<pttrn-list-item label="Open" clickable aria-label="Open the file"></pttrn-list-item>');
        await expect(page.getByRole('button', { name: 'Open the file' })).toBeVisible();
    });
});

describeBehaviors(spec, {
    'renders-label': async ({ page }) => {
        await mount(page, '<pttrn-list-item label="File 13" sub-text="Last modified: Jan 21, 2024"></pttrn-list-item>');
        await expect(row(page)).toContainText('File 13');
        await expect(page.locator('pttrn-list-item [data-sub-text]')).toHaveText('Last modified: Jan 21, 2024');
        await expect(row(page)).not.toHaveAttribute('role');
        await expect(row(page)).toHaveAttribute('tabindex', '-1');
    },
    'leading-trailing': async ({ page }) => {
        await mount(
            page,
            '<pttrn-list-item label="File"><i slot="leading" data-testid="lead">L</i><b slot="trailing" data-testid="trail">T</b></pttrn-list-item>',
        );
        const [lead, label, trail] = await Promise.all([
            page.getByTestId('lead').boundingBox(),
            page.getByText('File').boundingBox(),
            page.getByTestId('trail').boundingBox(),
        ]);
        expect(lead!.x).toBeLessThan(label!.x);
        expect(trail!.x).toBeGreaterThan(label!.x);
        await expect(page.locator('pttrn-list-item [data-leading]')).toBeVisible();
        await mount(page, '<pttrn-list-item label="File"></pttrn-list-item>');
        await expect(page.locator('pttrn-list-item [data-leading]')).toBeHidden();
    },
    clickable: async ({ page }) => {
        await mount(page, '<pttrn-list-item label="Open" clickable></pttrn-list-item>');
        await countClicks(page);
        const button = page.getByRole('button', { name: 'Open' });
        await expect(button).toHaveAttribute('tabindex', '0');
        await button.click();
        await page.keyboard.press('Enter');
        await page.keyboard.press('Space');
        expect(await clicks(page)).toBe(3);
    },
    link: async ({ page }) => {
        await mount(page, '<pttrn-list-item href="/files/13" label="File 13"></pttrn-list-item>');
        const link = page.getByRole('link', { name: 'File 13' });
        await expect(link).toHaveAttribute('href', '/files/13');
        expect(await link.evaluate((el) => el.tagName)).toBe('A');
    },
    'disabled-readonly': async ({ page }) => {
        await mount(page, '<pttrn-list-item label="Open" clickable disabled></pttrn-list-item>');
        await countClicks(page);
        await expect(row(page)).toHaveAttribute('data-disabled');
        await expect(row(page)).not.toHaveAttribute('data-action');
        await row(page).click({ force: true });
        await page.locator('pttrn-list-item').evaluate((el) => (el as HTMLElement).click());
        expect(await clicks(page)).toBe(0);

        await mount(page, '<pttrn-list-item label="Open" clickable readonly></pttrn-list-item>');
        await countClicks(page);
        await expect(row(page)).toHaveAttribute('data-readonly');
        await row(page).click();
        expect(await clicks(page)).toBe(0);
    },
    'role-override': async ({ page }) => {
        await mount(
            page,
            '<pttrn-list-item label="Option A" role="option" aria-selected="false" clickable></pttrn-list-item>',
        );
        await countClicks(page);
        const option = page.getByRole('option', { name: 'Option A' });
        expect(await option.evaluate((el) => el.localName)).toBe('pttrn-list-item');
        await expect(option).toHaveAttribute('tabindex', '0');
        await expect(page.getByRole('button')).toHaveCount(0);
        await option.focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press('Space');
        expect(await clicks(page)).toBe(2);
    },
    'empty-label': async ({ page }) => {
        await mount(page, '<pttrn-list-item label=""></pttrn-list-item>');
        expect(await page.locator('pttrn-list-item').evaluate((el) => el.shadowRoot!.children.length)).toBe(0);
    },
    'axe-clean': async ({ page }) => {
        for (const html of Object.values(PRESETS)) {
            await mount(page, html);
            const results = await new AxeBuilder({ page }).include('pttrn-list-item').analyze();
            expect(results.violations).toEqual([]);
        }
    },
});
